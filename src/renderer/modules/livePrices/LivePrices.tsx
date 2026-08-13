import { useEffect, useState } from "react";
import type { MobilePriceItem, MobilePriceSourceConfig } from "@shared/types";
import { useMobilePriceList } from "@/state/useMobilePriceList";
import { useSortableRows } from "@/components/useSortableRows";
import { SortableTh } from "@/components/SortableTh";
import { formatDateForDisplay } from "@/lib/jalali";

const EMPTY_CONFIG: MobilePriceSourceConfig = {
  url: "",
  itemSelector: "",
  nameSelector: "",
  priceSelector: "",
  refreshMinutes: 15
};

/**
 * A standalone page — deliberately NOT part of Inventory's "افزودن کالای
 * جدید" form. That form only keeps a lightweight name autocomplete fed by
 * this same data; configuring the source and browsing the full live list
 * both belong here instead, where they don't clutter the add-item form.
 *
 * There is no official live-price API for phones/tablets in Iran, so
 * instead of an API key this takes a reference website + CSS selectors
 * and scrapes it on a timer in the main process.
 */
export function LivePrices(): JSX.Element {
  const [config, setConfig] = useState<MobilePriceSourceConfig>(EMPTY_CONFIG);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");
  const [testStatus, setTestStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [testItems, setTestItems] = useState<MobilePriceItem[]>([]);
  const [testError, setTestError] = useState<string | null>(null);
  const liveList = useMobilePriceList();

  const available = typeof window !== "undefined" && Boolean(window.starvent?.mobilePrices);

  const { sorted, sortKey, direction, toggleSort } = useSortableRows<MobilePriceItem>(
    liveList?.items ?? [],
    "name",
    "asc"
  );

  useEffect(() => {
    if (!available || !window.starvent) return;
    let cancelled = false;

    window.starvent.mobilePrices.getConfig().then((saved) => {
      if (!cancelled && saved) setConfig(saved);
    });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [available]);

  function updateField<K extends keyof MobilePriceSourceConfig>(key: K, value: MobilePriceSourceConfig[K]): void {
    setConfig((prev) => ({ ...prev, [key]: value }));
  }

  async function handleTest(): Promise<void> {
    if (!window.starvent) return;
    setTestStatus("loading");
    setTestError(null);
    const result = await window.starvent.mobilePrices.test(config);
    if (result.ok) {
      setTestItems(result.items);
      setTestStatus("success");
    } else {
      setTestItems([]);
      setTestError(result.error);
      setTestStatus("error");
    }
  }

  async function handleSaveAndActivate(): Promise<void> {
    if (!window.starvent) return;
    setSaveStatus("saving");
    await window.starvent.mobilePrices.saveConfig(config);
    setSaveStatus("saved");
    setTimeout(() => setSaveStatus("idle"), 1800);
  }

  return (
    <div>
      <div className="card">
        <h3 style={{ marginTop: 0 }}>لیست قیمت لحظه‌ای فعال</h3>
        {liveList?.error ? (
          <p style={{ color: "var(--sv-warning)" }}>آخرین تلاش برای دریافت با خطا مواجه شد: {liveList.error}</p>
        ) : null}
        <p style={{ color: "var(--sv-text-600)", marginTop: 0 }}>
          {liveList?.items.length
            ? `${liveList.items.length} قیمت فعال — آخرین بروزرسانی: ${
                liveList.updatedAt ? formatDateForDisplay(liveList.updatedAt) : "—"
              }`
            : "هنوز هیچ قیمتی ذخیره نشده — پس از پیکربندی و «ذخیره و فعال‌سازی» در پایین همین صفحه، این لیست پر می‌شود."}
        </p>

        {liveList?.items.length ? (
          <table className="data-table">
            <thead>
              <tr>
                <SortableTh label="نام" sortKeyName="name" activeKey={sortKey} direction={direction} onSort={toggleSort} />
                <SortableTh label="قیمت" sortKeyName="price" activeKey={sortKey} direction={direction} onSort={toggleSort} />
              </tr>
            </thead>
            <tbody>
              {sorted.map((item, index) => (
                <tr key={`${item.name}-${index}`}>
                  <td>{item.name}</td>
                  <td>{item.price.toLocaleString("fa-IR")} تومان</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : null}
      </div>

      <div className="card" style={{ marginTop: 24 }}>
        <h3 style={{ marginTop: 0 }}>پیکربندی سایت مرجع</h3>
        <p style={{ color: "var(--sv-text-600)", marginTop: 0 }}>
          چون API رسمی برای قیمت لحظه‌ای موبایل/تبلت وجود ندارد، آدرس یک سایت مرجع را همراه با انتخاب‌گر (CSS
          selector) هر بخش وارد کنید؛ برنامه به‌صورت خودکار و دوره‌ای آن صفحه را می‌خواند.
        </p>

        {!available ? (
          <p className="empty-state">این قابلیت فقط در نسخهٔ دسکتاپ (Electron) در دسترس است.</p>
        ) : (
          <>
            <div className="form-row">
              <div>
                <label htmlFor="price-source-url">آدرس سایت مرجع</label>
                <input
                  id="price-source-url"
                  dir="ltr"
                  value={config.url}
                  onChange={(e) => updateField("url", e.target.value)}
                  placeholder="https://example.com/mobile-prices"
                />
              </div>
              <div>
                <label htmlFor="price-source-refresh">بازهٔ بروزرسانی (دقیقه)</label>
                <input
                  id="price-source-refresh"
                  type="number"
                  min={5}
                  value={config.refreshMinutes}
                  onChange={(e) => updateField("refreshMinutes", Number(e.target.value) || 15)}
                />
              </div>
            </div>
            <div className="form-row">
              <div>
                <label htmlFor="price-source-item">انتخاب‌گر هر ردیف/کارت کالا</label>
                <input
                  id="price-source-item"
                  dir="ltr"
                  value={config.itemSelector}
                  onChange={(e) => updateField("itemSelector", e.target.value)}
                  placeholder=".product-item"
                />
              </div>
              <div>
                <label htmlFor="price-source-name">انتخاب‌گر نام (داخل هر ردیف)</label>
                <input
                  id="price-source-name"
                  dir="ltr"
                  value={config.nameSelector}
                  onChange={(e) => updateField("nameSelector", e.target.value)}
                  placeholder=".product-name"
                />
              </div>
              <div>
                <label htmlFor="price-source-price">انتخاب‌گر قیمت (داخل هر ردیف)</label>
                <input
                  id="price-source-price"
                  dir="ltr"
                  value={config.priceSelector}
                  onChange={(e) => updateField("priceSelector", e.target.value)}
                  placeholder=".product-price"
                />
              </div>
            </div>

            <div style={{ display: "flex", gap: "var(--sv-space-3)", flexWrap: "wrap" }}>
              <button type="button" className="btn-primary" onClick={handleTest} disabled={testStatus === "loading"}>
                {testStatus === "loading" ? "در حال دریافت…" : "تست و پیش‌نمایش"}
              </button>
              <button type="button" className="btn-primary" onClick={handleSaveAndActivate} disabled={saveStatus === "saving"}>
                {saveStatus === "saving" ? "در حال ذخیره…" : "ذخیره و فعال‌سازی"}
              </button>
              {saveStatus === "saved" ? <span style={{ color: "var(--sv-success)", alignSelf: "center" }}>ذخیره و فعال شد.</span> : null}
            </div>

            {testStatus === "error" ? <p style={{ color: "var(--sv-danger)" }}>{testError}</p> : null}

            {testStatus === "success" ? (
              <div style={{ marginTop: "var(--sv-space-4)" }}>
                <p style={{ color: "var(--sv-text-600)", marginBottom: "var(--sv-space-2)" }}>
                  {testItems.length} مورد پیدا شد — نمونهٔ ۸ مورد اول:
                </p>
                {testItems.length === 0 ? (
                  <p className="empty-state">هیچ آیتمی با این انتخاب‌گرها پیدا نشد؛ selectorها را بررسی کنید.</p>
                ) : (
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>نام</th>
                        <th>قیمت</th>
                      </tr>
                    </thead>
                    <tbody>
                      {testItems.slice(0, 8).map((item, index) => (
                        <tr key={`${item.name}-${index}`}>
                          <td>{item.name}</td>
                          <td>{item.price.toLocaleString("fa-IR")} تومان</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}
