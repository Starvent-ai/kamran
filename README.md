# Starvent

نرم‌افزار مدیریت فروشگاهی برای موبایل‌فروشی و تعمیرات موبایل — نسخهٔ ویندوز.

## پشته فنی

- Electron 31 + TypeScript + React 18 (بدون کتابخانهٔ مدیریت‌حالت خارجی — `useSyncExternalStore` بومی React)
- Vite برای بیلد رندرر
- electron-builder برای بستهٔ نصبی ویندوز (Installer NSIS + Portable + ZIP)
- electron-store برای ذخیرهٔ داده روی دیسک (رمزنگاری‌شده)
- electron-updater برای به‌روزرسانی خودکار (اختیاری — نیازمند تنظیم مخزن GitHub)
- Vitest برای تست‌های واحد
- فونت Vazirmatn برای تایپوگرافی فارسی

## اجرا و توسعه

```bash
npm install
npm run dev          # اجرای رندرر با Vite (پیش‌نمایش در مرورگر)
# در یک ترمینال دیگر، پس از build اولیهٔ main:
npm run build:main
npx electron .
```

## اسکریپت‌ها

| دستور               | کاربرد                                                              |
| -------------------- | -------------------------------------------------------------------- |
| `npm run typecheck`  | بررسی نوع TypeScript برای رندرر و main process                      |
| `npm test`           | اجرای تست‌های واحد (Vitest)                                         |
| `npm run build`      | typecheck + build رندرر + build main                                 |
| `npm run pack:win`   | ساخت خروجی نهایی ویندوز (Installer + Portable + ZIP) در `release/`  |
| `npm run release:win`| مشابه بالا + انتشار Release در GitHub (برای به‌روزرسانی خودکار)     |
| `npm run dist:win`   | معادل build + pack:win                                               |

## معماری Plugin-Based

هستهٔ برنامه (`App.tsx`, `Sidebar.tsx`) هیچ ماژولی را مستقیم import نمی‌کند. هر ماژول در فایل
`index.ts` خودش یک‌بار `pluginRegistry.register(...)` را صدا می‌زند. تنها فایلی که برای افزودن
ماژول جدید ویرایش می‌شود `src/renderer/plugins/loadCoreModules.ts` است (یک خط import).

راهنمای کامل ساخت ماژول جدید در `PLUGIN_SDK.md` است.

## ذخیرهٔ داده

همهٔ داده‌های کسب‌وکار (فروش، انبار، مشتریان، تعمیرات، اقساط، حسابداری و غیره) به‌صورت محلی روی
دیسک، رمزنگاری‌شده، از طریق `electron-store` ذخیره می‌شوند و با بستن/باز کردن برنامه از بین
نمی‌روند.

## به‌روزرسانی خودکار

برای فعال شدن این قابلیت، فیلد `repository.url` در `package.json` باید به آدرس واقعی مخزن
GitHub شما اشاره کند. جزئیات کامل در بخش «به‌روزرسانی» داخل تنظیمات برنامه.

## CI

Workflow گیت‌هاب اکشنز (`.github/workflows/build.yml`) روی هر push به شاخهٔ اصلی، هر Pull
Request، و هر تگ نسخه (`v*`) اجرا می‌شود:

- build معمولی (push/PR): typecheck → تست واحد → build → package، و آپلود artifact برای دانلود دستی.
- build تگ نسخه: مشابه بالا به‌علاوهٔ انتشار Release در GitHub (برای به‌روزرسانی خودکار کاربران).

مستندات کامل فنی پروژه (معماری، الگوریتم‌ها، ساختار داده، و همهٔ قابلیت‌ها) در فایل `reza.md`
نگهداری می‌شود.
