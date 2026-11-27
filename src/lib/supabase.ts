import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL?.trim() ?? "";
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim() ?? "";

/** True only when both public env vars are set. The GitHub Pages demo leaves them empty. */
export function isSupabaseConfigured(): boolean {
  return url.startsWith("https://") && anonKey.length > 20;
}

export const supabase: SupabaseClient | null = isSupabaseConfigured()
  ? createClient(url, anonKey, {
      auth: {
        flowType: "pkce",
        detectSessionInUrl: true,
        persistSession: true,
        autoRefreshToken: true,
      },
    })
  : null;

export function authRedirectUrl(): string {
  return `${window.location.origin}${import.meta.env.BASE_URL}`;
}

export async function signInWithGoogle(): Promise<{ error: string | null; configured: boolean }> {
  if (!supabase) return { error: null, configured: false };
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: authRedirectUrl(),
      queryParams: { prompt: "select_account" },
    },
  });
  return { error: error?.message ?? null, configured: true };
}

export async function signOut(): Promise<void> {
  if (!supabase) return;
  await supabase.auth.signOut();
}

export async function completeOnboarding(birthDate: string, parentApproved: boolean): Promise<{ error: string | null; configured: boolean }> {
  if (!supabase) return { error: null, configured: false };
  const { error } = await supabase.rpc("complete_onboarding", {
    p_birth_date: birthDate,
    p_parent_approved: parentApproved,
  });
  return { error: error?.message ?? null, configured: true };
}
