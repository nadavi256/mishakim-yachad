import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = resolve(process.cwd(), "supabase");
const schema = readFileSync(resolve(root, "migrations/20261127210000_core_schema.sql"), "utf8");
const rls = readFileSync(resolve(root, "migrations/20261127211000_rls_and_onboarding.sql"), "utf8");
const sql = `${schema}\n${rls}`;

const tables = [
  "public.profiles",
  "public.user_sports",
  "public.sports",
  "public.activities",
  "public.meeting_locations",
  "public.participants",
  "public.messages",
  "public.reports",
  "public.blocks",
  "public.parent_consents",
  "private.user_private",
];

describe("supabase schema", () => {
  it("enables and forces RLS on every product table", () => {
    for (const table of tables) {
      expect(sql).toContain(`alter table ${table} enable row level security`);
      expect(sql).toContain(`alter table ${table} force row level security`);
    }
  });

  it("keeps phone, address, and birth date out of the public profile view", () => {
    const start = schema.indexOf("create view public.profile_public");
    const end = schema.indexOf("where visibility = 'public';", start);
    const view = schema.slice(start, end);
    expect(view).toContain("security_invoker = true");
    expect(view).toContain("general_area");
    expect(view).not.toContain("birth_date");
    expect(view).not.toContain("phone");
    expect(view).not.toContain("home_address");
    expect(view).not.toContain("precise_lat");
  });

  it("limits chat to the organizer and approved participants, with no private thread", () => {
    expect(rls).toContain("private.can_access_chat");
    expect(rls).toContain("status in ('approved', 'needs_reconfirm')");
    expect(schema).not.toContain("direct_messages");
    expect(schema).toContain("messages_are_activity_chat");
    expect(rls).toContain("private.is_blocked");
  });

  it("requires a birth date and a parent flag under 16", () => {
    expect(rls).toContain("p_birth_date > (current_date - interval '18 years')");
    expect(rls).toContain("parent approval required");
    expect(schema).toContain("create table public.parent_consents");
    expect(schema).toContain("birth_date date not null");
  });

  it("does not let a participant approve themselves", () => {
    expect(rls).toContain("status = 'pending'");
    expect(rls).toContain("public.approve_participant");
  });
});
