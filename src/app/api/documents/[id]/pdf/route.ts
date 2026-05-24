import { NextRequest, NextResponse } from 'next/server';
import { getDocumentByShareToken } from '@/lib/supabase/queries';
import { renderDocumentHtml } from '@/lib/document-html';

// ─── Runtime ─────────────────────────────────────────────────────────────────
// Using nodejs runtime so we can spawn Chromium.
// In Vercel production this requires the @sparticuz/chromium pkg.
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// ─── Chromium loader ──────────────────────────────────────────────────────────
// Supports three environments:
//   1. Local dev  →  system Chrome via PUPPETEER_EXECUTABLE_PATH env var
//   2. Vercel prod →  @sparticuz/chromium (serverless Chromium)
//   3. Fallback   →  attempt chromium-min or warn clearly

async function getBrowser() {
  // --- Vercel / serverless path ---
  try {
    // Dynamic import so build doesn't fail if pkg is absent
    const chromium = await import('@sparticuz/chromium').then(m => m.default ?? m);
    const puppeteer = await import('puppeteer-core').then(m => m.default ?? m);

    const execPath = await chromium.executablePath();

    const browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: execPath,
      headless: (chromium as { headless?: boolean }).headless ?? true,
    });
    return { browser, source: 'chromium' as const };
  } catch {
    // --- Local dev fallback: system Chrome ---
    const localExec =
      process.env.PUPPETEER_EXECUTABLE_PATH ||
      process.env.CHROME_PATH ||
      // Common system locations
      (process.platform === 'darwin'
        ? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
        : process.platform === 'win32'
        ? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
        : '/usr/bin/google-chrome-stable');

    const puppeteer = await import('puppeteer-core').then(m => m.default ?? m);
    const browser = await puppeteer.launch({
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--font-render-hinting=none',
      ],
      executablePath: localExec,
      headless: true,
    });
    return { browser, source: 'local' as const };
  }
}

// ─── Handler ──────────────────────────────────────────────────────────────────

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get('token');

  // Resolve document — by share token (public) or by id (authenticated future use)
  let doc = null;
  if (token) {
    doc = await getDocumentByShareToken(token);
  } else {
    // For public share page the id param IS the doc id — but we still need
    // to allow unauthenticated access, so we query without user scoping.
    // We reuse getDocumentByShareToken pattern via a direct supabase call.
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } }
    );
    const { data } = await supabase
      .from('documents')
      .select('*')
      .eq('id', params.id)
      .neq('status', 'void')
      .single();
    doc = data;
  }

  if (!doc) {
    return NextResponse.json({ error: 'Document not found' }, { status: 404 });
  }

  // Render HTML
  const html = renderDocumentHtml(doc);

  // Launch Puppeteer
  let browser: Awaited<ReturnType<typeof getBrowser>>['browser'] | null = null;
  try {
    const result = await getBrowser();
    browser = result.browser;

    const page = await browser.newPage();

    // Set A4 viewport
    await page.setViewport({ width: 794, height: 1123, deviceScaleFactor: 1 });

    // Disable JS — pure HTML/CSS render
    await page.setJavaScriptEnabled(false);

    await page.setContent(html, {
      waitUntil: 'networkidle0',
      timeout: 25_000,
    });

    // Wait for any images (logos) to finish loading
    await page.evaluate(() => {
      return Promise.all(
        Array.from(document.images)
          .filter(img => !img.complete)
          .map(img => new Promise(res => {
            img.addEventListener('load', res);
            img.addEventListener('error', res); // Don't stall on broken images
          }))
      );
    });

    const docType = doc.document_type.charAt(0).toUpperCase() + doc.document_type.slice(1);
    const filename = `${docType}-${doc.document_number}.pdf`
      .replace(/[^a-zA-Z0-9._-]/g, '-');

    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '0', right: '0', bottom: '0', left: '0' },
    });

    await page.close();

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'private, no-store',
      },
    });
  } catch (err) {
    console.error('[PDF] generation error:', err);
    return NextResponse.json(
      {
        error: 'PDF generation failed',
        detail: process.env.NODE_ENV === 'development' ? (err as Error).message : undefined,
      },
      { status: 500 }
    );
  } finally {
    if (browser) {
      try { await browser.close(); } catch { /* ignore */ }
    }
  }
}