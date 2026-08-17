# راهنمای ساخت افزونهٔ Starvent (SDK)

## دامنهٔ این سیستم افزونه

افزونه‌ها ماژول‌هایی هستند که در کد منبع تعریف و با یک build جدید به برنامه اضافه می‌شوند —
مشابه بقیهٔ ماژول‌های موجود. نصب افزونهٔ شخص ثالث در زمان اجرا (بدون build) پشتیبانی نمی‌شود، چون
اجرای کد خارجی در برنامه‌ای با دسترسی به اطلاعات مالی و مشتریان بدون یک لایهٔ sandbox و امضای
دیجیتال ریسک امنیتی دارد.

امکانات موجود:

1. **مدیریت افزونه‌ها** — از تنظیمات → افزونه‌ها، هر بخش (به‌جز چند بخش اصلی) قابل فعال/غیرفعال
   کردن است؛ فوری اعمال می‌شود، بدون نیاز به build دوباره.
2. **این راهنما** — روال افزودن یک ماژول جدید با ویرایش کد و یک build جدید.

---

## معماری فعلی، خلاصه

هستهٔ برنامه (`App.tsx`/`Sidebar.tsx`) هیچ‌وقت مستقیماً به هیچ ماژولی اشاره نمی‌کنه. فقط از
یک رجیستری مرکزی (`pluginRegistry`) می‌خونه که هر ماژول، خودش رو در همون یک خط ثبت می‌کنه:

```ts
// src/renderer/modules/<your-module>/index.ts
import { pluginRegistry } from "@/plugins/pluginRegistry";
import { YourComponent } from "./YourComponent";

pluginRegistry.register({
  id: "your-module",          // یکتا، انگلیسی، بدون فاصله
  label: "نام فارسی در نوار کناری",
  icon: "★",                  // یک نویسهٔ ساده — بدون فونت آیکون خارجی
  order: 50,                  // ترتیب در گروه خودش (عددهای کوچیک‌تر بالاترن)
  group: "ابزارها",           // یکی از گروه‌های موجود، یا یک گروه جدید
  component: YourComponent
});
```

بعد فقط یک خط به `src/renderer/plugins/loadCoreModules.ts` اضافه می‌شه:

```ts
import "@/modules/your-module";
```

همین. Sidebar و App خودکار این ماژول جدید رو می‌بینن، گروه‌بندی می‌کنن، و نمایش می‌دن —
بدون این‌که هیچ‌کدوم از این دو فایل نیاز به تغییر داشته باشن.

## داده و ذخیره‌سازی

اگه افزونه‌تون نیاز به نگه‌داشتن داده داره (رکورد، تنظیمات، هرچی)، از `createStore` استفاده
کنید — دقیقاً همون چیزی که همهٔ ماژول‌های فعلی استفاده می‌کنن:

```ts
import { createStore } from "@/state/createStore";

interface YourState {
  items: YourItem[];
}

// کلید دوم (persistKey) باعث می‌شه این داده روی دیسک ذخیره بشه و با
// بستن/باز کردن برنامه از بین نره — کلید رو با پیشوند "data-" و یکتا انتخاب کنید.
const yourStore = createStore<YourState>({ items: [] }, "data-your-module");
```

اگه داده نیاز به ذخیره نداره (مثلاً یک وضعیت موقتی در همون جلسهٔ کاری)، آرگومان دوم رو کلاً
ندید — دقیقاً مثل `printRequestStore` یا `navigationStore` در پروژه.

## دسترسی نقش‌ها (RBAC)

اگه می‌خواید افزونه‌تون فقط برای نقش‌های خاصی در دسترس باشه، شناسهٔ افزونه رو به نگاشت
`ROLE_ACCESS` در `src/renderer/modules/security/useUsers.ts` اضافه کنید.

## چند قاعدهٔ مهم پروژه (همیشه رعایت بشه)

- شناسهٔ رکوردهای جدید همیشه با `generateId(prefix)` از `src/renderer/lib/id.ts` ساخته بشه.
- تاریخ‌ها با `formatDateForDisplay()` از `src/renderer/lib/jalali.ts` نمایش داده بشن.
- مبالغ با کامپوننت `CurrencyInput` از `src/renderer/components/CurrencyInput.tsx` وارد بشن.
- بدون npm dependency جدید مگر واقعاً ضروری و سبک (به‌خاطر محدودیت رم build در GitHub Actions).
- بعد از هر تغییر، `npm run typecheck` باید تمیز باشه.

## یک نمونهٔ کامل و کوچک

فایل `src/renderer/plugins/examples/aiSuggestionsPlugin.tsx` دقیقاً یک نمونهٔ افزونهٔ کامل و
مستقله (یک‌فایلی، بدون پوشهٔ جدا) — برای شروع، بهترین جای کپی‌برداریه.
