import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { Database } from "@/types/database.types";
import { validateServerEnv } from "@/lib/validations/env";

/**
 * Creates an administrative Supabase client using the Service Role Key.
 *
 * STRICTLY SERVER-ONLY.
 * Never expose or import this in client-side code.
 */
export function createAdminClient() {
  if (typeof window !== "undefined") {
    throw new Error("createAdminClient must only be executed in a server environment.");
  }

  const envValidation = validateServerEnv();

  if (!envValidation.isValid || !envValidation.data) {
    throw new Error(
      `Supabase Admin Client configuration error: ${envValidation.errors.join(", ")}`
    );
  }

  if (!envValidation.data.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY is not defined in the environment. Service-role operations require this key."
    );
  }

  return createSupabaseClient<Database>(
    envValidation.data.NEXT_PUBLIC_SUPABASE_URL,
    envValidation.data.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    }
  );
}
