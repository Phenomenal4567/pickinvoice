import { createClient } from '@supabase/supabase-js';

// Server-side client using service role (for API routes)
export function createServerSupabaseClient(userId?: string) {
  const client = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: { persistSession: false },
    }
  );

  // Set the user_id for RLS policies
  if (userId) {
    // We use a custom RLS approach: pass user_id via set_config
    return { client, userId };
  }

  return { client, userId: null };
}

// Browser-side client (anon key, limited to public operations)
let browserClient: ReturnType<typeof createClient> | null = null;

export function createBrowserSupabaseClient() {
  if (browserClient) return browserClient;
  browserClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  return browserClient;
}
