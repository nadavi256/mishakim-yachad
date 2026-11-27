/**
 * Seam for a later Supabase backend. v1 does not create a project and does not
 * call the network.
 *
 * Planned mapping (see the product schema draft):
 * - profiles            public.profiles            (no phone, no home address)
 * - user sports         public.user_sports
 * - activities          public.activities + meeting_locations
 * - publish             rpc publish_activity(draft, idempotency_key)
 * - join / request      rpc join_or_request(activity_id, message, idempotency_key)
 * - cancel join         rpc cancel_participation(activity_id)
 * - messages            public.messages via Realtime, gated by can_access_chat
 * - notifications       public.notifications via Realtime
 * - files               storage buckets avatars, activity-covers
 *
 * Phone OTP auth, Postgres RLS, and the private.user_private table stay server-side.
 * The client never selects phone or home address.
 */
export function createSupabaseRepository(): never {
  throw new Error("Supabase לא מחובר בגרסה הזו. אין פרויקט ואין קריאות רשת.");
}
