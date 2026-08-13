/**
 * Suggests what kind of Instagram content fits the current hour.
 *
 * IMPORTANT — honesty note: this is a fixed rule-of-thumb schedule, not
 * an analysis of your actual followers' behavior. Starvent has no access
 * to your Instagram account or its analytics, so it can't know when YOUR
 * audience is really most active. Treat this as a generic starting
 * point, not a data-backed recommendation — swap the hours/content below
 * once you know your own audience's real active times (visible in
 * Instagram's own Insights).
 */
export interface ContentSuggestion {
  hourRange: string;
  contentType: string;
  note: string;
}

const SCHEDULE: Array<{ startHour: number; endHour: number; suggestion: ContentSuggestion }> = [
  {
    startHour: 8,
    endHour: 10,
    suggestion: {
      hourRange: "۸ تا ۱۰ صبح",
      contentType: "معرفی محصول یا کالای تازه‌وارد",
      note: "شروع روز — مخاطب اطلاع‌رسانی و خبر تازه را بیشتر می‌بیند."
    }
  },
  {
    startHour: 12,
    endHour: 14,
    suggestion: {
      hourRange: "۱۲ تا ۱۴ ظهر",
      contentType: "استوری نظرسنجی یا سوال از مخاطب",
      note: "استراحت ناهار — تعامل (نظرسنجی/سوال) در این بازه معمولاً بهتر جواب می‌دهد."
    }
  },
  {
    startHour: 17,
    endHour: 19,
    suggestion: {
      hourRange: "۱۷ تا ۱۹ عصر",
      contentType: "استوری یا پست احساسی/داستان مشتری",
      note: "پایان ساعات کاری — محتوای احساسی و داستان‌محور در این بازه معمولاً اثر بیشتری دارد."
    }
  },
  {
    startHour: 20,
    endHour: 23,
    suggestion: {
      hourRange: "۲۰ تا ۲۳ شب",
      contentType: "ریلز سرگرم‌کننده یا قبل‌وبعد تعمیر",
      note: "زمان استراحت خانه — محتوای سرگرم‌کننده و کوتاه بیشتر دیده می‌شود."
    }
  }
];

export function getContentSuggestionForHour(hour: number): ContentSuggestion | null {
  const match = SCHEDULE.find((slot) => hour >= slot.startHour && hour < slot.endHour);
  return match ? match.suggestion : null;
}
