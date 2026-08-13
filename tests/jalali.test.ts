import { describe, expect, it } from "vitest";
import { gregorianToJalali, isLeapJalaliYear, jalaliToGregorian, jalaliMonthLength, formatDateForDisplay } from "@/lib/jalali";

describe("jalali conversion", () => {
  it("converts known reference dates correctly", () => {
    expect(gregorianToJalali(2024, 3, 20)).toEqual([1403, 1, 1]);
    expect(jalaliToGregorian(1403, 1, 1)).toEqual([2024, 3, 20]);
    expect(gregorianToJalali(2000, 3, 20)).toEqual([1379, 1, 1]);
  });

  it("round-trips across a wide range of dates without drift", () => {
    let mismatches = 0;
    for (let y = 1970; y < 2035; y += 1) {
      for (const [m, d] of [[1, 1], [6, 15], [12, 28]] as const) {
        const [jy, jm, jd] = gregorianToJalali(y, m, d);
        const [gy, gm, gd] = jalaliToGregorian(jy, jm, jd);
        if (gy !== y || gm !== m || gd !== d) mismatches += 1;
      }
    }
    expect(mismatches).toBe(0);
  });

  it("computes month length consistently with leap-year detection", () => {
    expect(jalaliMonthLength(1403, 1)).toBe(31);
    expect(jalaliMonthLength(1403, 10)).toBe(30);
    expect(jalaliMonthLength(1403, 12)).toBe(isLeapJalaliYear(1403) ? 30 : 29);
  });

  it("formats both plain dates and full ISO timestamps for display", () => {
    expect(formatDateForDisplay("2024-03-20")).toBe("۱ فروردین ۱۴۰۳");
    expect(formatDateForDisplay("2024-03-20T14:30:00.000Z")).toBe("۱ فروردین ۱۴۰۳");
  });

  it("returns unparseable input unchanged instead of throwing", () => {
    expect(formatDateForDisplay("")).toBe("");
    expect(formatDateForDisplay("not-a-date")).toBe("not-a-date");
  });
});
