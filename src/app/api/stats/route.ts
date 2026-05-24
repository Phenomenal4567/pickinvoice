import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getDashboardStats } from '@/lib/supabase/queries';
import { checkRateLimit } from '@/lib/rate-limit';

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const rl = await checkRateLimit(userId, 'general');
  if (!rl.success) return NextResponse.json({ error: 'Too many requests' }, { status: 429 });

  const stats = await getDashboardStats(userId);
  return NextResponse.json({ stats });
}
