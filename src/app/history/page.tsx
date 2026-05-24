import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { AppLayout } from '@/components/layout/AppLayout';
import { HistoryClient } from '@/components/dashboard/HistoryClient';
import { getDocuments, getProfile } from '@/lib/supabase/queries';
import type { DocumentType, DocumentStatus } from '@/types';

export default async function HistoryPage({
  searchParams,
}: {
  searchParams: { type?: string; status?: string; search?: string; page?: string };
}) {
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');

  const page = parseInt(searchParams.page || '1');
  const limit = 20;
  const offset = (page - 1) * limit;

  const [profile, { data: documents, count }] = await Promise.all([
    getProfile(userId!),
    getDocuments(userId!, {
      type: searchParams.type as DocumentType | undefined,
      status: searchParams.status as DocumentStatus | undefined,
      search: searchParams.search,
      limit,
      offset,
    }),
  ]);

  return (
    <AppLayout>
      <HistoryClient
        documents={documents}
        total={count}
        page={page}
        limit={limit}
        profile={profile}
        filters={{
          type: searchParams.type,
          status: searchParams.status,
          search: searchParams.search,
        }}
      />
    </AppLayout>
  );
}
