import { createServerClient as createSupabaseServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { Database } from "@/types/database.types";
import { validateClientEnv } from "@/lib/validations/env";

/**
 * Creates a Supabase client for use in Server Components, Server Actions,
 * and Route Handlers.
 */
export function createClient() {
  const envValidation = validateClientEnv();

  if (!envValidation.isValid || !envValidation.data) {
    throw new Error(
      `Supabase Server Client configuration error: ${envValidation.errors.join(", ")}`
    );
  }

  const cookieStore = cookies();

  return createSupabaseServerClient<Database>(
    envValidation.data.NEXT_PUBLIC_SUPABASE_URL,
    envValidation.data.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Setting cookies in a read-only Server Component context is safely ignored.
          }
        },
      },
    }
  );
}

export const createServerClient = createClient;
