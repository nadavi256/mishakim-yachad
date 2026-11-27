import { LIMITS } from "../lib/limits";
import { dateInJerusalem, jerusalemYmd } from "../lib/format";
import { suggestTitle } from "./sports";
import type {
  Activity,
  AppNotification,
  AppState,
  Draft,
  FieldError,
  Participation,
} from "./types";

export function activityById(state: AppState, id: string): Activity | undefined {
  return state.activities.find((a) => a.id === id);
}

export function profileById(state: AppState, id: string) {
  return state.profiles.find((p) => p.user_id === id);
}

export function approvedCount(state: AppState, activityId: string): number {
  return state.participations.filter(
    (p) => p.activity_id === activityId && (p.status === "approved" || p.status === "needs_reconfirm"),
  ).length;
}

export function participationOf(state: AppState, activityId: string, userId: string): Participation | undefined {
  return state.participations.find((p) => p.activity_id === activityId && p.user_id === userId);
}

/** Published activities whose organizer is this user. Drafts stay out. */
export function publishedByOwner(state: AppState, ownerId: string): Activity[] {
  return state.activities
    .filter((a) => a.owner_id === ownerId && a.status === "published")
    .sort((a, b) => a.starts_at.localeCompare(b.starts_at));
}

export function isBlocked(state: AppState, userId: string): boolean {
  return state.blockedUserIds.includes(userId);
}

export function endMs(activity: Activity): number {
  const start = new Date(activity.starts_at).getTime();
  const minutes = activity.duration_minutes ?? 180;
  return start + minutes * 60_000;
}

export function isFinished(activity: Activity, now = new Date()): boolean {
  if (activity.status === "cancelled" || activity.status === "completed") return true;
  return endMs(activity) < now.getTime();
}

/** Organizer, or a participant who was actually approved. Pending does not unlock chat. */
export function canAccessChat(state: AppState, activityId: string, userId: string): boolean {
  const activity = activityById(state, activityId);
  if (!activity || activity.status === "draft") return false;
  if (activity.owner_id === userId) return true;
  const row = participationOf(state, activityId, userId);
  return !!row && (row.status === "approved" || row.status === "needs_reconfirm");
}

export function nextTitle(sportId: string, title: string, titleEdited: boolean): { title: string; titleEdited: boolean } {
  if (titleEdited) return { title, titleEdited: true };
  return { title: suggestTitle(sportId), titleEdited: false };
}

function ymdAdd(ymd: string, days: number): string {
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + days, 12, 0, 0)).toISOString().slice(0, 10);
}

export interface FeedQuery {
  sport: "foryou" | "all" | string;
  userSportIds: string[];
  area: "all" | string;
  when: "week" | "today" | "tomorrow" | "any";
  level: "any" | Activity["level"];
  sort: "match" | "near" | "soon";
  userArea: string;
  onlySavedPublishers: boolean;
  savedPublisherIds: string[];
  now?: Date;
}

export function filterFeed(state: AppState, query: FeedQuery): Activity[] {
  const now = query.now ?? new Date();
  const today = jerusalemYmd(now);
  const tomorrow = ymdAdd(today, 1);
  const horizon = now.getTime() + 9 * 24 * 3600 * 1000;

  const rows = state.activities.filter((activity) => {
    if (activity.status !== "published") return false;
    if (isFinished(activity, now)) return false;
    if (isBlocked(state, activity.owner_id)) return false;
    if (activity.capacity != null && approvedCount(state, activity.id) >= activity.capacity) return false;
    if (query.onlySavedPublishers && !query.savedPublisherIds.includes(activity.owner_id)) return false;

    if (query.sport === "foryou" && !query.userSportIds.includes(activity.sport_id)) return false;
    if (query.sport !== "foryou" && query.sport !== "all" && activity.sport_id !== query.sport) return false;

    if (query.area !== "all" && activity.location.city !== query.area) return false;

    if (query.level !== "any" && activity.level !== "all" && activity.level !== query.level) return false;

    const day = jerusalemYmd(new Date(activity.starts_at));
    if (query.when === "today" && day !== today) return false;
    if (query.when === "tomorrow" && day !== tomorrow) return false;
    if (query.when === "week" && new Date(activity.starts_at).getTime() > horizon) return false;
    return true;
  });

  const score = (activity: Activity) => {
    let s = 0;
    if (query.userSportIds.includes(activity.sport_id)) s += 5;
    if (activity.level === "all") s += 1;
    return s;
  };

  rows.sort((a, b) => {
    if (query.sort === "soon") return a.starts_at.localeCompare(b.starts_at);
    if (query.sort === "near") {
      const ac = a.location.city === query.userArea ? 0 : 1;
      const bc = b.location.city === query.userArea ? 0 : 1;
      if (ac !== bc) return ac - bc;
      return a.starts_at.localeCompare(b.starts_at);
    }
    const ds = score(b) - score(a);
    if (ds !== 0) return ds;
    return a.starts_at.localeCompare(b.starts_at);
  });
  return rows;
}

