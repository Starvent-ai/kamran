import { useState, useEffect } from "react";
import { useInventory } from "@/modules/inventory/useInventory";
import { useSales } from "@/modules/sales/useSales";
import { useCustomers } from "@/modules/customers/useCustomers";
import { useRepairs } from "@/modules/repairs/useRepairs";
import { useInstallments, getNextDueDate } from "@/modules/installments/useInstallments";
import { useCollateral } from "@/modules/collateral/useCollateral";
import { formatDateForDisplay, getJalaliDateTime } from "@/lib/jalali";
import { getContentSuggestionForHour } from "@/lib/contentSuggestion";

function isSameDay(isoDateTime: string, reference: Date): boolean {
  const d = new Date(isoDateTime);
  return (
    d.getFullYear() === reference.getFullYear() &&
    d.getMonth() === reference.getMonth() &&
    d.getDate() === reference.getDate()
  );
}

function daysUntil(date: Date, reference: Date): number {
  const ms = date.setHours(0, 0, 0, 0) - new Date(reference).setHours(0, 0, 0, 0);
  return Math.round(ms / 86400000);
}

export function Dashboard(): JSX.Element {
  const { items } = useInventory();
  const { sales } = useSales();
  const { customers } = useCustomers();
  const { tickets } = useRepairs();
  const { contracts, paidInstallmentCount } = useInstallments();
  const { records: collateralRecords, isNearDue } = useCollateral();

  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 60000);
    return () => window.clearInterval(timer);
  }, []);

  const today = now;
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);

  const todaySales = sales.filter((s) => isSameDay(s.createdAt, today));
  const yesterdaySales = sales.filter((s) => isSameDay(s.createdAt, yesterday));
  const todayTotal = todaySales.reduce((sum, s) => sum + s.total, 0);
  const yesterdayTotal = yesterdaySales.reduce((sum, s) => sum + s.total, 0);
  const salesChangePercent = yesterdayTotal > 0 ? Math.round(((todayTotal - yesterdayTotal) / yesterdayTotal) * 100) : null;

  const lowStockItems = items.filter((i) => i.quantity <= i.lowStockThreshold);
  const repairsReadyForPickup = tickets.filter((t) => t.status === "تکمیل شده");
  const repairsDueToday = tickets.filter(
    (t) => t.deliveryDate === today.toISOString().slice(0, 10) && t.status !== "تحویل داده شده"
  );

  const installmentsDueSoon = contracts
    .filter((c) => c.status === "در جریان")
    .map((c) => ({ contract: c, due: getNextDueDate(c, paidInstallmentCount(c.id)) }))
    .filter((entry): entry is { contract: (typeof contracts)[number]; due: Date } => entry.due !== null)
    .filter((entry) => daysUntil(new Date(entry.due), today) <= 3)
    .sort((a, b) => a.due.getTime() - b.due.getTime());

  const collateralDueSoon = collateralRecords.filter((r) => isNearDue(r));

  const todaysTaskCount =
    repairsDueToday.length + installmentsDueSoon.length + collateralDueSoon.length + lowStockItems.length;

  const jalaliNow = getJalaliDateTime(now);
  const contentSuggestion = getContentSuggestionForHour(now.getHours());

  return (
    <div>
      <div className="card">
        <h3 style={{ marginTop: 0 }}>
          {jalaliNow.weekday}، {jalaliNow.formattedDate} — {todaysTaskCount > 0 ? `${todaysTaskCount} کار برای امروز` : "امروز کار معوقی ثبت نشده"}
        </h3>
      </div>

      <div className="stat-grid" style={{ marginTop: 24 }}>
        <div className="stat-card">
          <span className="stat-card__label">فروش امروز</span>
          <span className="stat-card__value">{todayTotal.toLocaleString("fa-IR")} تومان</span>
          {salesChangePercent !== null ? (
            <span className="stat-card__trend" data-trend={salesChangePercent >= 0 ? "up" : "down"}>
              {salesChangePercent >= 0 ? "+" : ""}
              {salesChangePercent}٪ نسبت به دیروز
            </span>
          ) : (
            <span className="stat-card__trend" data-trend="flat">
              دیروز فروشی ثبت نشده بود
            </span>
          )}
        </div>
        <div className="stat-card">
          <span className="stat-card__label">تعمیرات آمادهٔ تحویل</span>
          <span className="stat-card__value">{repairsReadyForPickup.length}</span>
          <span className="stat-card__trend" data-trend={repairsReadyForPickup.length > 0 ? "down" : "flat"}>
            {repairsReadyForPickup.length > 0 ? "منتظر اطلاع به مشتری" : "چیزی در انتظار نیست"}
          </span>
        </div>
        <div className="stat-card">
          <span className="stat-card__label">اقساط نزدیک سررسید</span>
          <span className="stat-card__value">{installmentsDueSoon.length}</span>
          <span className="stat-card__trend" data-trend={installmentsDueSoon.length > 0 ? "down" : "flat"}>
            {installmentsDueSoon.length > 0 ? "تا ۳ روز آینده" : "چیزی نزدیک نیست"}
          </span>
        </div>
        <div className="stat-card">
          <span className="stat-card__label">موجودی رو به اتمام</span>
          <span className="stat-card__value">{lowStockItems.length}</span>
          <span className="stat-card__trend" data-trend={lowStockItems.length > 0 ? "down" : "flat"}>
            {lowStockItems.length > 0 ? "نیاز به بررسی" : "موجودی سالم"}
          </span>
        </div>
      </div>

      <div className="form-row" style={{ marginTop: 24, alignItems: "stretch" }}>
        <div className="card" style={{ margin: 0 }}>
          <h3 style={{ marginTop: 0 }}>کارهای امروز</h3>
          {todaysTaskCount === 0 ? (
            <p className="empty-state">چیزی برای پیگیری امروز نیست.</p>
          ) : (
            <ul style={{ margin: 0, paddingInlineStart: "var(--sv-space-5)", display: "flex", flexDirection: "column", gap: 8 }}>
              {repairsDueToday.map((t) => (
                <li key={`rep-${t.id}`}>تحویل امروز: {t.deviceModel} — {t.customerName || "بدون نام"}</li>
              ))}
              {installmentsDueSoon.map(({ contract, due }) => (
                <li key={`inst-${contract.id}`}>
                  قسط {contract.customerName}: سررسید {formatDateForDisplay(due.toISOString())}
                </li>
              ))}
              {collateralDueSoon.map((r) => (
                <li key={`col-${r.id}`}>
                  ضمانت رو به سررسید ({r.type}): {r.relatedTo || r.description}
                </li>
              ))}
              {lowStockItems.map((item) => (
                <li key={`stk-${item.id}`}>موجودی کم: {item.name} (فقط {item.quantity} عدد)</li>
              ))}
            </ul>
          )}
        </div>

        <div className="card" style={{ margin: 0 }}>
          <h3 style={{ marginTop: 0 }}>پیشنهاد محتوا برای اینستاگرام</h3>
          {contentSuggestion ? (
            <>
              <p style={{ margin: "0 0 4px 0", color: "var(--sv-gold-300)", fontWeight: 600 }}>
                {contentSuggestion.contentType}
              </p>
              <p style={{ margin: 0, color: "var(--sv-text-600)" }}>
                بازهٔ پیشنهادی: {contentSuggestion.hourRange} — {contentSuggestion.note}
              </p>
            </>
          ) : (
            <p className="empty-state">در این ساعت پیشنهاد خاصی نداریم — بعداً دوباره سر بزنید.</p>
          )}
          <p style={{ marginTop: 12, fontSize: 12, color: "var(--sv-text-600)" }}>
            این یک برنامهٔ ساعتی کلی است، نه تحلیل واقعی فالوورهای شما — Starvent به اینستاگرام شما
            دسترسی ندارد.
          </p>
        </div>
      </div>

      <div className="card" style={{ marginTop: 24 }}>
        <h3 style={{ marginTop: 0 }}>خلاصهٔ عملکرد دیروز</h3>
        <p style={{ color: "var(--sv-text-600)" }}>
          دیروز {yesterdaySales.length} فروش به مبلغ {yesterdayTotal.toLocaleString("fa-IR")} تومان ثبت شد. امروز تا این
          لحظه {todaySales.length} فروش به مبلغ {todayTotal.toLocaleString("fa-IR")} تومان — تعداد مشتریان کل:{" "}
          {customers.length.toLocaleString("fa-IR")}.
        </p>
      </div>

      <div className="card" style={{ marginTop: 24 }}>
        <h3 style={{ marginTop: 0 }}>آخرین فروش‌های ثبت‌شده</h3>
        {sales.length === 0 ? (
          <p className="empty-state">هنوز فروشی ثبت نشده. از بخش «فروش» یک تراکنش ثبت کنید.</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>کالا</th>
                <th>تعداد</th>
                <th>مبلغ کل</th>
                <th>تاریخ</th>
              </tr>
            </thead>
            <tbody>
              {sales
                .slice()
                .reverse()
                .slice(0, 6)
                .map((s) => (
                  <tr key={s.id}>
                    <td>{s.itemName}</td>
                    <td>{s.quantity}</td>
                    <td>{s.total.toLocaleString("fa-IR")} تومان</td>
                    <td>{formatDateForDisplay(s.createdAt)}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
