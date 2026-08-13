/**
 * This file lives OUTSIDE the core modules folder on purpose: it shows what
 * a future plugin (in-house or third-party) looks like. It registers itself
 * exactly the way dashboard/inventory/sales/customers/settings do — nothing
 * in App.tsx, Sidebar.tsx, or pluginRegistry.ts had to change to add it.
 *
 * To disable it, remove its import from loadCoreModules.ts — no other file
 * needs to be touched.
 */
import { pluginRegistry } from "@/plugins/pluginRegistry";

function AiSuggestionsPanel(): JSX.Element {
  return (
    <div className="card">
      <h3 style={{ marginTop: 0 }}>پیشنهادهای هوش مصنوعی (نمونهٔ افزونه)</h3>
      <p style={{ color: "var(--sv-text-600)" }}>
        این بخش نمونه‌ای از یک افزونهٔ مستقل است. با اتصال API در بخش «تنظیمات»، این پنل می‌تواند
        پیشنهاد قیمت، تحلیل فروش یا متن تبلیغاتی تولید کند.
      </p>
    </div>
  );
}

pluginRegistry.register({
  id: "ai-suggestions-example",
  label: "پیشنهادهای AI",
  icon: "✦",
  order: 15,
  component: AiSuggestionsPanel
});
