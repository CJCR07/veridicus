import { createBrowserClient } from '@supabase/ssr';
import { Database } from '@/../shared/types/database';

/**
 * Client-side Supabase client for use in Browser Components
 */
export const createClient = () =>
  createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookieOptions: {
        name: "sb-v-auth-token",
      }
    }
  );

// For backward compatibility while we refactor components
export const supabase = createClient();