export function validateStep(draft: Draft, step: 1 | 2 | 3, now = new Date()): FieldError[] {
  const errors: FieldError[] = [];
  if (step >= 1) {
    if (!draft.sport_id) errors.push({ field: "sport", message: "בחרו ענף" });
    const len = draft.title.trim().length;
    if (len < LIMITS.titleMin || len > LIMITS.titleMax) {
      errors.push({ field: "title", message: "הכותרת צריכה להיות בין 3 ל-100 תווים" });
    }
    if (draft.description.length > LIMITS.descriptionMax) {
      errors.push({ field: "description", message: "התיאור ארוך מדי" });
    }
  }
  if (step >= 2) {
    if (!draft.starts_at) errors.push({ field: "starts_at", message: "בחרו תאריך ושעה" });
    else if (new Date(draft.starts_at).getTime() <= now.getTime()) {
      errors.push({ field: "starts_at", message: "המועד צריך להיות בעתיד" });
    }
    if (draft.duration_minutes != null && draft.duration_minutes <= 0) {
      errors.push({ field: "duration", message: "משך הפעילות צריך להיות מספר חיובי" });
    }
    if (!draft.place_name.trim()) errors.push({ field: "place", message: "בחרו מקום מפגש או הזינו שם" });
    if (!draft.address.trim()) errors.push({ field: "address", message: "הוסיפו כתובת או תיאור של המקום" });
    if (draft.lat == null || draft.lon == null) errors.push({ field: "pin", message: "סמנו נקודת מפגש על המפה" });
    if (draft.meeting_note.length > LIMITS.meetingNoteMax) {
      errors.push({ field: "meeting_note", message: "הוראות ההגעה ארוכות מדי" });
    }
  }
  if (step >= 3) {
    if (draft.capacity_mode === "limited" && (!draft.capacity || draft.capacity <= 0)) {
      errors.push({ field: "capacity", message: "הכמות צריכה להיות מספר חיובי" });
    }
    if (draft.cost_mode === "paid" && draft.cost_amount <= 0) {
      errors.push({ field: "cost", message: "המחיר צריך להיות סכום חיובי" });
    }
  }
  return errors;
}

function notice(partial: Omit<AppNotification, "id" | "read_at" | "created_at"> & { created_at?: string }, now: Date): AppNotification {
  return {
    id: `n-${partial.recipient_id}-${partial.type}-${now.getTime()}-${Math.random().toString(36).slice(2, 6)}`,
    read_at: null,
    created_at: now.toISOString(),
    ...partial,
  };
}

export function applyPublish(
  state: AppState,
  draft: Draft,
  key: string,
  now = new Date(),
): { state: AppState; activityId?: string; error?: string } {
  const existing = state.idempotency[key];
  if (existing) return { state, activityId: existing };
  const errors = validateStep(draft, 3, now);
  if (errors.length) return { state, error: errors[0].message };

  const id = `a-${now.getTime()}`;
  const activity: Activity = {
    id,
    owner_id: draft.owner_id,
    sport_id: draft.sport_id,
    title: draft.title.trim(),
    subtitle: draft.description.trim().slice(0, 80) || "פעילות חדשה",
    description: draft.description.trim(),
    level: draft.level,
    starts_at: draft.starts_at!,
    timezone: "Asia/Jerusalem",
    duration_minutes: draft.duration_minutes,
    capacity: draft.capacity_mode === "limited" ? draft.capacity : null,
    cost_amount: draft.cost_mode === "paid" ? draft.cost_amount : 0,
    currency: "ILS",
    payment_note:
      draft.cost_mode === "paid"
        ? draft.payment_note || "התשלום מתואם מחוץ לאפליקציה. אין חיוב ואין החזר כאן."
        : "",
    join_policy: draft.join_policy,
    status: "published",
    version: 1,
    published_at: now.toISOString(),
    location: {
      place_name: draft.place_name.trim(),
      address: draft.address.trim(),
      city: draft.city,
      lat: draft.lat!,
      lon: draft.lon!,
      meeting_note: draft.meeting_note.trim(),
    },
  };

  return {
    activityId: id,
    state: {
      ...state,
      activities: [...state.activities, activity],
      drafts: state.drafts.filter((d) => d.id !== draft.id),
      idempotency: { ...state.idempotency, [key]: id },
      notifications: [
        ...state.notifications,
        notice(
          {
            recipient_id: draft.owner_id,
            type: "published",
            title: "הפעילות פורסמה",
            body: activity.title,
            entity_id: id,
          },
          now,
        ),
      ],
    },
  };
}

