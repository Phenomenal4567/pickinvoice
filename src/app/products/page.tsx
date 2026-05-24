import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { AppLayout } from '@/components/layout/AppLayout';
import { ProductsClient } from '@/components/dashboard/ProductsClient';
import { getProducts, getProfile } from '@/lib/supabase/queries';

export default async function ProductsPage() {
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');
  const [products, profile] = await Promise.all([getProducts(userId!), getProfile(userId!)]);
  return (
    <AppLayout>
      <ProductsClient products={products} currency={profile?.default_currency || 'NGN'} />
    </AppLayout>
  );
}
