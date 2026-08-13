import { JALALI_MONTH_NAMES } from "@/lib/jalali";

interface JalaliMonthDayPickerProps {
  dayInputId: string;
  monthInputId: string;
  /** "MM-DD" in the Jalali calendar, or empty string if not set. */
  value: string;
  onChange: (value: string) => void;
}

/**
 * A real "Date Picker شمسی" for fields that only need a recurring
 * month+day (no year) — currently just customer birthdays. Shows Jalali
 * month names in a dropdown instead of a bare 1-12 number, so it reads
 * as a genuine Jalali picker rather than two disconnected number inputs.
 */
export function JalaliMonthDayPicker({ dayInputId, monthInputId, value, onChange }: JalaliMonthDayPickerProps): JSX.Element {
  const [month, day] = value ? value.split("-") : ["", ""];

  function setDay(newDay: string): void {
    if (!newDay) {
      onChange("");
      return;
    }
    const paddedDay = newDay.padStart(2, "0");
    const currentMonth = month || "01";
    onChange(`${currentMonth}-${paddedDay}`);
  }

  function setMonth(newMonth: string): void {
    if (!newMonth) {
      onChange("");
      return;
    }
    const currentDay = day || "01";
    onChange(`${newMonth}-${currentDay}`);
  }

  return (
    <>
      <div>
        <label htmlFor={dayInputId}>روز تولد (شمسی)</label>
        <input
          id={dayInputId}
          type="number"
          min={1}
          max={31}
          placeholder="روز"
          value={day ? String(Number(day)) : ""}
          onChange={(e) => setDay(e.target.value)}
        />
      </div>
      <div>
        <label htmlFor={monthInputId}>ماه تولد (شمسی)</label>
        <select id={monthInputId} value={month} onChange={(e) => setMonth(e.target.value)}>
          <option value="">— انتخاب کنید —</option>
          {JALALI_MONTH_NAMES.map((name, index) => (
            <option key={name} value={String(index + 1).padStart(2, "0")}>
              {name}
            </option>
          ))}
        </select>
      </div>
    </>
  );
}
