import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import {
  getDocuments, createDocument, getProfile,
  getNextDocumentNumber, incrementDocumentCounter
} from '@/lib/supabase/queries';
import { documentSchema } from '@/lib/validators';
import { checkRateLimit } from '@/lib/rate-limit';
import { calculateLineItems } from '@/lib/utils';
import type { DocumentType, DocumentStatus } from '@/types';

export async function GET(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const rl = await checkRateLimit(userId, 'general');
  if (!rl.success) return NextResponse.json({ error: 'Too many requests' }, { status: 429 });

  const sp = req.nextUrl.searchParams;
  const { data, count } = await getDocuments(userId, {
    type: sp.get('type') as DocumentType || undefined,
    status: sp.get('status') as DocumentStatus | undefined || undefined,
    search: sp.get('search') || undefined,
    from: sp.get('from') || undefined,
    to: sp.get('to') || undefined,
    limit: sp.get('limit') ? parseInt(sp.get('limit')!) : 20,
    offset: sp.get('offset') ? parseInt(sp.get('offset')!) : 0,
  });

  return NextResponse.json({ documents: data, count });
}

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const rl = await checkRateLimit(userId, 'general');
  if (!rl.success) return NextResponse.json({ error: 'Too many requests' }, { status: 429 });

  const body = await req.json();
  const parsed = documentSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const data = parsed.data;

  try {
    const profile = await getProfile(userId);
    if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 });

    const document_number = await getNextDocumentNumber(userId, data.document_type, profile);
    const { subtotal, discount_amount, tax_amount, total } = calculateLineItems(
      data.line_items,
      data.tax_rate,
      data.discount_type,
      data.discount_value
    );

    const doc = await createDocument(userId, {
      ...data,
      document_number,
      subtotal,
      discount_amount,
      tax_amount,
      total,
      balance_due: total,
      sender_name: profile.business_name,
      sender_email: profile.email,
      sender_address: `${profile.address}${profile.city ? ', ' + profile.city : ''}`,
      sender_phone: profile.phone,
      sender_logo_url: profile.logo_url,
      sender_brand_color: profile.brand_color,
      sender_tax_number: profile.tax_number,
      template: data.template || profile.preferred_template,
      currency: data.currency || profile.default_currency,
      status: data.status || 'draft',
    });

    await incrementDocumentCounter(userId, data.document_type);

    return NextResponse.json({ document: doc }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
