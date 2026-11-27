import { jerusalemYmd } from "./format";

/** Calendar age, matching `birth_date > current_date - interval 'N years'` in SQL. */
export function isYoungerThan(birthDate: string, years: number, today = new Date()): boolean {
  const todayYmd = jerusalemYmd(today);
  const [year, month, day] = todayYmd.split("-").map(Number);
  const cutoff = new Date(Date.UTC(year - years, month - 1, day));
  const cutoffYmd = cutoff.toISOString().slice(0, 10);
  return birthDate > cutoffYmd;
}

export function isMinor(birthDate: string, today = new Date()): boolean {
  return isYoungerThan(birthDate, 18, today);
}

export function needsParentConsent(birthDate: string, today = new Date()): boolean {
  return isYoungerThan(birthDate, 16, today);
}

export function ageYears(birthDate: string, today = new Date()): number {
  const [year, month, day] = birthDate.split("-").map(Number);
  const todayYmd = jerusalemYmd(today);
  const [ty, tm, td] = todayYmd.split("-").map(Number);
  let age = ty - year;
  if (tm < month || (tm === month && td < day)) age -= 1;
  return age;
}
