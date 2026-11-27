import { describe, expect, it } from "vitest";
import { applyJoin, applyPublish, approvedCount, canAccessChat, emptyDraft, filterFeed, nextTitle, publishedByOwner } from "./logic";
import { MemoryRepository } from "./memoryRepository";
import { buildSeed } from "./seed";
import { CURRENT_USER_ID } from "./types";
import { formatWhen } from "../lib/format";

const NOW = new Date("2026-11-27T18:11:00.000Z");

describe("seed and the Daniel profile bug", () => {
  const state = buildSeed(NOW);

  it("lists only activities Liron published", () => {
    const mine = publishedByOwner(state, CURRENT_USER_ID).map((a) => a.id);
    expect(mine).toContain("a-soccer");
    expect(mine).not.toContain("a-basket");
    expect(state.activities.find((a) => a.id === "a-basket")?.owner_id).toBe("u-daniel");
  });

  it("shows the home trio with the mockup day labels", () => {
    const me = state.profiles.find((p) => p.user_id === CURRENT_USER_ID)!;
    const feed = filterFeed(state, {
      sport: "foryou",
      userSportIds: me.sports.map((s) => s.sport_id),
      area: "all",
      when: "week",
      level: "any",
      sort: "soon",
      userArea: me.general_area,
      onlySavedPublishers: false,
      savedPublisherIds: [],
      now: NOW,
    }).map((a) => a.id);
    expect(feed).toEqual(["a-soccer", "a-basket", "a-tennis"]);
    expect(formatWhen(state.activities.find((a) => a.id === "a-soccer")!.starts_at, NOW)).toContain("היום");
    expect(formatWhen(state.activities.find((a) => a.id === "a-soccer")!.starts_at, NOW)).toContain("20:00");
    expect(formatWhen(state.activities.find((a) => a.id === "a-basket")!.starts_at, NOW)).toContain("מחר");
    expect(formatWhen(state.activities.find((a) => a.id === "a-tennis")!.starts_at, NOW)).toContain("יום ראשון");
  });

  it("keeps phone and home address off public profiles", () => {
    for (const profile of state.profiles) {
      expect(profile).not.toHaveProperty("phone");
      expect(profile).not.toHaveProperty("home_address");
      expect(profile.general_area).not.toMatch(/רחוב/);
    }
  });
});

describe("chat access", () => {
  const state = buildSeed(NOW);

  it("allows the organizer and approved participants only", () => {
    expect(canAccessChat(state, "a-basket", "u-daniel")).toBe(true);
    expect(canAccessChat(state, "a-basket", CURRENT_USER_ID)).toBe(true);
    expect(canAccessChat(state, "a-soccer", CURRENT_USER_ID)).toBe(true);
    expect(canAccessChat(state, "a-yoga", CURRENT_USER_ID)).toBe(false);
    expect(canAccessChat(state, "a-basket", "u-maya")).toBe(false);
  });
});

describe("publish", () => {
  it("does not overwrite a title the user edited", () => {
    const kept = nextTitle("tennis", "המשחק שלנו", true);
    expect(kept.title).toBe("המשחק שלנו");
    const fresh = nextTitle("tennis", "כדורסל בפארק", false);
    expect(fresh.title).toBe("טניס למתחילים");
  });

  it("creates one activity for a repeated idempotency key", () => {
    const state = buildSeed(NOW);
    const draft = emptyDraft(CURRENT_USER_ID, "basketball", NOW);
    draft.place_name = "מגרש הספורט בפארק";
    draft.address = "רחוב הדוגמה 12, קרית אתא";
    draft.city = "קרית אתא";
    draft.lat = 32.81;
    draft.lon = 35.1;
    draft.description = "משחק בדיקה";
    const first = applyPublish(state, draft, "key-1", NOW);
    const second = applyPublish(first.state, draft, "key-1", NOW);
    expect(first.activityId).toBe(second.activityId);
    expect(second.state.activities.filter((a) => a.owner_id === CURRENT_USER_ID && a.title === draft.title)).toHaveLength(1);
    expect(publishedByOwner(second.state, CURRENT_USER_ID).some((a) => a.id === first.activityId)).toBe(true);
    expect(publishedByOwner(second.state, CURRENT_USER_ID).some((a) => a.id === "a-basket")).toBe(false);
  });

  it("stores a published activity through the memory repository", () => {
    const repo = new MemoryRepository({ persist: false, state: buildSeed(NOW) });
    const draft = emptyDraft(CURRENT_USER_ID, "volleyball", NOW);
    draft.title = "כדורעף בדיקה";
    draft.title_edited = true;
    draft.place_name = "היכל הספורט";
    draft.address = "רחוב הדוגמה 3, חיפה";
    draft.city = "חיפה";
    draft.lat = 32.79;
    draft.lon = 35;
    const result = repo.publish(draft, "once", NOW);
    expect(result.error).toBeUndefined();
    const mine = publishedByOwner(repo.getState(), CURRENT_USER_ID);
    expect(mine.some((a) => a.id === result.activityId)).toBe(true);
    expect(mine.some((a) => a.owner_id === "u-daniel")).toBe(false);
    const again = repo.publish(draft, "once", NOW);
    expect(again.activityId).toBe(result.activityId);
    expect(repo.getState().activities.filter((a) => a.id === result.activityId)).toHaveLength(1);
  });
});

describe("join", () => {
  it("does not open chat for a pending request and does not count it", () => {
    const state = buildSeed(NOW);
    const swim = state.activities.find((a) => a.id === "a-swim")!;
    expect(swim.join_policy).toBe("approval");
    const before = approvedCount(state, "a-swim");
    const joined = applyJoin(state, "a-swim", CURRENT_USER_ID, "אפשר להצטרף?", new Date(NOW.getTime() - 86400000));
    expect(joined.status).toBe("pending");
    expect(approvedCount(joined.state, "a-swim")).toBe(before);
    expect(canAccessChat(joined.state, "a-swim", CURRENT_USER_ID)).toBe(false);
  });

  it("rejects a full activity", () => {
    const state = buildSeed(NOW);
    state.activities = state.activities.map((a) => (a.id === "a-yoga" ? { ...a, capacity: 1 } : a));
    state.participations = [
      ...state.participations,
      {
        id: "p-full",
        activity_id: "a-yoga",
        user_id: "anon-full",
        status: "approved",
        approved_at: NOW.toISOString(),
      },
    ];
    const joined = applyJoin(state, "a-yoga", CURRENT_USER_ID, undefined, new Date(NOW.getTime() - 86400000));
    expect(joined.error).toBe("הפעילות מלאה");
  });
});
