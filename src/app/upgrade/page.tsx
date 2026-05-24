import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { AppLayout } from '@/components/layout/AppLayout';
import { UpgradeClient } from '@/components/dashboard/UpgradeClient';
import { getProfile } from '@/lib/supabase/queries';

export default async function UpgradePage() {
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');
  const profile = await getProfile(userId!);
  if (!profile) redirect('/onboarding');
  return (
    <AppLayout>
      <UpgradeClient profile={profile} />
    </AppLayout>
  );
}
