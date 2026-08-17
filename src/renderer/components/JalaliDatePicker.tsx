import { JALALI_MONTH_NAMES, gregorianToJalali, jalaliMonthLength, jalaliToGregorian } from "@/lib/jalali";

interface JalaliDatePickerProps {
  yearInputId: string;
  monthInputId: string;
  dayInputId: string;
  /** Gregorian ISO date string ("YYYY-MM-DD"), or empty string if not set. */
  value: string;
  onChange: (value: string) => void;
  /** Prefix used in each field's label, e.g. "تولد" -> "سال تولد (شمسی)". */
  label: string;
}

/** A real "Date Picker شمسی" for fields that need a full date (year + month
 *  + day) — e.g. customer date of birth, estimated repair delivery date.
 *  Internally works entirely in the Jalali calendar (dropdown of Jalali
 *  month names, Jalali year input) and converts to/from the Gregorian ISO
 *  string the rest of the app stores dates as. */
export function JalaliDatePicker({ yearInputId, monthInputId, dayInputId, value, onChange, label }: JalaliDatePickerProps): JSX.Element {
  let jy = "";
  let jm = "";
  let jd = "";
  if (value) {
    const [gy, gm, gd] = value.split("-").map(Number);
    const [y, m, d] = gregorianToJalali(gy, gm, gd);
    jy = String(y);
    jm = String(m).padStart(2, "0");
    jd = String(d).padStart(2, "0");
  }

  function commit(nextYear: string, nextMonth: string, nextDay: string): void {
    if (!nextYear || !nextMonth || !nextDay) {
      onChange("");
      return;
    }
    const maxDay = jalaliMonthLength(Number(nextYear), Number(nextMonth));
    const clampedDay = Math.min(Number(nextDay), maxDay);
    const [gy, gm, gd] = jalaliToGregorian(Number(nextYear), Number(nextMonth), clampedDay);
    onChange(`${gy}-${String(gm).padStart(2, "0")}-${String(gd).padStart(2, "0")}`);
  }

  return (
    <>
      <div>
        <label htmlFor={yearInputId}>سال {label} (شمسی)</label>
        <input
          id={yearInputId}
          type="number"
          min={1300}
          max={1450}
          value={jy}
          onChange={(e) => commit(e.target.value, jm || "01", jd || "01")}
        />
      </div>
      <div>
        <label htmlFor={monthInputId}>ماه {label} (شمسی)</label>
        <select id={monthInputId} value={jm} onChange={(e) => commit(jy || "1370", e.target.value, jd || "01")}>
          <option value="">— انتخاب کنید —</option>
          {JALALI_MONTH_NAMES.map((name, index) => (
            <option key={name} value={String(index + 1).padStart(2, "0")}>
              {name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor={dayInputId}>روز {label} (شمسی)</label>
        <input
          id={dayInputId}
          type="number"
          min={1}
          max={31}
          value={jd ? String(Number(jd)) : ""}
          onChange={(e) => commit(jy || "1370", jm || "01", e.target.value)}
        />
      </div>
    </>
  );
}
