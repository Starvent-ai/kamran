import { useEffect, useMemo, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { fillTemplate, useSmsTemplates } from "./useSmsTemplates";
import { useSmsLog } from "./useSmsLog";
import { useIncomingCaptureListener, useIncomingCaptures } from "./useIncomingCaptures";
import { useSmsEventQueue } from "./useSmsEventQueue";
import { useCustomers } from "@/modules/customers/useCustomers";
import { useInstallments, getNextDueDate } from "@/modules/installments/useInstallments";
import { gregorianToJalali, jalaliMonthDayFromIsoDate } from "@/lib/jalali";
import { useCollateral } from "@/modules/collateral/useCollateral";
import { loadStoreProfile, DEFAULT_STORE_PROFILE, type StoreProfile } from "@/lib/storeProfile";
import { formatDateForDisplay } from "@/lib/jalali";
import { generateId } from "@/lib/id";
import {
  SMS_TEMPLATE_CATEGORIES,
  type SmsGatewayConfig,
  type SmsGatewayParam,
  type SmsTemplateCategory,
  type PhoneCaptureConfig
} from "@shared/types";

const DEFAULT_GATEWAY_CONFIG: SmsGatewayConfig = {
  endpoint: "",
  method: "GET",
  apiKey: "",
  senderNumber: "",
  params: [
    { id: "p1", key: "apikey", valueTemplate: "{apikey}" },
    { id: "p2", key: "sender", valueTemplate: "{sender}" },
    { id: "p3", key: "receptor", valueTemplate: "{phone}" },
    { id: "p4", key: "message", valueTemplate: "{message}" }
  ]
};

interface ComposeTarget {
  phone: string;
  customerName: string;
  suggestedCategory: SmsTemplateCategory;
  suggestedValues?: Record<string, string>;
}

export function Notifications(): JSX.Element {
  useIncomingCaptureListener();

  const { templates, createTemplate, updateTemplate, deleteTemplate } = useSmsTemplates();
  const { entries: logEntries, addLogEntry } = useSmsLog();
  const { captures, addCapture, markHandled, dismissCapture } = useIncomingCaptures();
  const { pendingEvents, markHandled: markEventHandled } = useSmsEventQueue();
  const { customers } = useCustomers();
  const { contracts, paidInstallmentCount } = useInstallments();
  const { records: collateralRecords, isNearDue } = useCollateral();

  const [storeProfile, setStoreProfile] = useState<StoreProfile>(DEFAULT_STORE_PROFILE);
  const [gatewayConfig, setGatewayConfig] = useState<SmsGatewayConfig>(DEFAULT_GATEWAY_CONFIG);
  const [captureConfig, setCaptureConfig] = useState<PhoneCaptureConfig>({ networkListenerEnabled: false, port: 8787 });
  const [manualPhone, setManualPhone] = useState("");
  const manualInputRef = useRef<HTMLInputElement | null>(null);

  const [composeTarget, setComposeTarget] = useState<ComposeTarget | null>(null);
  const [composeCategory, setComposeCategory] = useState<SmsTemplateCategory>("سایر");
  const [composeMessage, setComposeMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState<string | null>(null);

  const [newTemplateCategory, setNewTemplateCategory] = useState<SmsTemplateCategory>("سایر");
  const [newTemplateTitle, setNewTemplateTitle] = useState("");
  const [newTemplateBody, setNewTemplateBody] = useState("");

  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);
  const [editTemplateTitle, setEditTemplateTitle] = useState("");
  const [editTemplateBody, setEditTemplateBody] = useState("");

  useEffect(() => {
    let cancelled = false;
    loadStoreProfile().then((p) => {
      if (!cancelled) setStoreProfile(p);
    });
    if (window.starvent) {
      window.starvent.sms.getConfig().then((cfg) => {
        if (!cancelled && cfg) setGatewayConfig(cfg);
      });
      window.starvent.phoneCapture.getConfig().then((cfg) => {
        if (!cancelled && cfg) setCaptureConfig(cfg);
      });
    }
    return () => {
      cancelled = true;
    };
  }, []);

  // Automatic reminders: birthday (one day before, per spec), near-due
  // installments, near-due collateral.
  const todayReminders = useMemo(() => {
    // Birthdays are entered/stored as a Jalali month-day (see Customers'
    // Jalali date picker) — so "tomorrow" must be computed in the Jalali
    // calendar too, or the comparison would silently compare the wrong
    // calendar and never fire (or fire on the wrong day).
    const tomorrowGregorian = new Date();
    tomorrowGregorian.setDate(tomorrowGregorian.getDate() + 1);
    const [, tjm, tjd] = gregorianToJalali(
      tomorrowGregorian.getFullYear(),
      tomorrowGregorian.getMonth() + 1,
      tomorrowGregorian.getDate()
    );
    const tomorrowJalaliMonthDay = `${String(tjm).padStart(2, "0")}-${String(tjd).padStart(2, "0")}`;

    const items: { key: string; label: string; target: ComposeTarget }[] = [];

    for (const customer of customers) {
      if (customer.birthday && jalaliMonthDayFromIsoDate(customer.birthday) === tomorrowJalaliMonthDay) {
        items.push({
          key: `bday-${customer.id}`,
          label: `فردا تولد ${customer.fullName} است`,
          target: { phone: customer.phone, customerName: customer.fullName, suggestedCategory: "تبریک تولد" }
        });
      }
    }

    for (const contract of contracts) {
      if (contract.status !== "در جریان") continue;
      const nextDue = getNextDueDate(contract, paidInstallmentCount(contract.id));
      if (!nextDue) continue;
      const diffDays = Math.floor((nextDue.getTime() - Date.now()) / 86400000);
      if (diffDays <= storeProfile.installmentReminderDaysBefore) {
        items.push({
          key: `inst-${contract.id}`,
          label: `قسط ${contract.customerName} نزدیک سررسید (${formatDateForDisplay(nextDue.toISOString())})`,
          target: {
            phone: customers.find((c) => c.fullName === contract.customerName)?.phone ?? "",
            customerName: contract.customerName,
            suggestedCategory: "یادآوری قسط",
            suggestedValues: { مبلغ: contract.monthlyAmount.toLocaleString("fa-IR"), تاریخ: formatDateForDisplay(nextDue.toISOString()) }
          }
        });
      }
    }

    for (const record of collateralRecords) {
      if (!isNearDue(record)) continue;
      items.push({
        key: `col-${record.id}`,
        label: `${record.type} مربوط به «${record.relatedTo}» نزدیک سررسید (${formatDateForDisplay(record.dueDate)})`,
        target: {
          phone: customers.find((c) => c.fullName === record.relatedTo)?.phone ?? "",
          customerName: record.relatedTo,
          suggestedCategory: "یادآوری چک",
          suggestedValues: { تاریخ: formatDateForDisplay(record.dueDate) }
        }
      });
    }

    return items;
  }, [customers, contracts, collateralRecords, isNearDue, storeProfile.installmentReminderDaysBefore]);

  function openCompose(target: ComposeTarget): void {
    setComposeTarget(target);
    setComposeCategory(target.suggestedCategory);
    setSendResult(null);
    const template = templates.find((t) => t.category === target.suggestedCategory);
    const values: Record<string, string> = {
      نام_مشتری: target.customerName || "مشتری",
      نام_فروشگاه: storeProfile.storeName || "فروشگاه",
      نام_کالا: target.suggestedValues?.نام_کالا ?? "",
      مبلغ: target.suggestedValues?.مبلغ ?? "",
      تاریخ: target.suggestedValues?.تاریخ ?? ""
    };
    setComposeMessage(template ? fillTemplate(template.body, values) : "");
  }

  function handleCategoryChangeInCompose(category: SmsTemplateCategory): void {
    setComposeCategory(category);
    if (!composeTarget) return;
    const template = templates.find((t) => t.category === category);
    const values: Record<string, string> = {
      نام_مشتری: composeTarget.customerName || "مشتری",
      نام_فروشگاه: storeProfile.storeName || "فروشگاه",
      نام_کالا: composeTarget.suggestedValues?.نام_کالا ?? "",
      مبلغ: composeTarget.suggestedValues?.مبلغ ?? "",
      تاریخ: composeTarget.suggestedValues?.تاریخ ?? ""
    };
    setComposeMessage(template ? fillTemplate(template.body, values) : "");
  }

  async function handleSend(): Promise<void> {
    if (!composeTarget || !composeMessage.trim()) return;
    setSending(true);
    setSendResult(null);

    if (!window.starvent) {
      addLogEntry({
        phone: composeTarget.phone,
        message: composeMessage,
        status: "شبیه‌سازی (بدون تنظیمات پنل)",
        errorDetail: null,
        templateId: templates.find((t) => t.category === composeCategory)?.id ?? null
      });
      setSendResult("در محیط توسعه، ارسال واقعی شبیه‌سازی شد (در نسخهٔ نصب‌شده واقعاً ارسال می‌شود).");
      setSending(false);
      return;
    }

    const result = await window.starvent.sms.send(gatewayConfig, composeTarget.phone, composeMessage);
    addLogEntry({
      phone: composeTarget.phone,
      message: composeMessage,
      status: result.ok ? "ارسال شد" : "ناموفق",
      errorDetail: result.error,
      templateId: templates.find((t) => t.category === composeCategory)?.id ?? null
    });
    setSendResult(result.ok ? "پیامک با موفقیت ارسال شد." : `ارسال ناموفق بود: ${result.error}`);
    setSending(false);
  }

  async function handleSaveGatewayConfig(): Promise<void> {
    if (window.starvent) await window.starvent.sms.saveConfig(gatewayConfig);
  }

  async function handleSaveCaptureConfig(): Promise<void> {
    if (window.starvent) await window.starvent.phoneCapture.saveConfig(captureConfig);
  }

  function updateParam(paramId: string, field: keyof SmsGatewayParam, value: string): void {
    setGatewayConfig((prev) => ({
      ...prev,
      params: prev.params.map((p) => (p.id === paramId ? { ...p, [field]: value } : p))
    }));
  }

  function addParam(): void {
    setGatewayConfig((prev) => ({
      ...prev,
      params: [...prev.params, { id: generateId("p"), key: "", valueTemplate: "" }]
    }));
  }

  function removeParam(paramId: string): void {
    setGatewayConfig((prev) => ({ ...prev, params: prev.params.filter((p) => p.id !== paramId) }));
  }

  function handleManualPhoneKeyDown(event: KeyboardEvent<HTMLInputElement>): void {
    if (event.key !== "Enter") return;
    const value = manualPhone.trim();
    if (!value) return;
    addCapture(value, "دستگاه (کیبورد)");
    setManualPhone("");
    manualInputRef.current?.focus();
  }

  function handleCreateTemplate(event: FormEvent): void {
    event.preventDefault();
    if (!newTemplateTitle.trim() || !newTemplateBody.trim()) return;
    createTemplate({ category: newTemplateCategory, title: newTemplateTitle.trim(), body: newTemplateBody.trim() });
    setNewTemplateTitle("");
    setNewTemplateBody("");
  }

  function startEditTemplate(templateId: string, title: string, body: string): void {
    setEditingTemplateId(templateId);
    setEditTemplateTitle(title);
    setEditTemplateBody(body);
  }

  function saveEditTemplate(templateId: string): void {
    if (!editTemplateTitle.trim() || !editTemplateBody.trim()) return;
    updateTemplate(templateId, { title: editTemplateTitle.trim(), body: editTemplateBody.trim() });
    setEditingTemplateId(null);
  }

  function customerNameForPhone(phone: string): string {
    return customers.find((c) => c.phone === phone)?.fullName ?? "ناشناس";
  }

  return (
    <div>
      <div className="card">
        <h3 style={{ marginTop: 0 }}>دریافت شمارهٔ مشتری از دستگاه</h3>
        <p style={{ color: "var(--sv-text-600)", marginTop: 0 }}>
          اگر دستگاه ثبت‌شماره مثل صفحه‌کلید عمل می‌کند (تایپ می‌کند)، همین کادر زیر را همیشه فعال
          (focus) نگه دارید — عدد را وارد و کلید Enter دستگاه، مستقیم آن را به صف زیر اضافه می‌کند.
          اگر دستگاه در شبکه است و می‌تواند به یک آدرس وب پیام بفرستد، از تنظیمات شبکه پایین استفاده کنید.
        </p>
        <div className="form-row">
          <div>
            <label htmlFor="manual-phone">ورودی مستقیم دستگاه (یا تایپ دستی)</label>
            <input
              id="manual-phone"
              ref={manualInputRef}
              value={manualPhone}
              onChange={(e) => setManualPhone(e.target.value.replace(/\D/g, "").slice(0, 11))}
              onKeyDown={handleManualPhoneKeyDown}
              inputMode="numeric"
              maxLength={11}
              placeholder="شماره را وارد و Enter بزنید"
              autoFocus
            />
          </div>
        </div>

        <h4>اتصال شبکه‌ای (اختیاری)</h4>
        <div className="form-row">
          <div>
            <label htmlFor="cap-enabled">دریافت شبکه‌ای</label>
            <select
              id="cap-enabled"
              value={captureConfig.networkListenerEnabled ? "on" : "off"}
              onChange={(e) => setCaptureConfig((c) => ({ ...c, networkListenerEnabled: e.target.value === "on" }))}
            >
              <option value="off">غیرفعال</option>
              <option value="on">فعال</option>
            </select>
          </div>
          <div>
            <label htmlFor="cap-port">پورت دریافت</label>
            <input
              id="cap-port"
              type="number"
              value={captureConfig.port}
              onChange={(e) => setCaptureConfig((c) => ({ ...c, port: Number(e.target.value) || 8787 }))}
              disabled={!captureConfig.networkListenerEnabled}
            />
          </div>
        </div>
        <p style={{ color: "var(--sv-text-600)", fontSize: 12.5 }}>
          دستگاه باید به آدرس <code>http://[آی‌پی این سیستم]:{captureConfig.port}/capture?phone=شماره</code> پیام
          بفرستد (GET یا POST هردو پشتیبانی می‌شود).
        </p>
        <button type="button" className="btn-primary" onClick={handleSaveCaptureConfig}>
          ذخیرهٔ تنظیمات دریافت شماره
        </button>
      </div>

      <div className="card" style={{ marginTop: 24 }}>
        <h3 style={{ marginTop: 0 }}>صندوق شماره‌های دریافتی</h3>
        {captures.length === 0 ? (
          <p className="empty-state">هنوز شماره‌ای دریافت نشده است.</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>شماره</th>
                <th>مشتری</th>
                <th>منبع</th>
                <th>زمان</th>
                <th>عملیات</th>
              </tr>
            </thead>
            <tbody>
              {captures.map((capture) => (
                <tr key={capture.id}>
                  <td>{capture.phone}</td>
                  <td>{customerNameForPhone(capture.phone)}</td>
                  <td>{capture.source}</td>
                  <td>{new Date(capture.receivedAt).toLocaleTimeString("fa-IR")}</td>
                  <td style={{ display: "flex", gap: 6 }}>
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={() => {
                        openCompose({
                          phone: capture.phone,
                          customerName: customerNameForPhone(capture.phone),
                          suggestedCategory: "دستگاه آماده"
                        });
                        markHandled(capture.id);
                      }}
                    >
                      ارسال پیامک
                    </button>
                    <button type="button" className="btn-secondary" onClick={() => dismissCapture(capture.id)}>
                      حذف
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="card" style={{ marginTop: 24 }}>
        <h3 style={{ marginTop: 0 }}>رویدادهای لحظه‌ای</h3>
        <p style={{ color: "var(--sv-text-600)", marginTop: 0, fontSize: 13 }}>
          این‌ها بلافاصله وقتی یک رویداد واقعی رخ می‌ده (مثلاً ثبت مشتری جدید یا آماده شدن تعمیر)
          این‌جا ظاهر می‌شن — نیازی نیست منتظر باز کردن این صفحه بمونید تا برنامه متوجه بشه.
        </p>
        {pendingEvents.length === 0 ? (
          <p className="empty-state">رویداد جدیدی در انتظار نیست.</p>
        ) : (
          <ul style={{ paddingInlineStart: 20 }}>
            {pendingEvents.map((event) => (
              <li key={event.id} style={{ marginBottom: 8, display: "flex", alignItems: "center", gap: 8 }}>
                <span>
                  {event.eventLabel} — {event.customerName}
                </span>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => {
                    openCompose({
                      phone: event.phone,
                      customerName: event.customerName,
                      suggestedCategory: event.category,
                      suggestedValues: event.suggestedValues
                    });
                    markEventHandled(event.id);
                  }}
                >
                  ارسال پیامک
                </button>
                <button type="button" className="btn-secondary" onClick={() => markEventHandled(event.id)}>
                  نادیده گرفتن
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="card" style={{ marginTop: 24 }}>
        <h3 style={{ marginTop: 0 }}>یادآوری‌های امروز</h3>
        {todayReminders.length === 0 ? (
          <p className="empty-state">یادآوری‌ای برای امروز وجود ندارد.</p>
        ) : (
          <ul style={{ paddingInlineStart: 20 }}>
            {todayReminders.map((reminder) => (
              <li key={reminder.key} style={{ marginBottom: 8, display: "flex", alignItems: "center", gap: 8 }}>
                <span>{reminder.label}</span>
                <button type="button" className="btn-secondary" onClick={() => openCompose(reminder.target)}>
                  ارسال پیامک
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {composeTarget ? (
        <div className="card" style={{ marginTop: 24 }}>
          <h3 style={{ marginTop: 0 }}>ارسال پیامک — {composeTarget.customerName || composeTarget.phone}</h3>
          <div className="form-row">
            <div>
              <label htmlFor="compose-category">دسته پیامک</label>
              <select
                id="compose-category"
                value={composeCategory}
                onChange={(e) => handleCategoryChangeInCompose(e.target.value as SmsTemplateCategory)}
              >
                {SMS_TEMPLATE_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="compose-phone">شماره گیرنده</label>
              <input
                id="compose-phone"
                value={composeTarget.phone}
                onChange={(e) => setComposeTarget((t) => (t ? { ...t, phone: e.target.value.replace(/\D/g, "").slice(0, 11) } : t))}
                inputMode="numeric"
                maxLength={11}
              />
            </div>
          </div>
          <div className="form-row">
            <div style={{ gridColumn: "1 / -1" }}>
              <label htmlFor="compose-message">متن پیامک</label>
              <textarea
                id="compose-message"
                value={composeMessage}
                onChange={(e) => setComposeMessage(e.target.value)}
                rows={3}
                style={{ width: "100%", resize: "vertical" }}
              />
            </div>
          </div>
          <button type="button" className="btn-primary" onClick={handleSend} disabled={sending || !composeTarget.phone}>
            {sending ? "در حال ارسال..." : "ارسال پیامک"}
          </button>
          <button type="button" className="btn-secondary" style={{ marginInlineStart: 8 }} onClick={() => setComposeTarget(null)}>
            انصراف
          </button>
          {sendResult ? <p style={{ marginTop: 8 }}>{sendResult}</p> : null}
        </div>
      ) : null}

      <div className="card" style={{ marginTop: 24 }}>
        <h3 style={{ marginTop: 0 }}>تنظیمات پنل پیامکی</h3>
        <p style={{ color: "var(--sv-text-600)", marginTop: 0 }}>
          هر پنل پیامکی ایرانی (کاوه‌نگار، ملی‌پیامک و غیره) مستندات خودش را دارد؛ پارامترهای زیر را
          دقیقاً طبق مستندات پنل خودتان پر کنید.
        </p>
        <div className="form-row">
          <div style={{ gridColumn: "1 / -1" }}>
            <label htmlFor="gw-endpoint">آدرس API پنل پیامکی</label>
            <input
              id="gw-endpoint"
              value={gatewayConfig.endpoint}
              onChange={(e) => setGatewayConfig((c) => ({ ...c, endpoint: e.target.value }))}
            />
          </div>
        </div>
        <div className="form-row">
          <div>
            <label htmlFor="gw-method">روش ارسال</label>
            <select
              id="gw-method"
              value={gatewayConfig.method}
              onChange={(e) => setGatewayConfig((c) => ({ ...c, method: e.target.value as "GET" | "POST" }))}
            >
              <option value="GET">GET</option>
              <option value="POST">POST</option>
            </select>
          </div>
          <div>
            <label htmlFor="gw-apikey">کلید API</label>
            <input id="gw-apikey" value={gatewayConfig.apiKey} onChange={(e) => setGatewayConfig((c) => ({ ...c, apiKey: e.target.value }))} />
          </div>
          <div>
            <label htmlFor="gw-sender">شمارهٔ فرستنده</label>
            <input
              id="gw-sender"
              value={gatewayConfig.senderNumber}
              onChange={(e) => setGatewayConfig((c) => ({ ...c, senderNumber: e.target.value }))}
            />
          </div>
        </div>

        <h4>پارامترهای درخواست</h4>
        {gatewayConfig.params.map((param) => (
          <div className="form-row" key={param.id}>
            <div>
              <label>نام پارامتر</label>
              <input value={param.key} onChange={(e) => updateParam(param.id, "key", e.target.value)} />
            </div>
            <div>
              <label>مقدار (می‌تواند شامل {"{phone} {message} {sender} {apikey}"} باشد)</label>
              <input value={param.valueTemplate} onChange={(e) => updateParam(param.id, "valueTemplate", e.target.value)} />
            </div>
            <div style={{ display: "flex", alignItems: "flex-end" }}>
              <button type="button" className="btn-secondary" onClick={() => removeParam(param.id)}>
                حذف
              </button>
            </div>
          </div>
        ))}
        <button type="button" className="btn-secondary" onClick={addParam}>
          افزودن پارامتر
        </button>
        <div style={{ marginTop: 16 }}>
          <button type="button" className="btn-primary" onClick={handleSaveGatewayConfig}>
            ذخیرهٔ تنظیمات پنل پیامکی
          </button>
        </div>
      </div>

      <div className="card" style={{ marginTop: 24 }}>
        <h3 style={{ marginTop: 0 }}>کتابخانهٔ قالب‌های پیامک</h3>
        <form onSubmit={handleCreateTemplate}>
          <div className="form-row">
            <div>
              <label htmlFor="tmpl-category">دسته</label>
              <select id="tmpl-category" value={newTemplateCategory} onChange={(e) => setNewTemplateCategory(e.target.value as SmsTemplateCategory)}>
                {SMS_TEMPLATE_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="tmpl-title">عنوان قالب</label>
              <input id="tmpl-title" value={newTemplateTitle} onChange={(e) => setNewTemplateTitle(e.target.value)} required />
            </div>
          </div>
          <div className="form-row">
            <div style={{ gridColumn: "1 / -1" }}>
              <label htmlFor="tmpl-body">
                متن قالب (پلیس‌هولدرها: {"{نام_مشتری} {نام_کالا} {مبلغ} {تاریخ} {نام_فروشگاه}"})
              </label>
              <textarea
                id="tmpl-body"
                value={newTemplateBody}
                onChange={(e) => setNewTemplateBody(e.target.value)}
                rows={2}
                style={{ width: "100%", resize: "vertical" }}
                required
              />
            </div>
          </div>
          <button type="submit" className="btn-primary">
            افزودن قالب
          </button>
        </form>

        <table className="data-table" style={{ marginTop: 16 }}>
          <thead>
            <tr>
              <th>دسته</th>
              <th>عنوان</th>
              <th>متن</th>
              <th>عملیات</th>
            </tr>
          </thead>
          <tbody>
            {templates.map((t) =>
              editingTemplateId === t.id ? (
                <tr key={t.id}>
                  <td>{t.category}</td>
                  <td>
                    <input value={editTemplateTitle} onChange={(e) => setEditTemplateTitle(e.target.value)} />
                  </td>
                  <td>
                    <textarea
                      value={editTemplateBody}
                      onChange={(e) => setEditTemplateBody(e.target.value)}
                      rows={2}
                      style={{ width: "100%", resize: "vertical" }}
                    />
                  </td>
                  <td style={{ display: "flex", gap: 6 }}>
                    <button type="button" className="btn-primary" onClick={() => saveEditTemplate(t.id)}>
                      ذخیره
                    </button>
                    <button type="button" className="btn-secondary" onClick={() => setEditingTemplateId(null)}>
                      انصراف
                    </button>
                  </td>
                </tr>
              ) : (
                <tr key={t.id}>
                  <td>{t.category}</td>
                  <td>{t.title}</td>
                  <td style={{ maxWidth: 320 }}>{t.body}</td>
                  <td style={{ display: "flex", gap: 6 }}>
                    <button type="button" className="btn-secondary" onClick={() => startEditTemplate(t.id, t.title, t.body)}>
                      ویرایش
                    </button>
                    <button type="button" className="btn-secondary" onClick={() => deleteTemplate(t.id)}>
                      حذف
                    </button>
                  </td>
                </tr>
              )
            )}
          </tbody>
        </table>
      </div>

      <div className="card" style={{ marginTop: 24 }}>
        <h3 style={{ marginTop: 0 }}>تاریخچهٔ پیامک‌های ارسالی</h3>
        {logEntries.length === 0 ? (
          <p className="empty-state">هنوز پیامکی ارسال نشده است.</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>زمان</th>
                <th>شماره</th>
                <th>متن</th>
                <th>وضعیت</th>
              </tr>
            </thead>
            <tbody>
              {logEntries.map((entry) => (
                <tr key={entry.id}>
                  <td>{new Date(entry.createdAt).toLocaleString("fa-IR")}</td>
                  <td>{entry.phone}</td>
                  <td style={{ maxWidth: 280 }}>{entry.message}</td>
                  <td className={entry.status === "ناموفق" ? "data-table__low-stock" : undefined}>{entry.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
