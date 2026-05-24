import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { AppLayout } from '@/components/layout/AppLayout';
import { SettingsClient } from '@/components/dashboard/SettingsClient';
import { getProfile } from '@/lib/supabase/queries';

export default async function SettingsPage() {
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');
  const profile = await getProfile(userId!);
  if (!profile) redirect('/onboarding');
  return (
    <AppLayout>
      <SettingsClient profile={profile} />
    </AppLayout>
  );
}
