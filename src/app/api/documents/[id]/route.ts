import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getDocumentById, updateDocument, deleteDocument } from '@/lib/supabase/queries';
import { documentSchema } from '@/lib/validators';
import { checkRateLimit } from '@/lib/rate-limit';
import { calculateLineItems } from '@/lib/utils';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const doc = await getDocumentById(userId, params.id);
  if (!doc) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  return NextResponse.json({ document: doc });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const rl = await checkRateLimit(userId, 'general');
  if (!rl.success) return NextResponse.json({ error: 'Too many requests' }, { status: 429 });

  const body = await req.json();

  // Allow partial updates
  const updates: Record<string, unknown> = {};

  if (body.status) updates.status = body.status;
  if (body.internal_note !== undefined) updates.internal_note = body.internal_note;
  if (body.paid_date) updates.paid_date = body.paid_date;

  // Full document update
  if (body.line_items) {
    const parsed = documentSchema.partial().safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

    if (body.line_items && body.tax_rate !== undefined) {
      const { subtotal, discount_amount, tax_amount, total } = calculateLineItems(
        body.line_items,
        body.tax_rate ?? 0,
        body.discount_type ?? 'percentage',
        body.discount_value ?? 0
      );
      // Preserve amount_paid so balance_due stays correct after partial payments
      const existing = await getDocumentById(userId, params.id);
      const amountPaid = existing?.amount_paid ?? 0;
      Object.assign(updates, parsed.data, {
        subtotal,
        discount_amount,
        tax_amount,
        total,
        balance_due: Math.max(0, total - amountPaid),
      });
    } else {
      Object.assign(updates, parsed.data);
    }
  }

  try {
    const doc = await updateDocument(userId, params.id, updates);
    return NextResponse.json({ document: doc });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    await deleteDocument(userId, params.id);
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
