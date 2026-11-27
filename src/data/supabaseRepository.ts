/**
 * Data reads and writes stay on the mock store in this milestone.
 * Auth is separate: src/lib/supabase.ts uses the anon key only for Google sign-in
 * and complete_onboarding. Do not put the service role key in the client.
 *
 * When the hosted project exists, the SQL in supabase/migrations is the contract:
 * profiles (private by default, is_minor computed, no phone or address in profile_public),
 * activities, participants, messages (activity chat only), reports, blocks, parent_consents.
 */
export function supabaseDataEnabled(): boolean {
  return false;
}
