import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { AppLayout } from '@/components/layout/AppLayout';
import { ClientsClient } from '@/components/dashboard/ClientsClient';
import { getClients } from '@/lib/supabase/queries';

export default async function ClientsPage() {
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');
  const clients = await getClients(userId!);
  return (
    <AppLayout>
      <ClientsClient clients={clients} />
    </AppLayout>
  );
}
