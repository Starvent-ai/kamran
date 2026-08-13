import { useState, type FormEvent } from "react";
import { useCollateral } from "./useCollateral";
import { useSortableRows } from "@/components/useSortableRows";
import { SortableTh } from "@/components/SortableTh";
import { CurrencyInput } from "@/components/CurrencyInput";
import type { CollateralRecord, CollateralStatus, CollateralType } from "@shared/types";
import { formatDateForDisplay } from "@/lib/jalali";

const TYPES: CollateralType[] = ["چک", "طلا", "سفته", "ضامن", "اعتباری", "سایر"];
/** The bank for credit-type (اعتباری) guarantees is always همین یک بانک —
 *  fixed and shown read-only, never an editable field, so it can't be
 *  typed incorrectly. */
const CREDIT_GUARANTEE_BANK = "بانک ملی";

export function Collateral(): JSX.Element {
  const { records, createCollateral, updateStatus, isNearDue } = useCollateral();
  const { sorted, sortKey, direction, toggleSort } = useSortableRows<CollateralRecord>(records, "dueDate", "asc");

  const [type, setType] = useState<CollateralType>("چک");
  const [relatedTo, setRelatedTo] = useState("");
  const [description, setDescription] = useState("");
  const [guarantorName, setGuarantorName] = useState("");
  const [buyerName, setBuyerName] = useState("");
  const [dueDate, setDueDate] = useState(new Date().toISOString().slice(0, 10));
  const [amount, setAmount] = useState(0);

  function handleSubmit(event: FormEvent): void {
    event.preventDefault();
    if (!description.trim()) return;
    createCollateral({
      type,
      relatedTo: relatedTo.trim(),
      description: description.trim(),
      guarantorName: guarantorName.trim(),
      buyerName: buyerName.trim(),
      dueDate,
      amount
    });
    setRelatedTo("");
    setDescription("");
    setGuarantorName("");
    setBuyerName("");
    setAmount(0);
  }

  const nearDueCount = records.filter(isNearDue).length;
  const executedRecords = sorted.filter((r) => r.status === "ضبط شده");

  return (
    <div>
      {nearDueCount > 0 ? (
        <div className="card" style={{ borderColor: "var(--sv-warning)" }}>
          <p style={{ margin: 0, color: "var(--sv-warning)", fontWeight: 600 }}>
            {nearDueCount} مورد ضمانت به سررسید نزدیک شده یا سررسیدش گذشته — لطفاً بررسی کنید.
          </p>
        </div>
      ) : null}

      <div className="card" style={{ marginTop: nearDueCount > 0 ? 24 : 0 }}>
        <h3 style={{ marginTop: 0 }}>ثبت ضمانت جدید</h3>
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div>
              <label htmlFor="col-type">نوع ضمانت</label>
              <select id="col-type" value={type} onChange={(e) => setType(e.target.value as CollateralType)}>
                {TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="col-related">مربوط به (فروش/تعمیر/قسط)</label>
              <input id="col-related" value={relatedTo} onChange={(e) => setRelatedTo(e.target.value)} placeholder="مثلاً: پروندهٔ اقساط محمدی" />
            </div>
            <div>
              <label htmlFor="col-guarantor">نام ضامن / صادرکننده</label>
              <input id="col-guarantor" value={guarantorName} onChange={(e) => setGuarantorName(e.target.value)} />
            </div>
            <div>
              <label htmlFor="col-buyer">نام خریدار</label>
              <input id="col-buyer" value={buyerName} onChange={(e) => setBuyerName(e.target.value)} />
            </div>
            {type === "اعتباری" ? (
              <div>
                <label htmlFor="col-bank">بانک</label>
                <input id="col-bank" value={CREDIT_GUARANTEE_BANK} disabled />
              </div>
            ) : null}
            <div>
              <label htmlFor="col-due">سررسید</label>
              <input id="col-due" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            </div>
            <div>
              <label htmlFor="col-amount">ارزش تخمینی (اختیاری)</label>
              <CurrencyInput id="col-amount" value={amount} onChange={setAmount} />
            </div>
          </div>
          <div className="form-row">
            <div style={{ gridColumn: "1 / -1" }}>
              <label htmlFor="col-desc">توضیحات (شمارهٔ چک/سفته و غیره)</label>
              <input id="col-desc" value={description} onChange={(e) => setDescription(e.target.value)} required />
            </div>
          </div>
          <p style={{ margin: "4px 0 16px", fontSize: 13, color: "var(--sv-text-400)" }}>
            اگر ارزش ثبت بشه، در صورت «ضبط شده» شدن وضعیت، به‌طور خودکار به‌عنوان درآمد در حسابداری ثبت می‌شه.
          </p>
          <button type="submit" className="btn-primary">
            ثبت ضمانت
          </button>
        </form>
      </div>

      <div className="card" style={{ marginTop: 24 }}>
        <h3 style={{ marginTop: 0 }}>لیست ضمانت‌ها</h3>
        <table className="data-table">
          <thead>
            <tr>
              <SortableTh label="نوع" sortKeyName="type" activeKey={sortKey} direction={direction} onSort={toggleSort} />
              <SortableTh label="مربوط به" sortKeyName="relatedTo" activeKey={sortKey} direction={direction} onSort={toggleSort} />
              <SortableTh label="ضامن" sortKeyName="guarantorName" activeKey={sortKey} direction={direction} onSort={toggleSort} />
              <SortableTh label="خریدار" sortKeyName="buyerName" activeKey={sortKey} direction={direction} onSort={toggleSort} />
              <SortableTh label="سررسید" sortKeyName="dueDate" activeKey={sortKey} direction={direction} onSort={toggleSort} />
              <SortableTh label="ارزش" sortKeyName="amount" activeKey={sortKey} direction={direction} onSort={toggleSort} />
              <th>وضعیت</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((record) => (
              <tr key={record.id}>
                <td>{record.type}</td>
                <td>{record.relatedTo || "—"}</td>
                <td>{record.guarantorName || "—"}</td>
                <td>{record.buyerName || "—"}</td>
                <td className={isNearDue(record) ? "data-table__low-stock" : undefined}>{formatDateForDisplay(record.dueDate)}</td>
                <td>{record.amount > 0 ? `${record.amount.toLocaleString("fa-IR")} تومان` : "—"}</td>
                <td>
                  <select
                    value={record.status}
                    onChange={(e) => updateStatus(record.id, e.target.value as CollateralStatus)}
                  >
                    <option value="معتبر">معتبر</option>
                    <option value="بازگردانده شده">بازگردانده شده</option>
                    <option value="ضبط شده">ضبط شده</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="card" style={{ marginTop: 24 }}>
        <h3 style={{ marginTop: 0 }}>ضمانت‌های اجرا شده</h3>
        <p style={{ marginTop: 0, color: "var(--sv-text-600)" }}>
          ضمانت‌هایی که به دلیل عدم پرداخت مشتری اجرا شده‌اند (مثلاً چک برای وصول به بانک برده شده).
        </p>
        {executedRecords.length === 0 ? (
          <p className="empty-state">فعلاً هیچ ضمانتی اجرا نشده است.</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>نوع</th>
                <th>مربوط به</th>
                <th>ضامن</th>
                <th>خریدار</th>
                <th>ارزش</th>
                <th>وضعیت</th>
              </tr>
            </thead>
            <tbody>
              {executedRecords.map((record) => (
                <tr key={record.id}>
                  <td>{record.type}</td>
                  <td>{record.relatedTo || "—"}</td>
                  <td>{record.guarantorName || "—"}</td>
                  <td>{record.buyerName || "—"}</td>
                  <td>{record.amount > 0 ? `${record.amount.toLocaleString("fa-IR")} تومان` : "—"}</td>
                  <td>
                    <select value={record.status} onChange={(e) => updateStatus(record.id, e.target.value as CollateralStatus)}>
                      <option value="معتبر">معتبر</option>
                      <option value="بازگردانده شده">بازگردانده شده</option>
                      <option value="ضبط شده">ضبط شده</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
