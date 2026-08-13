import { describe, expect, it } from "vitest";
import { buildPeriodBuckets, getPeriodRange } from "@/lib/periodAggregation";
import type { CashTransaction } from "@shared/types";

function makeTxn(overrides: Partial<CashTransaction>): CashTransaction {
  return {
    id: `txn-${Math.random()}`,
    type: "درآمد",
    account: "صندوق",
    category: "فروش",
    paymentMethod: "نقد",
    amount: 100000,
    description: "تست",
    date: "2026-08-01",
    createdAt: new Date().toISOString(),
    voided: false,
    ...overrides
  };
}

describe("buildPeriodBuckets", () => {
  it("produces 14 daily buckets ending on the reference date, oldest first", () => {
    const buckets = buildPeriodBuckets([], "روزانه", new Date("2026-08-15T12:00:00"));
    expect(buckets.length).toBe(14);
    expect(buckets[buckets.length - 1].key).toBe("2026-08-15");
    expect(buckets[0].key).toBe("2026-08-02");
  });

  it("assigns a transaction to the correct daily bucket and sums income vs expense separately", () => {
    const reference = new Date("2026-08-15T12:00:00");
    const transactions = [
      makeTxn({ date: "2026-08-15", type: "درآمد", amount: 500000 }),
      makeTxn({ date: "2026-08-15", type: "هزینه", amount: 120000 })
    ];
    const buckets = buildPeriodBuckets(transactions, "روزانه", reference);
    const todayBucket = buckets.find((b) => b.key === "2026-08-15");
    expect(todayBucket?.income).toBe(500000);
    expect(todayBucket?.expense).toBe(120000);
  });

  it("excludes voided transactions from the totals", () => {
    const reference = new Date("2026-08-15T12:00:00");
    const transactions = [
      makeTxn({ date: "2026-08-15", type: "درآمد", amount: 500000 }),
      makeTxn({ date: "2026-08-15", type: "درآمد", amount: 999999, voided: true })
    ];
    const buckets = buildPeriodBuckets(transactions, "روزانه", reference);
    const todayBucket = buckets.find((b) => b.key === "2026-08-15");
    expect(todayBucket?.income).toBe(500000);
  });

  it("groups weekly buckets starting on Saturday (Iran's start of week)", () => {
    // 2026-08-15 is a Saturday.
    const saturday = new Date("2026-08-15T12:00:00");
    expect(saturday.getDay()).toBe(6);

    const buckets = buildPeriodBuckets(
      [makeTxn({ date: "2026-08-18", amount: 300000 })], // the following Tuesday
      "هفتگی",
      new Date("2026-08-20T12:00:00")
    );
    // The Tuesday transaction should fall into the bucket keyed by that
    // week's Saturday (2026-08-15), not its own date.
    const weekBucket = buckets.find((b) => b.key === "2026-08-15");
    expect(weekBucket?.income).toBe(300000);
  });

  it("groups monthly buckets by the Jalali month, not the Gregorian month", () => {
    // 2026-08-15 (Gregorian) falls within Jalali month 1405-05 (Mordad).
    const transactions = [makeTxn({ date: "2026-08-15", amount: 250000 })];
    const buckets = buildPeriodBuckets(transactions, "ماهانه", new Date("2026-08-20T12:00:00"));
    const bucket = buckets.find((b) => b.key === "1405-05");
    expect(bucket?.income).toBe(250000);
  });

  it("produces 5 yearly buckets keyed by Jalali year", () => {
    const buckets = buildPeriodBuckets([], "سالانه", new Date("2026-08-15T12:00:00"));
    expect(buckets.length).toBe(5);
    expect(buckets[buckets.length - 1].key).toBe("1405");
  });

  it("seeds empty buckets with zero totals so quiet periods still appear", () => {
    const buckets = buildPeriodBuckets([], "روزانه", new Date("2026-08-15T12:00:00"));
    expect(buckets.every((b) => b.income === 0 && b.expense === 0)).toBe(true);
  });
});

describe("getPeriodRange", () => {
  it("matches the same 14-day window as the روزانه buckets", () => {
    const reference = new Date("2026-08-15T12:00:00");
    const { start, end } = getPeriodRange("روزانه", reference);
    expect(start.toISOString().slice(0, 10)).toBe("2026-08-02");
    expect(end.toISOString().slice(0, 10)).toBe("2026-08-15");
  });

  it("matches the same 5-year window as the سالانه buckets", () => {
    const reference = new Date("2026-08-15T12:00:00");
    const { start } = getPeriodRange("سالانه", reference);
    // 5 yearly buckets back from 2026 lands on 2022.
    expect(start.getFullYear()).toBe(2022);
  });
});
