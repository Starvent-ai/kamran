import { useEffect, useState, type ChangeEvent } from "react";
import type { UpdateStatus } from "@/global";
import { pluginRegistry } from "@/plugins/pluginRegistry";
import { usePluginPreferences } from "@/state/pluginPreferences";
import {
  DEFAULT_STORE_PROFILE,
  loadStoreProfile,
  saveStoreProfile,
  type PaperSize,
  type StoreProfile
} from "@/lib/storeProfile";

const PAPER_SIZES: PaperSize[] = ["A4", "80mm", "58mm"];

export function StoreSettings(): JSX.Element {
  const { isDisabled, setEnabled } = usePluginPreferences();
  const allPlugins = pluginRegistry.getAll();
  const [profile, setProfile] = useState<StoreProfile>(DEFAULT_STORE_PROFILE);
  const [status, setStatus] = useState<"idle" | "loading" | "saved">("loading");

  const [backups, setBackups] = useState<{ fileName: string; filePath: string; createdAt: string; sizeBytes: number }[]>([]);
  const [backupFolderActual, setBackupFolderActual] = useState("");
  const [backupMessage, setBackupMessage] = useState<{ type: "error" | "success"; text: string } | null>(null);
  const [backupBusy, setBackupBusy] = useState(false);

  const [appVersion, setAppVersion] = useState("");
  const [updateStatus, setUpdateStatus] = useState<UpdateStatus | null>(null);
  const [updateBusy, setUpdateBusy] = useState(false);

  async function refreshBackupList(): Promise<void> {
    if (!window.starvent) return;
    const result = await window.starvent.backup.list();
    if (result.ok) {
      setBackups(result.backups);
      setBackupFolderActual(result.folder);
    }
  }

  useEffect(() => {
    void refreshBackupList();
  }, []);

  useEffect(() => {
    if (!window.starvent) return;
    window.starvent.appInfo.getVersion().then(setAppVersion);
    const unsubscribe = window.starvent.update.onStatus((status) => {
      setUpdateStatus(status);
      if (status.phase === "up-to-date" || status.phase === "error" || status.phase === "downloaded") {
        setUpdateBusy(false);
      }
    });
    return unsubscribe;
  }, []);

  async function handleCheckForUpdate(): Promise<void> {
    if (!window.starvent) return;
    setUpdateBusy(true);
    const result = await window.starvent.update.check();
    if (!result.ok) {
      setUpdateStatus({ phase: "error", error: result.error });
      setUpdateBusy(false);
    }
    // On success, the "checking"/"available"/"up-to-date" events from
    // autoUpdater already arrive via onStatus above — no need to set
    // updateStatus again here (would just race the real event).
  }

  async function handleDownloadUpdate(): Promise<void> {
    if (!window.starvent) return;
    setUpdateBusy(true);
    const result = await window.starvent.update.download();
    if (!result.ok) {
      setUpdateStatus({ phase: "error", error: result.error });
      setUpdateBusy(false);
    }
  }

  async function handleInstallUpdate(): Promise<void> {
    if (!window.starvent) return;
    await window.starvent.update.install();
  }

  async function handleOpenReleasesPage(): Promise<void> {
    if (!window.starvent) return;
    await window.starvent.update.openReleasesPage();
  }

  async function handleBackupNow(): Promise<void> {
    if (!window.starvent) {
      setBackupMessage({ type: "error", text: "بکاپ‌گیری فقط در نسخهٔ نصب‌شدهٔ ویندوز کار می‌کند." });
      return;
    }
    setBackupBusy(true);
    setBackupMessage(null);
    const result = await window.starvent.backup.createNow();
    setBackupBusy(false);
    if (result.ok) {
      setBackupMessage({ type: "success", text: "بکاپ با موفقیت ذخیره شد." });
      void refreshBackupList();
    } else {
      setBackupMessage({ type: "error", text: result.error });
    }
  }

  async function handlePickFolder(): Promise<void> {
    if (!window.starvent) return;
    const picked = await window.starvent.backup.pickFolder();
    if (picked) {
      update("backupFolder", picked);
    }
  }

  async function handleRestore(filePath: string): Promise<void> {
    if (!window.starvent) return;
    const confirmed = window.confirm(
      "بازیابی این بکاپ، اطلاعات فعلی برنامه را با اطلاعات این بکاپ جایگزین می‌کند و برنامه بسته و دوباره باز می‌شود. ادامه می‌دهید؟"
    );
    if (!confirmed) return;
    setBackupBusy(true);
    const result = await window.starvent.backup.restoreFromFile(filePath);
    if (!result.ok) {
      setBackupBusy(false);
      setBackupMessage({ type: "error", text: result.error });
    }
    // On success the app relaunches on its own — nothing else to do here.
  }

  async function handleDeleteBackup(filePath: string): Promise<void> {
    if (!window.starvent) return;
    const confirmed = window.confirm("این فایل بکاپ برای همیشه حذف شود؟");
    if (!confirmed) return;
    const result = await window.starvent.backup.deleteFile(filePath);
    if (result.ok) {
      void refreshBackupList();
    } else {
      setBackupMessage({ type: "error", text: result.error });
    }
  }

  useEffect(() => {
    let cancelled = false;
    loadStoreProfile().then((loaded) => {
      if (cancelled) return;
      setProfile(loaded);
      setStatus("idle");
    });
    return () => {
      cancelled = true;
    };
  }, []);

  function update<K extends keyof StoreProfile>(key: K, value: StoreProfile[K]): void {
    setProfile((prev) => ({ ...prev, [key]: value }));
  }

  function handleLogoPick(event: ChangeEvent<HTMLInputElement>): void {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") update("logoDataUrl", reader.result);
    };
    reader.readAsDataURL(file);
  }

  async function handleSave(): Promise<void> {
    setStatus("loading");
    await saveStoreProfile(profile);
    setStatus("saved");
    setTimeout(() => setStatus("idle"), 1800);
  }

  return (
    <div className="card" style={{ marginTop: 24 }}>
      <h3 style={{ marginTop: 0 }}>تنظیمات پایهٔ فروشگاه</h3>

      <div className="form-row">
        <div>
          <label htmlFor="ss-name">نام فروشگاه</label>
          <input id="ss-name" value={profile.storeName} onChange={(e) => update("storeName", e.target.value)} />
        </div>
        <div>
          <label htmlFor="ss-brand">برند</label>
          <input id="ss-brand" value={profile.brand} onChange={(e) => update("brand", e.target.value)} />
        </div>
        <div>
          <label htmlFor="ss-phone">تلفن</label>
          <input
            id="ss-phone"
            value={profile.phone}
            onChange={(e) => update("phone", e.target.value.replace(/\D/g, "").slice(0, 11))}
            inputMode="numeric"
            maxLength={11}
          />
        </div>
        <div>
          <label htmlFor="ss-tax">اطلاعات مالیاتی (شناسهٔ اقتصادی)</label>
          <input id="ss-tax" value={profile.taxId} onChange={(e) => update("taxId", e.target.value)} />
        </div>
      </div>

      <div className="form-row">
        <div style={{ gridColumn: "1 / -1" }}>
          <label htmlFor="ss-address">آدرس</label>
          <input id="ss-address" value={profile.address} onChange={(e) => update("address", e.target.value)} />
        </div>
      </div>

      <div className="form-row" style={{ alignItems: "center" }}>
        <div>
          <label htmlFor="ss-logo">لوگوی فروشگاه</label>
          <input
            id="ss-logo"
            type="file"
            accept="image/*"
            onChange={handleLogoPick}
          />
        </div>
        {profile.logoDataUrl ? (
          <div>
            <label>پیش‌نمایش</label>
            <img src={profile.logoDataUrl} alt="لوگوی فروشگاه" style={{ height: 48, borderRadius: 6 }} />
          </div>
        ) : null}
      </div>

      <h3 style={{ marginTop: "var(--sv-space-6)" }}>رفتار پس از ثبت فروش</h3>
      <div className="form-row">
        <div>
          <label htmlFor="ss-auto-print">بعد از ثبت فروش</label>
          <select
            id="ss-auto-print"
            value={profile.autoPrintAfterSale ? "print" : "record-only"}
            onChange={(e) => update("autoPrintAfterSale", e.target.value === "print")}
          >
            <option value="record-only">فقط ثبت انجام شود</option>
            <option value="print">صفحهٔ چاپ فاکتور مستقیم باز شود</option>
          </select>
        </div>
      </div>

      <h3 style={{ marginTop: "var(--sv-space-6)" }}>تنظیمات محاسبات</h3>
      <p style={{ color: "var(--sv-text-600)", marginTop: 0 }}>
        این درصد به‌صورت پیش‌فرض در «ماشین‌حساب» پر می‌شود — خود ماشین‌حساب فقط محاسبه می‌کند، عدد پایه از
        همین‌جا می‌آید.
      </p>
      <div className="form-row">
        <div>
          <label htmlFor="ss-default-tax">درصد مالیات پیش‌فرض</label>
          <input
            id="ss-default-tax"
            type="number"
            min={0}
            value={profile.defaultTaxPercent}
            onChange={(e) => update("defaultTaxPercent", Number(e.target.value) || 0)}
          />
        </div>
      </div>

      <h3 style={{ marginTop: "var(--sv-space-6)" }}>تنظیمات فروش اقساطی</h3>
      <div className="form-row">
        <div>
          <label htmlFor="ss-inst-fee">درصد کارمزد/سود اقساطی پیش‌فرض</label>
          <input
            id="ss-inst-fee"
            type="number"
            min={0}
            value={profile.installmentFeePercent}
            onChange={(e) => update("installmentFeePercent", Number(e.target.value) || 0)}
          />
        </div>
        <div>
          <label htmlFor="ss-inst-reminder">یادآوری پیامکی چند روز قبل از سررسید قسط</label>
          <input
            id="ss-inst-reminder"
            type="number"
            min={0}
            value={profile.installmentReminderDaysBefore}
            onChange={(e) => update("installmentReminderDaysBefore", Number(e.target.value) || 0)}
          />
        </div>
      </div>
      <p style={{ color: "var(--sv-text-600)", marginTop: 0 }}>
        موارد زیر در «پروندهٔ فروش اقساطی» چاپ می‌شوند (مشتری، شرح کالا و مبلغ کل همیشه چاپ می‌شوند):
      </p>
      <div className="form-row">
        <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <input
            type="checkbox"
            checked={profile.installmentPrintFields.installmentCount}
            onChange={(e) =>
              update("installmentPrintFields", { ...profile.installmentPrintFields, installmentCount: e.target.checked })
            }
          />
          تعداد اقساط
        </label>
        <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <input
            type="checkbox"
            checked={profile.installmentPrintFields.monthlyAmount}
            onChange={(e) =>
              update("installmentPrintFields", { ...profile.installmentPrintFields, monthlyAmount: e.target.checked })
            }
          />
          مبلغ هر قسط
        </label>
        <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <input
            type="checkbox"
            checked={profile.installmentPrintFields.startDate}
            onChange={(e) =>
              update("installmentPrintFields", { ...profile.installmentPrintFields, startDate: e.target.checked })
            }
          />
          تاریخ شروع
        </label>
        <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <input
            type="checkbox"
            checked={profile.installmentPrintFields.status}
            onChange={(e) =>
              update("installmentPrintFields", { ...profile.installmentPrintFields, status: e.target.checked })
            }
          />
          وضعیت پرونده
        </label>
        <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <input
            type="checkbox"
            checked={profile.installmentPrintFields.guaranteeNote}
            onChange={(e) =>
              update("installmentPrintFields", { ...profile.installmentPrintFields, guaranteeNote: e.target.checked })
            }
          />
          یادداشت ضمانت
        </label>
        <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <input
            type="checkbox"
            checked={profile.installmentPrintFields.scheduleTable}
            onChange={(e) =>
              update("installmentPrintFields", { ...profile.installmentPrintFields, scheduleTable: e.target.checked })
            }
          />
          جدول کامل اقساط
        </label>
      </div>

      <h3 style={{ marginTop: "var(--sv-space-6)" }}>تنظیمات پرینتر</h3>
      <div className="form-row">
        <div>
          <label htmlFor="ss-printer">نام پرینتر</label>
          <input
            id="ss-printer"
            value={profile.printerName}
            onChange={(e) => update("printerName", e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="ss-paper">سایز کاغذ</label>
          <select id="ss-paper" value={profile.paperSize} onChange={(e) => update("paperSize", e.target.value as PaperSize)}>
            {PAPER_SIZES.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </div>
      </div>

      <h3 style={{ marginTop: "var(--sv-space-6)" }}>تنظیمات بکاپ</h3>
      <div className="form-row">
        <div>
          <label htmlFor="ss-backup-enabled">بکاپ خودکار</label>
          <select
            id="ss-backup-enabled"
            value={profile.autoBackupEnabled ? "on" : "off"}
            onChange={(e) => update("autoBackupEnabled", e.target.value === "on")}
          >
            <option value="off">غیرفعال</option>
            <option value="on">فعال</option>
          </select>
        </div>
        <div>
          <label htmlFor="ss-backup-folder">مسیر پوشهٔ بکاپ</label>
          <div style={{ display: "flex", gap: 8 }}>
            <input
              id="ss-backup-folder"
              value={profile.backupFolder}
              onChange={(e) => update("backupFolder", e.target.value)}
            />
            <button type="button" className="btn-secondary" onClick={() => void handlePickFolder()}>
              انتخاب پوشه
            </button>
          </div>
        </div>
        <div>
          <label htmlFor="ss-backup-interval">بازهٔ بکاپ خودکار (ساعت)</label>
          <input
            id="ss-backup-interval"
            type="number"
            min={1}
            value={profile.backupIntervalHours}
            onChange={(e) => update("backupIntervalHours", Number(e.target.value) || 24)}
            disabled={!profile.autoBackupEnabled}
          />
        </div>
      </div>

      <div style={{ marginTop: 12 }}>
        <button type="button" className="btn-primary" onClick={() => void handleBackupNow()} disabled={backupBusy}>
          بکاپ‌گیری الان
        </button>
        {backupFolderActual ? (
          <span style={{ marginRight: 12, color: "var(--sv-text-600)", fontSize: 13 }}>پوشهٔ فعلی: {backupFolderActual}</span>
        ) : null}
      </div>
      {backupMessage ? (
        <p style={{ color: backupMessage.type === "error" ? "var(--sv-danger)" : "var(--sv-success)" }}>{backupMessage.text}</p>
      ) : null}

      {backups.length > 0 ? (
        <table className="data-table" style={{ marginTop: 12 }}>
          <thead>
            <tr>
              <th>فایل</th>
              <th>تاریخ</th>
              <th>حجم</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {backups.map((b) => (
              <tr key={b.filePath}>
                <td>{b.fileName}</td>
                <td>{new Date(b.createdAt).toLocaleString("fa-IR")}</td>
                <td>{(b.sizeBytes / 1024).toFixed(0)} کیلوبایت</td>
                <td style={{ display: "flex", gap: 8 }}>
                  <button type="button" className="btn-secondary" onClick={() => void handleRestore(b.filePath)} disabled={backupBusy}>
                    بازیابی
                  </button>
                  <button type="button" className="btn-secondary" onClick={() => void handleDeleteBackup(b.filePath)}>
                    حذف
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p className="empty-state">هنوز بکاپی گرفته نشده است.</p>
      )}

      <h3 style={{ marginTop: "var(--sv-space-6)" }}>به‌روزرسانی برنامه</h3>
      <p style={{ marginTop: 0, color: "var(--sv-text-600)", fontSize: 13 }}>
        نسخهٔ فعلی: {appVersion || "—"}
        {updateStatus?.phase === "available" || updateStatus?.phase === "downloaded"
          ? ` — نسخهٔ جدید: ${updateStatus.version}`
          : null}
      </p>

      {updateStatus ? (
        <p
          style={{
            color:
              updateStatus.phase === "error"
                ? "var(--sv-danger)"
                : updateStatus.phase === "downloaded"
                  ? "var(--sv-success)"
                  : "var(--sv-text-600)"
          }}
        >
          {updateStatus.phase === "checking" && "در حال بررسی به‌روزرسانی..."}
          {updateStatus.phase === "up-to-date" && "برنامه به‌روز است."}
          {updateStatus.phase === "available" && `نسخهٔ جدید (${updateStatus.version}) موجود است.`}
          {updateStatus.phase === "downloading" && `در حال دانلود... ${updateStatus.percent}%`}
          {updateStatus.phase === "downloaded" && `دانلود کامل شد (${updateStatus.version}) — آمادهٔ نصب.`}
          {updateStatus.phase === "error" && updateStatus.error}
        </p>
      ) : null}

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button type="button" className="btn-secondary" onClick={() => void handleCheckForUpdate()} disabled={updateBusy}>
          بررسی به‌روزرسانی
        </button>
        {updateStatus?.phase === "available" ? (
          <button type="button" className="btn-primary" onClick={() => void handleDownloadUpdate()} disabled={updateBusy}>
            دانلود به‌روزرسانی
          </button>
        ) : null}
        {updateStatus?.phase === "downloaded" ? (
          <button type="button" className="btn-primary" onClick={() => void handleInstallUpdate()}>
            نصب و راه‌اندازی مجدد
          </button>
        ) : null}
        <button type="button" className="btn-secondary" onClick={() => void handleOpenReleasesPage()}>
          مشاهدهٔ نسخه‌های قبلی (بازگشت دستی)
        </button>
      </div>
      <p style={{ marginTop: 8, color: "var(--sv-text-600)", fontSize: 12 }}>
        در صورت بروز مشکل بعد از به‌روزرسانی، از دکمهٔ «مشاهدهٔ نسخه‌های قبلی» برای دانلود و نصب دستی یک نسخهٔ قدیمی‌تر استفاده کنید — بازگشت خودکار به نسخهٔ قبلی پشتیبانی نمی‌شود.
      </p>

      <h3 style={{ marginTop: "var(--sv-space-6)" }}>تنظیمات اینترنت</h3>
      <div className="form-row">
        <div>
          <label htmlFor="ss-offline">حالت آفلاین</label>
          <select
            id="ss-offline"
            value={profile.offlineModeEnabled ? "on" : "off"}
            onChange={(e) => update("offlineModeEnabled", e.target.value === "on")}
          >
            <option value="off">اتصال عادی به اینترنت</option>
            <option value="on">آفلاین (بدون اتصال به سایت قیمت لحظه‌ای)</option>
          </select>
        </div>
        <div>
          <label htmlFor="ss-proxy">آدرس Proxy (اختیاری)</label>
          <input
            id="ss-proxy"
            value={profile.proxyAddress}
            onChange={(e) => update("proxyAddress", e.target.value)}
            disabled={profile.offlineModeEnabled}
          />
        </div>
      </div>

      <h3 style={{ marginTop: "var(--sv-space-6)" }}>افزونه‌ها</h3>
      <p style={{ marginTop: 0, color: "var(--sv-text-600)", fontSize: 13 }}>
        بخش‌هایی که نیاز ندارید را از نوار کناری مخفی کنید. تغییرات فوری اعمال می‌شوند و نیاز به
        «ذخیرهٔ تنظیمات» ندارند. بخش‌های اصلی (داشبورد، تنظیمات، امنیت) همیشه فعال می‌مانند.
      </p>
      <table className="data-table">
        <thead>
          <tr>
            <th>افزونه</th>
            <th>بخش</th>
            <th>وضعیت</th>
          </tr>
        </thead>
        <tbody>
          {allPlugins.map((plugin) => (
            <tr key={plugin.id}>
              <td>
                {plugin.icon} {plugin.label}
              </td>
              <td>{plugin.group ?? "سایر"}</td>
              <td>
                {plugin.essential ? (
                  <span style={{ color: "var(--sv-text-600)" }}>همیشه فعال</span>
                ) : (
                  <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <input
                      type="checkbox"
                      checked={!isDisabled(plugin.id)}
                      onChange={(e) => setEnabled(plugin.id, e.target.checked)}
                    />
                    {isDisabled(plugin.id) ? "غیرفعال" : "فعال"}
                  </label>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <button type="button" className="btn-primary" onClick={handleSave} disabled={status === "loading"}>
        ذخیرهٔ تنظیمات فروشگاه
      </button>
      {status === "saved" ? <span style={{ marginInlineStart: 12, color: "var(--sv-success)" }}>ذخیره شد.</span> : null}
    </div>
  );
}
