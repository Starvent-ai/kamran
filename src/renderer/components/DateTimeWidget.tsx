import { useEffect, useState } from "react";
import {
  JALALI_MONTH_NAMES,
  formatGregorian,
  getJalaliDateTime,
  gregorianToJalali,
  jalaliToGregorian,
  toPersianDigits
} from "@/lib/jalali";

/**
 * Lives in the top bar, opposite the page title.
 *  1. A live Jalali date + clock.
 *  2. A date converter that sits permanently visible right next to it —
 *     no click/popover needed, exactly like the clock itself. A small
 *     flip button switches which calendar you're typing into.
 * Pure client-side math (@/lib/jalali) — no network, no extra dependency.
 */
export function DateTimeWidget(): JSX.Element {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const jalaliNow = getJalaliDateTime(now);

  return (
    <div className="date-widget">
      <div className="date-widget__clock" title="تاریخ و ساعت">
        <span className="date-widget__date">{jalaliNow.formattedDate}</span>
        <span className="date-widget__time">{jalaliNow.formattedTime}</span>
      </div>
      <DateConverterInline />
    </div>
  );
}

function DateConverterInline(): JSX.Element {
  const today = new Date();
  const [mode, setMode] = useState<"g-to-j" | "j-to-g">("g-to-j");

  const [gregorianDate, setGregorianDate] = useState(
    () => `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`
  );

  const initialJalali = gregorianToJalali(today.getFullYear(), today.getMonth() + 1, today.getDate());
  const [jd, setJd] = useState(String(initialJalali[2]));
  const [jm, setJm] = useState(String(initialJalali[1]));
  const [jy, setJy] = useState(String(initialJalali[0]));

  let gToJResult: string | null = null;
  if (mode === "g-to-j") {
    const [gy, gm, gd] = gregorianDate.split("-").map(Number);
    if (gy && gm && gd) {
      try {
        const [ry, rm, rd] = gregorianToJalali(gy, gm, gd);
        gToJResult = toPersianDigits(`${rd} ${JALALI_MONTH_NAMES[rm - 1]} ${ry}`);
      } catch {
        gToJResult = null;
      }
    }
  }

  let jToGResult: string | null = null;
  if (mode === "j-to-g") {
    try {
      const [ry, rm, rd] = jalaliToGregorian(Number(jy), Number(jm), Number(jd));
      jToGResult = formatGregorian(ry, rm, rd);
    } catch {
      jToGResult = null;
    }
  }

  return (
    <div className="date-widget__converter" title="مبدل تاریخ شمسی و میلادی">
      <button
        type="button"
        className="date-widget__flip"
        onClick={() => setMode((m) => (m === "g-to-j" ? "j-to-g" : "g-to-j"))}
        aria-label="تعویض جهت تبدیل تاریخ"
      >
        ⇄
      </button>

      {mode === "g-to-j" ? (
        <>
          <input
            aria-label="تاریخ میلادی"
            type="date"
            className="date-widget__date-input"
            value={gregorianDate}
            onChange={(e) => setGregorianDate(e.target.value)}
          />
          <span className="date-widget__result">{gToJResult ?? "—"}</span>
        </>
      ) : (
        <>
          <div className="date-widget__jalali-inputs">
            <input aria-label="روز شمسی" type="number" min={1} max={31} value={jd} onChange={(e) => setJd(e.target.value)} />
            <input aria-label="ماه شمسی" type="number" min={1} max={12} value={jm} onChange={(e) => setJm(e.target.value)} />
            <input aria-label="سال شمسی" type="number" value={jy} onChange={(e) => setJy(e.target.value)} />
          </div>
          <span className="date-widget__result">{jToGResult ?? "—"}</span>
        </>
      )}
    </div>
  );
}
