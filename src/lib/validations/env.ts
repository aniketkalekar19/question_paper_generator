export interface ClientEnv {
  NEXT_PUBLIC_SUPABASE_URL: string;
  NEXT_PUBLIC_SUPABASE_ANON_KEY: string;
}

export interface ServerEnv extends ClientEnv {
  SUPABASE_SERVICE_ROLE_KEY?: string;
  GEMINI_API_KEY?: string;
}

export interface EnvValidationResult<T> {
  isValid: boolean;
  errors: string[];
  data?: T;
}

/**
 * Normalizes a Supabase project URL to strip accidental trailing slashes
 * or /rest/v1 paths, ensuring compatibility with @supabase/supabase-js.
 */
export function normalizeSupabaseUrl(rawUrl: string): string {
  let url = rawUrl.trim().replace(/\/+$/, "");
  if (url.endsWith("/rest/v1")) {
    url = url.slice(0, -"/rest/v1".length).replace(/\/+$/, "");
  }
  return url;
}

/**
 * Validates public Supabase client environment variables.
 * Safe to call on both browser and server.
 */
export function validateClientEnv(): EnvValidationResult<ClientEnv> {
  const errors: string[] = [];
  const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const rawAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!rawUrl || rawUrl.trim() === "") {
    errors.push("NEXT_PUBLIC_SUPABASE_URL is missing or empty.");
  } else {
    try {
      const parsed = new URL(rawUrl.trim());
      if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
        errors.push("NEXT_PUBLIC_SUPABASE_URL must use http:// or https://.");
      }
    } catch {
      errors.push("NEXT_PUBLIC_SUPABASE_URL must be a valid URL.");
    }
  }

  if (!rawAnonKey || rawAnonKey.trim() === "") {
    errors.push("NEXT_PUBLIC_SUPABASE_ANON_KEY is missing or empty.");
  }

  if (errors.length > 0) {
    return { isValid: false, errors };
  }

  return {
    isValid: true,
    errors: [],
    data: {
      NEXT_PUBLIC_SUPABASE_URL: normalizeSupabaseUrl(rawUrl!),
      NEXT_PUBLIC_SUPABASE_ANON_KEY: rawAnonKey!.trim(),
    },
  };
}

/**
 * Validates server-side environment variables and checks for critical security misconfigurations.
 * MUST only be called on the server.
 */
export function validateServerEnv(): EnvValidationResult<ServerEnv> {
  const clientValidation = validateClientEnv();
  const errors = [...clientValidation.errors];

  // Critical security check: Never expose secret or service-role keys on NEXT_PUBLIC_
  if (process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY) {
    errors.push(
      "SECURITY ERROR: Service role key found in NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY. Secret keys must never have the NEXT_PUBLIC_ prefix."
    );
  }

  if (process.env.NEXT_PUBLIC_GEMINI_API_KEY) {
    errors.push(
      "SECURITY ERROR: Gemini API key found in NEXT_PUBLIC_GEMINI_API_KEY. AI provider keys must never have the NEXT_PUBLIC_ prefix."
    );
  }

  if (errors.length > 0) {
    return { isValid: false, errors };
  }

  return {
    isValid: true,
    errors: [],
    data: {
      ...clientValidation.data!,
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY?.trim(),
      GEMINI_API_KEY: process.env.GEMINI_API_KEY?.trim(),
    },
  };
}
