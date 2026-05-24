import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { validateAndActivateCode } from '@/lib/supabase/queries';
import { activationCodeSchema } from '@/lib/validators';
import { checkRateLimit } from '@/lib/rate-limit';

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Strict rate limit for activation attempts
  const rl = await checkRateLimit(userId, 'auth');
  if (!rl.success) return NextResponse.json({ error: 'Too many activation attempts. Try again later.' }, { status: 429 });

  const body = await req.json();
  const parsed = activationCodeSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid code format' }, { status: 400 });

  const result = await validateAndActivateCode(userId, parsed.data.code);

  if (!result.success) {
    return NextResponse.json({ error: result.message }, { status: 400 });
  }

  return NextResponse.json({ success: true, plan: result.plan });
}
