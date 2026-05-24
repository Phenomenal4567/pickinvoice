import { auth } from '@clerk/nextjs/server';
import { redirect, notFound } from 'next/navigation';
import { AppLayout } from '@/components/layout/AppLayout';
import { InvoiceEditor } from '@/components/invoice/InvoiceEditor';
import { getProfile, getClients, getProducts, getDocumentById } from '@/lib/supabase/queries';

export default async function EditInvoicePage({ params }: { params: { id: string } }) {
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');

  const [profile, clients, products, document] = await Promise.all([
    getProfile(userId!),
    getClients(userId!),
    getProducts(userId!),
    getDocumentById(userId, params.id),
  ]);

  if (!profile) redirect('/onboarding');
  if (!document) notFound();

  const safeProfile = profile;
  const safeDocument = document;

  return (
    <AppLayout>
      <InvoiceEditor
        mode="edit"
        docType={safeDocument!.document_type}
        profile={safeProfile!}
        clients={clients}
        products={products}
        document={safeDocument!}
      />
    </AppLayout>
  );
}
