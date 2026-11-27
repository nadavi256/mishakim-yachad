import {
  applyCancelParticipation,
  applyJoin,
  applyPublish,
  approvedCount,
  canAccessChat,
  participationOf,
} from "./logic";
import { buildSeed } from "./seed";
import { CURRENT_USER_ID, SCHEMA_VERSION, type AppState, type Draft, type Profile, type Report } from "./types";

const STORAGE_KEY = "mishakim-yachad-state-v1";

function loadState(): AppState {
  if (typeof localStorage === "undefined") return buildSeed();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return buildSeed();
    const parsed = JSON.parse(raw) as AppState;
    if (!parsed || parsed.schema !== SCHEMA_VERSION || !Array.isArray(parsed.activities)) return buildSeed();
    return parsed;
  } catch {
    return buildSeed();
  }
}

/**
 * In-memory store with the same operations a Supabase repository will expose.
 * Phone numbers and home addresses are not fields on this model.
 */
export class MemoryRepository {
  private state: AppState;

  constructor(options?: { persist?: boolean; state?: AppState }) {
    this.persistEnabled = options?.persist !== false && typeof localStorage !== "undefined";
    this.state = options?.state ?? (this.persistEnabled ? loadState() : buildSeed());
  }

  private persistEnabled: boolean;

  getState(): AppState {
    return this.state;
  }

  private commit(next: AppState) {
    this.state = next;
    if (!this.persistEnabled || typeof localStorage === "undefined") return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }

  reset() {
    if (typeof localStorage !== "undefined") localStorage.removeItem(STORAGE_KEY);
    this.commit(buildSeed());
  }

  saveDraft(draft: Draft) {
    const next = { ...draft, updated_at: new Date().toISOString() };
    const drafts = this.state.drafts.some((d) => d.id === draft.id)
      ? this.state.drafts.map((d) => (d.id === draft.id ? next : d))
      : [...this.state.drafts, next];
    this.commit({ ...this.state, drafts });
  }

  discardDraft(id: string) {
    this.commit({ ...this.state, drafts: this.state.drafts.filter((d) => d.id !== id) });
  }

  publish(draft: Draft, key: string, now = new Date()) {
    const result = applyPublish(this.state, draft, key, now);
    if (result.activityId) this.commit(result.state);
    return result;
  }

  join(activityId: string, message?: string, now = new Date()) {
    const result = applyJoin(this.state, activityId, CURRENT_USER_ID, message, now);
    if (!result.error || result.status) {
      if (result.state !== this.state) this.commit(result.state);
    }
    return result;
  }

  cancelParticipation(activityId: string, now = new Date()) {
    const result = applyCancelParticipation(this.state, activityId, CURRENT_USER_ID, now);
    if (!result.error) this.commit(result.state);
    return result;
  }

  acceptInvitation(invitationId: string, now = new Date()) {
    const inv = this.state.invitations.find((i) => i.id === invitationId && i.recipient_id === CURRENT_USER_ID);
    if (!inv || inv.status !== "pending") return { error: "ההזמנה לא זמינה" };
    const activity = this.state.activities.find((a) => a.id === inv.activity_id);
    if (!activity || activity.status !== "published") return { error: "הפעילות לא זמינה" };
    if (new Date(activity.starts_at).getTime() <= now.getTime()) return { error: "הפעילות כבר התחילה" };
    if (activity.capacity != null && approvedCount(this.state, activity.id) >= activity.capacity) {
      return { error: "הפעילות מלאה" };
    }
    const existing = participationOf(this.state, activity.id, CURRENT_USER_ID);
    const row = {
      id: existing?.id ?? `p-${activity.id}-${CURRENT_USER_ID}`,
      activity_id: activity.id,
      user_id: CURRENT_USER_ID,
      status: "approved" as const,
      approved_at: now.toISOString(),
    };
    const participations = existing
      ? this.state.participations.map((p) => (p.id === existing.id ? row : p))
      : [...this.state.participations, row];
    this.commit({
      ...this.state,
      participations,
      invitations: this.state.invitations.map((i) => (i.id === invitationId ? { ...i, status: "accepted" as const } : i)),
    });
    return {};
  }

