import type { Level } from "../data/types";

const WEEKDAYS = ["יום ראשון", "יום שני", "יום שלישי", "יום רביעי", "יום חמישי", "יום שישי", "יום שבת"];

export const LEVEL_LABEL: Record<Level, string> = {
  all: "כל הרמות",
  beginner: "מתחילים",
  intermediate: "בינוניים",
  advanced: "מתקדמים",
};

export const LEVEL_SHORT: Record<Level, string> = {
  all: "כל הרמות",
  beginner: "מתחיל",
  intermediate: "בינוני",
  advanced: "מתקדם",
};

export function jerusalemWeekdayIndex(date: Date): number {
  const wd = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Jerusalem",
    weekday: "short",
  }).format(date);
  const map: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  return map[wd] ?? 0;
}

export function jerusalemYmd(date: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jerusalem",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function addDaysYmd(ymd: string, days: number): string {
  const [y, m, d] = ymd.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + days, 12, 0, 0));
  return dt.toISOString().slice(0, 10);
}

interface Zoned {
  y: number;
  m: number;
  d: number;
  hh: number;
  mm: number;
}

function zonedParts(date: Date): Zoned {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Jerusalem",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value);
  return { y: get("year"), m: get("month"), d: get("day"), hh: get("hour"), mm: get("minute") };
}

/** Absolute instant for a Jerusalem wall-clock time, `dayOffset` days from `now`. */
export function dateInJerusalem(dayOffset: number, hour: number, minute: number, now = new Date()): string {
  const t = zonedParts(now);
  const base = new Date(Date.UTC(t.y, t.m - 1, t.d + dayOffset, 12, 0, 0));
  const p = zonedParts(base);
  const deltaMin = hour * 60 + minute - (p.hh * 60 + p.mm);
  return new Date(base.getTime() + deltaMin * 60_000).toISOString();
}

export function formatTime(iso: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Jerusalem",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(new Date(iso));
}

export function dayLabel(iso: string, now = new Date()): string {
  const target = jerusalemYmd(new Date(iso));
  const today = jerusalemYmd(now);
  if (target === today) return "היום";
  if (target === addDaysYmd(today, 1)) return "מחר";
  return WEEKDAYS[jerusalemWeekdayIndex(new Date(iso))] ?? "";
}

export function formatWhen(iso: string, now = new Date(), style: "dot" | "comma" = "dot"): string {
  const sep = style === "dot" ? " · " : ", ";
  return `${dayLabel(iso, now)}${sep}${formatTime(iso)}`;
}

export function durationLabel(minutes: number | null): string {
  if (!minutes) return "לא נקבע";
  if (minutes === 60) return "שעה";
  if (minutes === 90) return "שעה וחצי";
  if (minutes === 120) return "שעתיים";
  if (minutes === 180) return "3 שעות";
  if (minutes % 60 === 0) return `${minutes / 60} שעות`;
  return `${minutes} דק׳`;
}

export function costLabel(amount: number): string {
  if (amount <= 0) return "חינם";
  return `${amount} ₪ לאדם`;
}

export function sportsLine(sports: { sport_id: string; level: Level }[], names: (id: string) => string): string {
  if (sports.length === 1 && sports[0].level === "beginner" && sports[0].sport_id === "tennis") {
    return "טניס למתחילים";
  }
  return sports.map((s) => names(s.sport_id)).join(" ו");
}
