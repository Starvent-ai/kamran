import { useState, type FormEvent } from "react";
import { useSuppliers } from "./useSuppliers";
import { useSortableRows } from "@/components/useSortableRows";
import { SortableTh } from "@/components/SortableTh";
import type { PaymentMethod, Supplier } from "@shared/types";
import { formatDateForDisplay } from "@/lib/jalali";
import { CurrencyInput } from "@/components/CurrencyInput";

const PAYMENT_METHODS: PaymentMethod[] = ["نقد", "کارت‌خوان (پوز)", "انتقال وجه"];

export function Suppliers(): JSX.Element {
  const { suppliers, purchases, createSupplier, recordPurchase, settleBalance, setRating } = useSuppliers();
  const { sorted, sortKey, direction, toggleSort } = useSortableRows<Supplier>(suppliers, "name", "asc");

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [contractNotes, setContractNotes] = useState("");

  const [purchaseSupplierId, setPurchaseSupplierId] = useState("");
  const [itemDescription, setItemDescription] = useState("");
  const [amount, setAmount] = useState(0);
  const [paid, setPaid] = useState(false);
  const [purchaseMethod, setPurchaseMethod] = useState<PaymentMethod>("نقد");

  const [settleSupplierId, setSettleSupplierId] = useState("");
  const [settleAmount, setSettleAmount] = useState(0);
  const [settleMethod, setSettleMethod] = useState<PaymentMethod>("نقد");

  function handleCreateSupplier(event: FormEvent): void {
    event.preventDefault();
    if (!name.trim()) return;
    createSupplier({ name: name.trim(), phone: phone.trim(), address: address.trim(), contractNotes: contractNotes.trim() });
    setName("");
    setPhone("");
    setAddress("");
    setContractNotes("");
  }

  function handleRecordPurchase(event: FormEvent): void {
    event.preventDefault();
    if (!purchaseSupplierId || !itemDescription.trim()) return;
    recordPurchase({
      supplierId: purchaseSupplierId,
      itemDescription: itemDescription.trim(),
      amount,
      paid,
      paymentMethod: purchaseMethod
    });
    setItemDescription("");
    setAmount(0);
    setPaid(false);
  }

  function handleSettle(event: FormEvent): void {
    event.preventDefault();
    if (!settleSupplierId) return;
    settleBalance(settleSupplierId, settleAmount, settleMethod);
    setSettleAmount(0);
  }

  return (
    <div>
      <div className="card">
        <h3 style={{ marginTop: 0 }}>لیست تأمین‌کنندگان</h3>
        <table className="data-table">
          <thead>
            <tr>
              <SortableTh label="نام" sortKeyName="name" activeKey={sortKey} direction={direction} onSort={toggleSort} />
              <SortableTh label="تلفن" sortKeyName="phone" activeKey={sortKey} direction={direction} onSort={toggleSort} />
              <SortableTh label="بدهی/بستانکاری" sortKeyName="balance" activeKey={sortKey} direction={direction} onSort={toggleSort} />
              <SortableTh label="امتیاز" sortKeyName="rating" activeKey={sortKey} direction={direction} onSort={toggleSort} />
            </tr>
          </thead>
          <tbody>
            {sorted.map((s) => (
              <tr key={s.id}>
                <td>{s.name}</td>
                <td>{s.phone || "—"}</td>
                <td className={s.balance > 0 ? "data-table__low-stock" : undefined}>
                  {s.balance > 0 ? `${s.balance.toLocaleString("fa-IR")} (بدهکاریم)` : s.balance < 0 ? `${Math.abs(s.balance).toLocaleString("fa-IR")} (طلبکاریم)` : "تسویه"}
                </td>
                <td>
                  <select value={s.rating} onChange={(e) => setRating(s.id, Number(e.target.value))}>
                    {[0, 1, 2, 3, 4, 5].map((r) => (
                      <option key={r} value={r}>
                        {r} ⭐
                      </option>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="card" style={{ marginTop: 24 }}>
        <h3 style={{ marginTop: 0 }}>ثبت خرید از تأمین‌کننده</h3>
        <form onSubmit={handleRecordPurchase}>
          <div className="form-row">
            <div>
              <label htmlFor="pur-supplier">تأمین‌کننده</label>
              <select id="pur-supplier" value={purchaseSupplierId} onChange={(e) => setPurchaseSupplierId(e.target.value)} required>
                <option value="">— انتخاب کنید —</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="pur-desc">شرح کالا</label>
              <input id="pur-desc" value={itemDescription} onChange={(e) => setItemDescription(e.target.value)} required />
            </div>
            <div>
              <label htmlFor="pur-amount">مبلغ</label>
              <CurrencyInput id="pur-amount" value={amount} onChange={setAmount} />
            </div>
            <div>
              <label htmlFor="pur-paid">وضعیت پرداخت</label>
              <select id="pur-paid" value={paid ? "paid" : "unpaid"} onChange={(e) => setPaid(e.target.value === "paid")}>
                <option value="unpaid">نسیه (به بدهی اضافه شود)</option>
                <option value="paid">نقدی پرداخت شد</option>
              </select>
            </div>
            {paid ? (
              <div>
                <label htmlFor="pur-method">روش پرداخت</label>
                <select id="pur-method" value={purchaseMethod} onChange={(e) => setPurchaseMethod(e.target.value as PaymentMethod)}>
                  {PAYMENT_METHODS.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>
            ) : null}
          </div>
          <button type="submit" className="btn-primary">
            ثبت خرید
          </button>
        </form>

        {purchases.length > 0 ? (
          <table className="data-table" style={{ marginTop: 16 }}>
            <thead>
              <tr>
                <th>تاریخ</th>
                <th>تأمین‌کننده</th>
                <th>شرح</th>
                <th>مبلغ</th>
                <th>وضعیت</th>
                <th>روش پرداخت</th>
              </tr>
            </thead>
            <tbody>
              {purchases.map((p) => (
                <tr key={p.id}>
                  <td>{formatDateForDisplay(p.date)}</td>
                  <td>{suppliers.find((s) => s.id === p.supplierId)?.name ?? "—"}</td>
                  <td>{p.itemDescription}</td>
                  <td>{p.amount.toLocaleString("fa-IR")}</td>
                  <td>{p.paid ? "پرداخت‌شده" : "نسیه"}</td>
                  <td>{p.paid ? p.paymentMethod : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : null}
      </div>

      <div className="card" style={{ marginTop: 24 }}>
        <h3 style={{ marginTop: 0 }}>تسویهٔ بدهی</h3>
        <form onSubmit={handleSettle}>
          <div className="form-row">
            <div>
              <label htmlFor="settle-supplier">تأمین‌کننده</label>
              <select id="settle-supplier" value={settleSupplierId} onChange={(e) => setSettleSupplierId(e.target.value)} required>
                <option value="">— انتخاب کنید —</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="settle-amount">مبلغ تسویه‌شده</label>
              <CurrencyInput id="settle-amount" value={settleAmount} onChange={setSettleAmount} />
            </div>
            <div>
              <label htmlFor="settle-method">روش پرداخت</label>
              <select id="settle-method" value={settleMethod} onChange={(e) => setSettleMethod(e.target.value as PaymentMethod)}>
                {PAYMENT_METHODS.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <button type="submit" className="btn-primary">
            ثبت تسویه
          </button>
        </form>
      </div>

      <div className="card" style={{ marginTop: 24 }}>
        <h3 style={{ marginTop: 0 }}>ثبت تأمین‌کنندهٔ جدید</h3>
        <form onSubmit={handleCreateSupplier}>
          <div className="form-row">
            <div>
              <label htmlFor="sup-name">نام</label>
              <input id="sup-name" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div>
              <label htmlFor="sup-phone">تلفن</label>
              <input
                id="sup-phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 11))}
                inputMode="numeric"
                maxLength={11}
              />
            </div>
            <div>
              <label htmlFor="sup-address">آدرس</label>
              <input id="sup-address" value={address} onChange={(e) => setAddress(e.target.value)} />
            </div>
            <div>
              <label htmlFor="sup-contract">یادداشت قرارداد</label>
              <input id="sup-contract" value={contractNotes} onChange={(e) => setContractNotes(e.target.value)} />
            </div>
          </div>
          <button type="submit" className="btn-primary">
            ثبت تأمین‌کننده
          </button>
        </form>
      </div>
    </div>
  );
}
