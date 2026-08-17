import { useEffect, useState, type FormEvent } from "react";
import { useCustomers } from "./useCustomers";
import { useSortableRows } from "@/components/useSortableRows";
import { SortableTh } from "@/components/SortableTh";
import { JalaliDatePicker } from "@/components/JalaliDatePicker";
import { formatDateForDisplay, gregorianToJalali, jalaliToGregorian, JALALI_MONTH_NAMES } from "@/lib/jalali";
import { usePendingCustomerIntake } from "@/state/customerIntakeStore";
import type { Customer, LoyaltyTier } from "@shared/types";

const LOYALTY_TIERS: LoyaltyTier[] = ["عادی", "نقره‌ای", "طلایی", "ویژه"];

export function Customers(): JSX.Element {
  const { customers, addCustomer, updateCustomer, deleteCustomer } = useCustomers();
  const { sorted, sortKey, direction, toggleSort } = useSortableRows<Customer>(customers, "fullName");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [birthday, setBirthday] = useState("");

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editTier, setEditTier] = useState<LoyaltyTier>("عادی");
  const [editBirthday, setEditBirthday] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const { pendingPhone, clearPendingPhone } = usePendingCustomerIntake();
  useEffect(() => {
    if (pendingPhone) {
      setPhone(pendingPhone);
      clearPendingPhone();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingPhone]);

  function handleSubmit(event: FormEvent): void {
    event.preventDefault();
    if (!fullName.trim() && !phone.trim()) return;
    addCustomer({
      fullName: fullName.trim(),
      phone: phone.trim(),
      loyaltyTier: "عادی",
      birthday: birthday || undefined
    });
    setFullName("");
    setPhone("");
    setBirthday("");
  }

  function startEdit(customer: Customer): void {
    setEditingId(customer.id);
    setEditName(customer.fullName);
    setEditPhone(customer.phone);
    setEditTier(customer.loyaltyTier);
    setEditBirthday(customer.birthday ?? "");
    setConfirmDeleteId(null);
  }

  function cancelEdit(): void {
    setEditingId(null);
  }

  function saveEdit(customerId: string): void {
    if (!editName.trim() || !editPhone.trim()) return;
    updateCustomer(customerId, {
      fullName: editName.trim(),
      phone: editPhone.trim(),
      loyaltyTier: editTier,
      birthday: editBirthday || undefined
    });
    setEditingId(null);
  }

  function handleDeleteClick(customerId: string): void {
    if (confirmDeleteId === customerId) {
      deleteCustomer(customerId);
      setConfirmDeleteId(null);
    } else {
      setConfirmDeleteId(customerId);
    }
  }

  return (
    <div>
      <div className="card">
        <h3 style={{ marginTop: 0 }}>ثبت مشتری جدید</h3>
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div>
              <label htmlFor="cust-name">نام و نام خانوادگی</label>
              <input id="cust-name" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="اختیاری" />
            </div>
            <div>
              <label htmlFor="cust-phone">شماره تماس</label>
              <input
                id="cust-phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 11))}
                inputMode="numeric"
                maxLength={11}
                placeholder="اختیاری"
              />
            </div>
            <JalaliDatePicker
              yearInputId="cust-birthday-year"
              monthInputId="cust-birthday-month"
              dayInputId="cust-birthday-day"
              value={birthday}
              onChange={setBirthday}
              label="تولد"
            />
          </div>
          <button type="submit" className="btn-primary">
            ثبت مشتری
          </button>
        </form>
      </div>

      <div className="card" style={{ marginTop: 24 }}>
        <h3 style={{ marginTop: 0 }}>لیست مشتریان</h3>
        <table className="data-table">
          <thead>
            <tr>
              <SortableTh label="نام" sortKeyName="fullName" activeKey={sortKey} direction={direction} onSort={toggleSort} />
              <SortableTh label="شماره تماس" sortKeyName="phone" activeKey={sortKey} direction={direction} onSort={toggleSort} />
              <SortableTh label="سطح باشگاه مشتریان" sortKeyName="loyaltyTier" activeKey={sortKey} direction={direction} onSort={toggleSort} />
              <SortableTh label="تعداد خرید" sortKeyName="totalPurchases" activeKey={sortKey} direction={direction} onSort={toggleSort} />
              <th>تولد</th>
              <th>عملیات</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((c) => {
              const editYmd: [number, number, number] = editBirthday
                ? gregorianToJalali(...(editBirthday.split("-").map(Number) as [number, number, number]))
                : [1370, 1, 1];
              return editingId === c.id ? (
                <tr key={c.id}>
                  <td>
                    <input value={editName} onChange={(e) => setEditName(e.target.value)} />
                  </td>
                  <td>
                    <input
                      value={editPhone}
                      onChange={(e) => setEditPhone(e.target.value.replace(/\D/g, "").slice(0, 11))}
                      inputMode="numeric"
                      maxLength={11}
                    />
                  </td>
                  <td>
                    <select value={editTier} onChange={(e) => setEditTier(e.target.value as LoyaltyTier)}>
                      {LOYALTY_TIERS.map((tier) => (
                        <option key={tier} value={tier}>
                          {tier}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>{c.totalPurchases}</td>
                  <td>
                    <div style={{ display: "flex", gap: 4 }}>
                      <input
                        type="number"
                        min={1300}
                        max={1450}
                        style={{ width: 56 }}
                        value={editBirthday ? String(editYmd[0]) : ""}
                        onChange={(e) => {
                          if (!e.target.value) {
                            setEditBirthday("");
                            return;
                          }
                          const [gy, gm, gd] = jalaliToGregorian(Number(e.target.value), editYmd[1], editYmd[2]);
                          setEditBirthday(`${gy}-${String(gm).padStart(2, "0")}-${String(gd).padStart(2, "0")}`);
                        }}
                      />
                      <select
                        style={{ width: 90 }}
                        value={editBirthday ? String(editYmd[1]).padStart(2, "0") : ""}
                        onChange={(e) => {
                          if (!e.target.value) {
                            setEditBirthday("");
                            return;
                          }
                          const [gy, gm, gd] = jalaliToGregorian(editYmd[0], Number(e.target.value), editYmd[2]);
                          setEditBirthday(`${gy}-${String(gm).padStart(2, "0")}-${String(gd).padStart(2, "0")}`);
                        }}
                      >
                        <option value="">ماه</option>
                        {JALALI_MONTH_NAMES.map((name, index) => (
                          <option key={name} value={String(index + 1).padStart(2, "0")}>
                            {name}
                          </option>
                        ))}
                      </select>
                      <input
                        type="number"
                        min={1}
                        max={31}
                        style={{ width: 48 }}
                        value={editBirthday ? String(editYmd[2]) : ""}
                        onChange={(e) => {
                          if (!e.target.value) {
                            setEditBirthday("");
                            return;
                          }
                          const [gy, gm, gd] = jalaliToGregorian(editYmd[0], editYmd[1], Number(e.target.value));
                          setEditBirthday(`${gy}-${String(gm).padStart(2, "0")}-${String(gd).padStart(2, "0")}`);
                        }}
                      />
                    </div>
                  </td>
                  <td style={{ display: "flex", gap: 8 }}>
                    <button type="button" className="btn-primary" onClick={() => saveEdit(c.id)}>
                      ذخیره
                    </button>
                    <button type="button" className="btn-secondary" onClick={cancelEdit}>
                      انصراف
                    </button>
                  </td>
                </tr>
              ) : (
                <tr key={c.id}>
                  <td>{c.fullName || "بدون نام"}</td>
                  <td>{c.phone || "—"}</td>
                  <td>{c.loyaltyTier}</td>
                  <td>{c.totalPurchases}</td>
                  <td>{c.birthday ? formatDateForDisplay(c.birthday) : "—"}</td>
                  <td style={{ display: "flex", gap: 8 }}>
                    <button type="button" className="btn-secondary" onClick={() => startEdit(c)}>
                      ویرایش
                    </button>
                    <button
                      type="button"
                      className="btn-secondary"
                      style={confirmDeleteId === c.id ? { borderColor: "var(--sv-warning)", color: "var(--sv-warning)" } : undefined}
                      onClick={() => handleDeleteClick(c.id)}
                    >
                      {confirmDeleteId === c.id ? "مطمئن هستید؟ حذف" : "حذف"}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
