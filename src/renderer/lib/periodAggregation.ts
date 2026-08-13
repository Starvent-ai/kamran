import type { CashTransaction } from "@shared/types";
import { gregorianToJalali, JALALI_MONTH_NAMES, toPersianDigits } from "./jalali";

export type AccountingPeriod = "روزانه" | "هفتگی" | "ماهانه" | "سالانه";

export interface PeriodBucket {
  key: string;
  label: string;
  income: number;
  expense: number;
}

function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Buckets non-voided transactions into the requested period, most-recent
 * bucket last (chart-reading order). Daily/weekly bucket boundaries are
 * plain calendar days (a day is a day in either calendar); monthly/yearly
 * bucketing groups by the Jalali month/year, since that's how the shop
 * owner actually thinks about "this month" / "this year" — grouping by
 * Gregorian month here would silently misrepresent the requested view.
 */
/**
 * The same [start, end] window buildPeriodBuckets aggregates over, exposed
 * separately so other views (e.g. the transaction drill-down list under the
 * chart) can filter to exactly what the chart is showing.
 */
export function getPeriodRange(period: AccountingPeriod, referenceDate: Date = new Date()): { start: Date; end: Date } {
  const bucketCount = period === "روزانه" ? 14 : period === "هفتگی" ? 8 : period === "ماهانه" ? 12 : 5;
  const end = startOfDay(referenceDate);
  const start = new Date(end);
  if (period === "روزانه") start.setDate(start.getDate() - (bucketCount - 1));
  else if (period === "هفتگی") start.setDate(start.getDate() - (bucketCount - 1) * 7);
  else if (period === "ماهانه") start.setMonth(start.getMonth() - (bucketCount - 1));
  else start.setFullYear(start.getFullYear() - (bucketCount - 1));
  return { start, end };
}

export function buildPeriodBuckets(
  transactions: CashTransaction[],
  period: AccountingPeriod,
  referenceDate: Date = new Date()
): PeriodBucket[] {
  const bucketCount = period === "روزانه" ? 14 : period === "هفتگی" ? 8 : period === "ماهانه" ? 12 : 5;
  const buckets = new Map<string, PeriodBucket>();

  function bucketKeyForDate(d: Date): { key: string; label: string } {
    if (period === "روزانه") {
      const key = d.toISOString().slice(0, 10);
      const [, jm, jd] = gregorianToJalali(d.getFullYear(), d.getMonth() + 1, d.getDate());
      return { key, label: toPersianDigits(`${jd} ${JALALI_MONTH_NAMES[jm - 1].slice(0, 3)}`) };
    }
    if (period === "هفتگی") {
      // Week bucket = the Saturday (start of week in Iran) on/before d.
      const dow = d.getDay(); // 0=Sun..6=Sat
      const daysSinceSaturday = (dow + 1) % 7;
      const weekStart = new Date(d);
      weekStart.setDate(d.getDate() - daysSinceSaturday);
      const key = weekStart.toISOString().slice(0, 10);
      const [, jm, jd] = gregorianToJalali(weekStart.getFullYear(), weekStart.getMonth() + 1, weekStart.getDate());
      return { key, label: toPersianDigits(`از ${jd} ${JALALI_MONTH_NAMES[jm - 1].slice(0, 3)}`) };
    }
    const [jy, jm] = gregorianToJalali(d.getFullYear(), d.getMonth() + 1, d.getDate());
    if (period === "ماهانه") {
      return { key: `${jy}-${String(jm).padStart(2, "0")}`, label: toPersianDigits(JALALI_MONTH_NAMES[jm - 1]) };
    }
    return { key: String(jy), label: toPersianDigits(String(jy)) };
  }

  // Seed empty buckets for the requested window, oldest first, so months
  // with zero activity still show up on the chart instead of vanishing.
  const cursor = startOfDay(referenceDate);
  for (let i = bucketCount - 1; i >= 0; i -= 1) {
    const d = new Date(cursor);
    if (period === "روزانه") d.setDate(d.getDate() - i);
    else if (period === "هفتگی") d.setDate(d.getDate() - i * 7);
    else if (period === "ماهانه") d.setMonth(d.getMonth() - i);
    else d.setFullYear(d.getFullYear() - i);

    const { key, label } = bucketKeyForDate(d);
    if (!buckets.has(key)) buckets.set(key, { key, label, income: 0, expense: 0 });
  }

  for (const t of transactions) {
    if (t.voided) continue;
    const d = new Date(t.date);
    const { key } = bucketKeyForDate(d);
    const bucket = buckets.get(key);
    if (!bucket) continue; // outside the requested window
    if (t.type === "درآمد") bucket.income += t.amount;
    else bucket.expense += t.amount;
  }

  return Array.from(buckets.values());
}
