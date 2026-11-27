/** Domain types shaped like the future Supabase tables. No phone, no home address. */

export type Level = "all" | "beginner" | "intermediate" | "advanced";
export type JoinPolicy = "immediate" | "approval";
export type ActivityStatus = "draft" | "published" | "cancelled" | "completed" | "suspended";
export type ParticipationStatus = "pending" | "approved" | "rejected" | "cancelled" | "needs_reconfirm";
export type UserRole = "participant" | "coach";

export const CURRENT_USER_ID = "u-liron";
export const SCHEMA_VERSION = 1;

export interface UserSport {
  sport_id: string;
  level: Level;
}

export interface Profile {
  user_id: string;
  display_name: string;
  bio: string;
  /** City or region only — never a home address. */
  general_area: string;
  role: UserRole;
  role_label: string;
  visibility: "public" | "private";
  sports: UserSport[];
  avatar: "liron" | "daniel" | "yossi" | "maya" | "omer";
  pronoun: "m" | "f";
  /** Self-entered coach text. Not a verified credential. */
  specialty_note?: string;
}

export interface MeetingLocation {
  place_name: string;
  address: string;
  city: string;
  lat: number;
  lon: number;
  meeting_note: string;
}

export interface Activity {
  id: string;
  owner_id: string;
  sport_id: string;
  title: string;
  subtitle: string;
  description: string;
  level: Level;
  starts_at: string;
  timezone: "Asia/Jerusalem";
  duration_minutes: number | null;
  /** null = unlimited registration slots. The organizer is not counted. */
  capacity: number | null;
  cost_amount: number;
  currency: "ILS";
  /** How to pay outside the app. Never a charge confirmation. */
  payment_note: string;
  join_policy: JoinPolicy;
  status: ActivityStatus;
  version: number;
  published_at: string | null;
  location: MeetingLocation;
}

export interface Participation {
  id: string;
  activity_id: string;
  user_id: string;
  status: ParticipationStatus;
  request_message?: string;
  requested_at?: string;
  approved_at?: string;
  cancelled_at?: string;
}

export interface Invitation {
  id: string;
  activity_id: string;
  sender_id: string;
  recipient_id: string;
  status: "pending" | "accepted" | "declined";
}

export interface ChatMessage {
  id: string;
  activity_id: string;
  sender_id: string;
  body: string;
  created_at: string;
}

export interface AppNotification {
  id: string;
  recipient_id: string;
  type: string;
  title: string;
  body: string;
  entity_id?: string;
  read_at: string | null;
  created_at: string;
}

export interface Report {
  id: string;
  reporter_id: string;
  subject_type: "profile" | "activity" | "message";
  subject_id: string;
  reason: string;
  details: string;
  created_at: string;
}

export interface Draft {
  id: string;
  owner_id: string;
  sport_id: string;
  title: string;
  title_edited: boolean;
  description: string;
  level: Level;
  starts_at: string | null;
  timezone: "Asia/Jerusalem";
  duration_minutes: number | null;
  place_name: string;
  address: string;
  city: string;
  lat: number | null;
  lon: number | null;
  pin_x: number;
  pin_y: number;
  meeting_note: string;
  capacity: number | null;
  capacity_mode: "unlimited" | "limited";
  cost_amount: number;
  cost_mode: "free" | "paid";
  currency: "ILS";
  payment_note: string;
  join_policy: JoinPolicy;
  last_step: 1 | 2 | 3;
  updated_at: string;
}

export interface AppState {
  schema: number;
  profiles: Profile[];
  activities: Activity[];
  participations: Participation[];
  invitations: Invitation[];
  messages: ChatMessage[];
  notifications: AppNotification[];
  savedProfileIds: string[];
  followedPublisherIds: string[];
  savedActivityIds: string[];
  blockedUserIds: string[];
  reports: Report[];
  drafts: Draft[];
  idempotency: Record<string, string>;
}

export interface FieldError {
  field: string;
  message: string;
}
