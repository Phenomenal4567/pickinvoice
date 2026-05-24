import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { AppLayout } from '@/components/layout/AppLayout';
import { DashboardClient } from '@/components/dashboard/DashboardClient';
import { getProfile, getDashboardStats, getDocuments } from '@/lib/supabase/queries';

export default async function DashboardPage() {
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');

  const profile = await getProfile(userId!);

  if (!profile || !profile.onboarding_completed) {
    redirect('/onboarding');
  }

  const safeProfile = profile;

  const [stats, { data: recentDocs }] = await Promise.all([
    getDashboardStats(userId!),
    getDocuments(userId!, { limit: 8 }),
  ]);

  return (
    <AppLayout>
      <DashboardClient profile={safeProfile!} stats={stats} recentDocs={recentDocs} />
    </AppLayout>
  );
}
