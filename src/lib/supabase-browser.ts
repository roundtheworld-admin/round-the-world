import { createClient as createSupabaseClient, type SupabaseClient } from '@supabase/supabase-js';

// Use the standard Supabase JS client (not @supabase/ssr) for the browser.
// This gives us:
//  1. Implicit auth flow -- magic link returns a #access_token hash fragment
//     that the client picks up automatically. No PKCE code verifier cookie
//     needed, so it works on mobile where the email app opens links in a
//     different browser context.
//  2. localStorage session persistence -- the session token is stored in
//     localStorage so users stay logged in across page reloads and visits.

let client: SupabaseClient<any, 'public', any> | null = null;

export function createClient() {
  if (client) return client;

  client = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        flowType: 'implicit',
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
      },
    }
  );

  return client;
}
