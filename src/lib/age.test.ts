import { describe, expect, it } from "vitest";
import { ageYears, isMinor, needsParentConsent } from "./age";

const TODAY = new Date("2026-11-27T12:00:00.000Z");

describe("teen age rules", () => {
  it("treats 17 as a minor and 18 as an adult", () => {
    expect(isMinor("2009-05-20", TODAY)).toBe(true);
    expect(ageYears("2009-05-20", TODAY)).toBe(17);
    expect(isMinor("2008-11-27", TODAY)).toBe(false);
    expect(isMinor("2008-11-28", TODAY)).toBe(true);
  });

  it("asks for parent approval only under 16", () => {
    expect(needsParentConsent("2011-09-01", TODAY)).toBe(true);
    expect(needsParentConsent("2010-11-27", TODAY)).toBe(false);
    expect(needsParentConsent("2010-11-28", TODAY)).toBe(true);
  });
});
