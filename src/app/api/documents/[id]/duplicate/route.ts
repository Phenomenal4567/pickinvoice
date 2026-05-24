import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getDocumentById, createDocument, getProfile, getNextDocumentNumber, incrementDocumentCounter } from '@/lib/supabase/queries';
import { checkRateLimit } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Rate limit
  const rl = await checkRateLimit(userId, 'general');
  if (!rl.success) return NextResponse.json({ error: 'Too many requests' }, { status: 429 });

  // Fetch the source document (scoped to this user)
  const source = await getDocumentById(userId, params.id);
  if (!source) return NextResponse.json({ error: 'Document not found' }, { status: 404 });

  // Fetch profile so we can generate the next number
  const profile = await getProfile(userId);
  if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 });

  try {
    // Generate a new document number for the clone
    const newDocumentNumber = await getNextDocumentNumber(userId, source.document_type, profile);

    // Strip fields that must not be cloned
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { ...rest } = document;

    // Build the cloned document
    const clonePayload = {
      ...rest,
      document_number: newDocumentNumber,
      status: 'draft' as const,
      issue_date: new Date().toISOString().split('T')[0],
      // Reset payment fields
      paid_date: null,
      amount_paid: 0,
      balance_due: source.total,
      // Clear share / pdf caches
      pdf_url: '',
      qr_code_url: '',
      viewed_at: null,
      viewed_count: 0,
    };

    const newDoc = await createDocument(userId, clonePayload);

    // Bump the document counter so the next doc gets a unique number
    await incrementDocumentCounter(userId, source.document_type);

    return NextResponse.json({ document: newDoc }, { status: 201 });
  } catch (err) {
    console.error('[Duplicate]', err);
    return NextResponse.json({ error: (err as Error).message || 'Failed to duplicate document' }, { status: 500 });
  }
}
