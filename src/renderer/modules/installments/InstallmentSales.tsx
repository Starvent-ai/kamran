import { useEffect, useState, type FormEvent } from "react";
import { useInstallments } from "./useInstallments";
import { useSortableRows } from "@/components/useSortableRows";
import { SortableTh } from "@/components/SortableTh";
import type { InstallmentContract, InstallmentContractStatus, PaymentMethod } from "@shared/types";
import { CurrencyInput } from "@/components/CurrencyInput";
import { loadStoreProfile } from "@/lib/storeProfile";

const PAYMENT_METHODS: PaymentMethod[] = ["نقد", "کارت‌خوان (پوز)", "انتقال وجه"];

export function InstallmentSales(): JSX.Element {
  const { companies, contracts, createCompany, createContract, recordPayment, updateContractStatus, updateContractDetails, getContractBalance } =
    useInstallments();
  const { sorted, sortKey, direction, toggleSort } = useSortableRows<InstallmentContract>(
    contracts,
    "createdAt",
    "desc"
  );

  const [companyName, setCompanyName] = useState("");
  const [companyTerms, setCompanyTerms] = useState("");

  const [companyId, setCompanyId] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [itemDescription, setItemDescription] = useState("");
  const [totalAmount, setTotalAmount] = useState(0);
  const [downPayment, setDownPayment] = useState(0);
  const [installmentCount, setInstallmentCount] = useState("6");
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [guaranteeNote, setGuaranteeNote] = useState("");
  const [checkSerialNumber, setCheckSerialNumber] = useState("");
  const [registeredWithAcceptor, setRegisteredWithAcceptor] = useState(false);
  const [feePercent, setFeePercent] = useState(0);
  const [downPaymentMethod, setDownPaymentMethod] = useState<PaymentMethod>("نقد");

  useEffect(() => {
    let cancelled = false;
    loadStoreProfile().then((profile) => {
      if (!cancelled) setFeePercent(profile.installmentFeePercent);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const [selectedContractId, setSelectedContractId] = useState<string | null>(null);
  const [paymentAmount, setPaymentAmount] = useState("0");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("نقد");

  const [editingContractId, setEditingContractId] = useState<string | null>(null);
  const [editDescription, setEditDescription] = useState("");
  const [editCheckSerial, setEditCheckSerial] = useState("");
  const [editGuaranteeNote, setEditGuaranteeNote] = useState("");
  const [editRegistered, setEditRegistered] = useState(false);

  function handleCreateCompany(event: FormEvent): void {
    event.preventDefault();
    if (!companyName.trim()) return;
    createCompany(companyName.trim(), companyTerms.trim());
    setCompanyName("");
    setCompanyTerms("");
  }

  function handleCreateContract(event: FormEvent): void {
    event.preventDefault();
    if (!customerName.trim() || !itemDescription.trim()) return;
    createContract({
      companyId: companyId || null,
      customerName: customerName.trim(),
      itemDescription: itemDescription.trim(),
      totalAmount,
      downPayment,
      installmentCount: Number(installmentCount) || 1,
      startDate,
      guaranteeNote: guaranteeNote.trim(),
      checkSerialNumber: checkSerialNumber.trim(),
      registeredWithAcceptor,
      feePercent,
      downPaymentMethod
    });
    setCustomerName("");
    setItemDescription("");
    setTotalAmount(0);
    setDownPayment(0);
    setGuaranteeNote("");
    setCheckSerialNumber("");
    setRegisteredWithAcceptor(false);
  }

  function handleRecordPayment(event: FormEvent): void {
    event.preventDefault();
    if (!selectedContractId || Number(paymentAmount) <= 0) return;
    recordPayment(selectedContractId, Number(paymentAmount), paymentMethod);
    setPaymentAmount("0");
  }

  function startEditingContract(contract: InstallmentContract): void {
    setEditingContractId(contract.id);
    setEditDescription(contract.itemDescription);
    setEditCheckSerial(contract.checkSerialNumber);
    setEditGuaranteeNote(contract.guaranteeNote);
    setEditRegistered(contract.registeredWithAcceptor);
  }

  function handleSaveEdit(event: FormEvent): void {
    event.preventDefault();
    if (!editingContractId || !editDescription.trim()) return;
    updateContractDetails(editingContractId, {
      itemDescription: editDescription.trim(),
      checkSerialNumber: editCheckSerial.trim(),
      guaranteeNote: editGuaranteeNote.trim(),
      registeredWithAcceptor: editRegistered
    });
    setEditingContractId(null);
  }

  const selectedContract = contracts.find((c) => c.id === selectedContractId) ?? null;

  return (
    <div>
      <div className="card">
        <h3 style={{ marginTop: 0 }}>شرکت‌های طرف قرارداد اقساط</h3>
        <form onSubmit={handleCreateCompany}>
          <div className="form-row">
            <div>
              <label htmlFor="ic-name">نام شرکت</label>
              <input id="ic-name" value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
            </div>
            <div>
              <label htmlFor="ic-terms">شرایط قرارداد</label>
              <input id="ic-terms" value={companyTerms} onChange={(e) => setCompanyTerms(e.target.value)} />
            </div>
          </div>
          <button type="submit" className="btn-primary">
            افزودن شرکت
          </button>
        </form>
        {companies.length > 0 ? (
          <ul style={{ marginTop: 12, color: "var(--sv-text-400)" }}>
            {companies.map((c) => (
              <li key={c.id}>
                {c.name} — {c.terms || "بدون توضیح"}
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      <div className="card" style={{ marginTop: 24 }}>
        <h3 style={{ marginTop: 0 }}>ثبت پروندهٔ فروش اقساطی جدید</h3>
        <form onSubmit={handleCreateContract}>
          <div className="form-row">
            <div>
              <label htmlFor="con-company">شرکت طرف قرارداد</label>
              <select id="con-company" value={companyId} onChange={(e) => setCompanyId(e.target.value)}>
                <option value="">— بدون واسطه —</option>
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="con-customer">نام مشتری</label>
              <input id="con-customer" value={customerName} onChange={(e) => setCustomerName(e.target.value)} required />
            </div>
            <div>
              <label htmlFor="con-item">شرح کالا</label>
              <input id="con-item" value={itemDescription} onChange={(e) => setItemDescription(e.target.value)} required />
            </div>
            <div>
              <label htmlFor="con-start">تاریخ شروع</label>
              <input id="con-start" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
          </div>
          <div className="form-row">
            <div>
              <label htmlFor="con-total">مبلغ کل</label>
              <CurrencyInput id="con-total" value={totalAmount} onChange={setTotalAmount} />
            </div>
            <div>
              <label htmlFor="con-down">پیش‌پرداخت</label>
              <CurrencyInput id="con-down" value={downPayment} onChange={setDownPayment} />
            </div>
            <div>
              <label htmlFor="con-down-method">روش پرداخت پیش‌پرداخت</label>
              <select id="con-down-method" value={downPaymentMethod} onChange={(e) => setDownPaymentMethod(e.target.value as PaymentMethod)}>
                {PAYMENT_METHODS.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="con-count">تعداد اقساط</label>
              <input id="con-count" type="number" min={1} value={installmentCount} onChange={(e) => setInstallmentCount(e.target.value)} />
            </div>
            <div>
              <label htmlFor="con-fee">درصد کارمزد/سود (روی مبلغ باقیمانده)</label>
              <input
                id="con-fee"
                type="number"
                min={0}
                value={feePercent}
                onChange={(e) => setFeePercent(Number(e.target.value) || 0)}
              />
            </div>
            <div>
              <label htmlFor="con-guarantee">یادداشت ضمانت</label>
              <input id="con-guarantee" value={guaranteeNote} onChange={(e) => setGuaranteeNote(e.target.value)} placeholder="مثلاً: چک شمارهٔ ..." />
            </div>
            <div>
              <label htmlFor="con-check-serial">شمارهٔ سریال چک</label>
              <input id="con-check-serial" value={checkSerialNumber} onChange={(e) => setCheckSerialNumber(e.target.value)} />
            </div>
          </div>
          <div className="form-row" style={{ alignItems: "center" }}>
            <label htmlFor="con-registered" style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <input
                id="con-registered"
                type="checkbox"
                checked={registeredWithAcceptor}
                onChange={(e) => setRegisteredWithAcceptor(e.target.checked)}
              />
              پرونده در کارتابل پذیرنده ثبت شده است
            </label>
          </div>
          <button type="submit" className="btn-primary">
            ثبت پرونده
          </button>
        </form>
      </div>

      <div className="card" style={{ marginTop: 24 }}>
        <h3 style={{ marginTop: 0 }}>پرونده‌های اقساطی</h3>
        <table className="data-table">
          <thead>
            <tr>
              <SortableTh label="مشتری" sortKeyName="customerName" activeKey={sortKey} direction={direction} onSort={toggleSort} />
              <SortableTh label="کالا" sortKeyName="itemDescription" activeKey={sortKey} direction={direction} onSort={toggleSort} />
              <SortableTh label="قسط ماهانه" sortKeyName="monthlyAmount" activeKey={sortKey} direction={direction} onSort={toggleSort} />
              <SortableTh label="وضعیت" sortKeyName="status" activeKey={sortKey} direction={direction} onSort={toggleSort} />
              <th>مبلغ پرداخت‌شده</th>
              <th>مانده بدهی</th>
              <th>کارتابل پذیرنده</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((contract) => {
              const balance = getContractBalance(contract.id);
              return (
                <tr key={contract.id}>
                  <td>{contract.customerName}</td>
                  <td>{contract.itemDescription}</td>
                  <td>{Math.round(contract.monthlyAmount).toLocaleString("fa-IR")}</td>
                  <td>
                    <select
                      value={contract.status}
                      onChange={(e) => updateContractStatus(contract.id, e.target.value as InstallmentContractStatus)}
                    >
                      <option value="در جریان">در جریان</option>
                      <option value="معوق">معوق</option>
                      <option value="تسویه شده">تسویه شده</option>
                    </select>
                  </td>
                  <td>{balance.totalPaid.toLocaleString("fa-IR")} تومان</td>
                  <td>{balance.remaining.toLocaleString("fa-IR")} تومان</td>
                  <td>{contract.registeredWithAcceptor ? "بله" : "خیر"}</td>
                  <td style={{ display: "flex", gap: 6 }}>
                    <button type="button" className="btn-secondary" onClick={() => setSelectedContractId(contract.id)}>
                      ثبت قسط
                    </button>
                    <button type="button" className="btn-secondary" onClick={() => startEditingContract(contract)}>
                      ویرایش
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {editingContractId ? (
        <div className="card" style={{ marginTop: 24 }}>
          <h3 style={{ marginTop: 0 }}>ویرایش پروندهٔ اقساطی</h3>
          <form onSubmit={handleSaveEdit}>
            <div className="form-row">
              <div>
                <label htmlFor="edit-item">شرح کالا</label>
                <input id="edit-item" value={editDescription} onChange={(e) => setEditDescription(e.target.value)} required />
              </div>
              <div>
                <label htmlFor="edit-check-serial">شمارهٔ سریال چک</label>
                <input id="edit-check-serial" value={editCheckSerial} onChange={(e) => setEditCheckSerial(e.target.value)} />
              </div>
              <div>
                <label htmlFor="edit-guarantee">یادداشت ضمانت</label>
                <input id="edit-guarantee" value={editGuaranteeNote} onChange={(e) => setEditGuaranteeNote(e.target.value)} />
              </div>
            </div>
            <div className="form-row" style={{ alignItems: "center" }}>
              <label htmlFor="edit-registered" style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <input
                  id="edit-registered"
                  type="checkbox"
                  checked={editRegistered}
                  onChange={(e) => setEditRegistered(e.target.checked)}
                />
                پرونده در کارتابل پذیرنده ثبت شده است
              </label>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button type="submit" className="btn-primary">
                ذخیرهٔ تغییرات
              </button>
              <button type="button" className="btn-secondary" onClick={() => setEditingContractId(null)}>
                انصراف
              </button>
            </div>
          </form>
        </div>
      ) : null}

      {selectedContract ? (
        <div className="card" style={{ marginTop: 24 }}>
          <h3 style={{ marginTop: 0 }}>
            ثبت پرداخت قسط — {selectedContract.customerName}
          </h3>
          <form onSubmit={handleRecordPayment}>
            <div className="form-row">
              <div>
                <label htmlFor="pay-amount">مبلغ قسط (تومان)</label>
                <input
                  id="pay-amount"
                  type="number"
                  min={0}
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="pay-method">روش پرداخت</label>
                <select id="pay-method" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}>
                  {PAYMENT_METHODS.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <button type="submit" className="btn-primary">
              ثبت پرداخت
            </button>
          </form>
        </div>
      ) : null}
    </div>
  );
}
