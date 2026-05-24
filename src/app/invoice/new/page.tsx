import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { AppLayout } from '@/components/layout/AppLayout';
import { InvoiceEditor } from '@/components/invoice/InvoiceEditor';
import { getProfile, getClients, getProducts } from '@/lib/supabase/queries';

export default async function NewInvoicePage({
  searchParams,
}: {
  searchParams: { type?: string };
}) {
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');

  const [profile, clients, products] = await Promise.all([
    getProfile(userId!),
    getClients(userId!),
    getProducts(userId!),
  ]);

  if (!profile) redirect('/onboarding');

  const safeProfile = profile;
  const docType = searchParams.type === 'receipt' ? 'receipt' : 'invoice';

  return (
    <AppLayout>
      <InvoiceEditor
        mode="new"
        docType={docType}
        profile={safeProfile!}
        clients={clients}
        products={products}
      />
    </AppLayout>
  );
}