  declineInvitation(invitationId: string) {
    this.commit({
      ...this.state,
      invitations: this.state.invitations.map((i) =>
        i.id === invitationId ? { ...i, status: "declined" as const } : i,
      ),
    });
  }

  toggleSavedProfile(profileId: string) {
    if (profileId === CURRENT_USER_ID) return;
    const has = this.state.savedProfileIds.includes(profileId);
    this.commit({
      ...this.state,
      savedProfileIds: has
        ? this.state.savedProfileIds.filter((id) => id !== profileId)
        : [...this.state.savedProfileIds, profileId],
    });
  }

  toggleFollow(publisherId: string) {
    if (publisherId === CURRENT_USER_ID) return;
    const has = this.state.followedPublisherIds.includes(publisherId);
    this.commit({
      ...this.state,
      followedPublisherIds: has
        ? this.state.followedPublisherIds.filter((id) => id !== publisherId)
        : [...this.state.followedPublisherIds, publisherId],
    });
  }

  toggleBookmark(activityId: string) {
    const has = this.state.savedActivityIds.includes(activityId);
    this.commit({
      ...this.state,
      savedActivityIds: has
        ? this.state.savedActivityIds.filter((id) => id !== activityId)
        : [...this.state.savedActivityIds, activityId],
    });
  }

  sendMessage(activityId: string, body: string, now = new Date()) {
    const text = body.trim();
    if (!text) return { error: "אי אפשר לשלוח הודעה ריקה" };
    if (text.length > 2000) return { error: "ההודעה ארוכה מדי" };
    if (!canAccessChat(this.state, activityId, CURRENT_USER_ID)) {
      return { error: "הצ'אט פתוח רק למארגן ולמשתתפים שאושרו" };
    }
    this.commit({
      ...this.state,
      messages: [
        ...this.state.messages,
        {
          id: `m-${now.getTime()}`,
          activity_id: activityId,
          sender_id: CURRENT_USER_ID,
          body: text,
          created_at: now.toISOString(),
        },
      ],
    });
    return {};
  }

  markAllRead(now = new Date()) {
    this.commit({
      ...this.state,
      notifications: this.state.notifications.map((n) =>
        n.recipient_id === CURRENT_USER_ID && !n.read_at ? { ...n, read_at: now.toISOString() } : n,
      ),
    });
  }

  cancelActivity(activityId: string) {
    const activity = this.state.activities.find((a) => a.id === activityId);
    if (!activity || activity.owner_id !== CURRENT_USER_ID) return { error: "רק המארגן יכול לבטל את הפעילות" };
    this.commit({
      ...this.state,
      activities: this.state.activities.map((a) =>
        a.id === activityId ? { ...a, status: "cancelled" as const, version: a.version + 1 } : a,
      ),
    });
    return {};
  }

  updateProfile(patch: Pick<Profile, "display_name" | "bio" | "general_area" | "sports">) {
    this.commit({
      ...this.state,
      profiles: this.state.profiles.map((p) => (p.user_id === CURRENT_USER_ID ? { ...p, ...patch } : p)),
    });
  }

  report(input: Omit<Report, "id" | "reporter_id" | "created_at">) {
    const row: Report = {
      ...input,
      id: `r-${Date.now()}`,
      reporter_id: CURRENT_USER_ID,
      created_at: new Date().toISOString(),
    };
    this.commit({ ...this.state, reports: [...this.state.reports, row] });
  }

  blockUser(userId: string) {
    if (userId === CURRENT_USER_ID || this.state.blockedUserIds.includes(userId)) return;
    this.commit({ ...this.state, blockedUserIds: [...this.state.blockedUserIds, userId] });
  }

  unblockUser(userId: string) {
    this.commit({ ...this.state, blockedUserIds: this.state.blockedUserIds.filter((id) => id !== userId) });
  }
}