export function applyJoin(
  state: AppState,
  activityId: string,
  userId: string,
  message: string | undefined,
  now = new Date(),
): { state: AppState; error?: string; status?: Participation["status"] } {
  const activity = activityById(state, activityId);
  if (!activity || activity.status === "cancelled") return { state, error: activity?.status === "cancelled" ? "הפעילות בוטלה" : "הפעילות לא זמינה" };
  if (activity.status !== "published") return { state, error: "הפעילות לא זמינה" };
  if (activity.owner_id === userId) return { state, error: "אתם מארגנים את הפעילות הזו" };
  if (isBlocked(state, activity.owner_id)) return { state, error: "לא ניתן להצטרף לפעילות הזו" };
  if (new Date(activity.starts_at).getTime() <= now.getTime()) return { state, error: "הפעילות כבר התחילה" };

  const existing = participationOf(state, activityId, userId);
  if (existing && (existing.status === "approved" || existing.status === "needs_reconfirm")) {
    return { state, error: "כבר הצטרפתם לפעילות", status: existing.status };
  }
  if (existing && existing.status === "pending") {
    return { state, error: "כבר יש בקשה ממתינה", status: "pending" };
  }

  const nextStatus: Participation["status"] = activity.join_policy === "immediate" ? "approved" : "pending";
  if (nextStatus === "approved") {
    const count = approvedCount(state, activityId);
    if (activity.capacity != null && count >= activity.capacity) return { state, error: "הפעילות מלאה" };
  }

  const row: Participation = {
    id: existing?.id ?? `p-${activityId}-${userId}`,
    activity_id: activityId,
    user_id: userId,
    status: nextStatus,
    request_message: message,
    requested_at: now.toISOString(),
    approved_at: nextStatus === "approved" ? now.toISOString() : undefined,
  };
  const participations = existing
    ? state.participations.map((p) => (p.id === existing.id ? row : p))
    : [...state.participations, row];

  const notifications = [...state.notifications];
  if (nextStatus === "pending") {
    notifications.push(
      notice(
        {
          recipient_id: activity.owner_id,
          type: "join_request",
          title: "בקשת הצטרפות",
          body: activity.title,
          entity_id: activityId,
        },
        now,
      ),
    );
  } else {
    notifications.push(
      notice(
        {
          recipient_id: userId,
          type: "joined",
          title: "הצטרפתם לפעילות",
          body: activity.title,
          entity_id: activityId,
        },
        now,
      ),
    );
  }

  return { state: { ...state, participations, notifications }, status: nextStatus };
}

export function applyCancelParticipation(
  state: AppState,
  activityId: string,
  userId: string,
  now = new Date(),
): { state: AppState; error?: string } {
  const existing = participationOf(state, activityId, userId);
  if (!existing || (existing.status !== "approved" && existing.status !== "pending" && existing.status !== "needs_reconfirm")) {
    return { state, error: "אין השתתפות פעילה לבטל" };
  }
  const activity = activityById(state, activityId);
  const participations = state.participations.map((p) =>
    p.id === existing.id ? { ...p, status: "cancelled" as const, cancelled_at: now.toISOString() } : p,
  );
  const notifications = activity
    ? [
        ...state.notifications,
        notice(
          {
            recipient_id: activity.owner_id,
            type: "participant_cancelled",
            title: "משתתף ביטל",
            body: activity.title,
            entity_id: activityId,
          },
          now,
        ),
      ]
    : state.notifications;
  return { state: { ...state, participations, notifications } };
}

export function emptyDraft(ownerId: string, sportId: string, now = new Date()): Draft {
  const sport = sportId || "basketball";
  return {
    id: "draft-current",
    owner_id: ownerId,
    sport_id: sport,
    title: suggestTitle(sport),
    title_edited: false,
    description: "",
    level: "all",
    starts_at: dateInJerusalem(1, 19, 0, now),
    timezone: "Asia/Jerusalem",
    duration_minutes: 60,
    place_name: "",
    address: "",
    city: "",
    lat: null,
    lon: null,
    pin_x: 50,
    pin_y: 58,
    meeting_note: "",
    capacity: null,
    capacity_mode: "unlimited",
    cost_amount: 0,
    cost_mode: "free",
    currency: "ILS",
    payment_note: "",
    join_policy: "immediate",
    last_step: 1,
    updated_at: now.toISOString(),
  };
}
