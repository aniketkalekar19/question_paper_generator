import { createBrowserClient as createSupabaseBrowserClient } from "@supabase/ssr";
import { Database } from "@/types/database.types";
import { validateClientEnv } from "@/lib/validations/env";

/**
 * Creates a Supabase client for use in browser Client Components.
 * Automatically synchronizes auth session with browser cookies.
 */
export function createClient() {
  const envValidation = validateClientEnv();

  if (!envValidation.isValid || !envValidation.data) {
    throw new Error(
      `Supabase Browser Client configuration error: ${envValidation.errors.join(", ")}`
    );
  }

  return createSupabaseBrowserClient<Database>(
    envValidation.data.NEXT_PUBLIC_SUPABASE_URL,
    envValidation.data.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

export const createBrowserClient = createClient;
