import { useState, type FormEvent } from "react";
import { useRepairs } from "./useRepairs";
import { useCustomers } from "@/modules/customers/useCustomers";
import { useSortableRows } from "@/components/useSortableRows";
import { SortableTh } from "@/components/SortableTh";
import { SignaturePad } from "@/components/SignaturePad";
import { REPAIR_PRIORITIES, REPAIR_STATUSES, type RepairPriority, type RepairTicket } from "@shared/types";
import { formatDateForDisplay } from "@/lib/jalali";
import { CurrencyInput } from "@/components/CurrencyInput";

export function Repairs(): JSX.Element {
  const { tickets, createTicket, updateStatus, updatePartsAndLabor, setSignature } = useRepairs();
  const { customers } = useCustomers();
  const { sorted, sortKey, direction, toggleSort } = useSortableRows<RepairTicket>(tickets, "createdAt", "desc");

  const [deviceModel, setDeviceModel] = useState("");
  const [imei, setImei] = useState("");
  const [serialNumber, setSerialNumber] = useState("");
  const [devicePassword, setDevicePassword] = useState("");
  const [faultDescription, setFaultDescription] = useState("");
  const [accessoriesReceived, setAccessoriesReceived] = useState("");
  const [priority, setPriority] = useState<RepairPriority>("عادی");
  const [technician, setTechnician] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [mobilePhone, setMobilePhone] = useState("");
  const [landlinePhone, setLandlinePhone] = useState("");
  const [nationalId, setNationalId] = useState("");
  const [depositAmount, setDepositAmount] = useState(0);
  const [deliveryDate, setDeliveryDate] = useState(
    new Date(Date.now() + 2 * 86400000).toISOString().slice(0, 10)
  );

  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [partsDraft, setPartsDraft] = useState("");
  const [laborDraft, setLaborDraft] = useState(0);

  const selectedTicket = tickets.find((t) => t.id === selectedTicketId) ?? null;

  function handleCustomerPick(id: string): void {
    setCustomerId(id);
    const found = customers.find((c) => c.id === id);
    setCustomerName(found ? found.fullName : "");
    if (found?.phone) setMobilePhone(found.phone);
  }

  function handleSubmit(event: FormEvent): void {
    event.preventDefault();
    if (!deviceModel.trim() || !faultDescription.trim()) return;

    createTicket({
      deviceModel: deviceModel.trim(),
      imei: imei.trim(),
      serialNumber: serialNumber.trim(),
      devicePassword: devicePassword.trim(),
      faultDescription: faultDescription.trim(),
      accessoriesReceived: accessoriesReceived.trim(),
      priority,
      technician: technician.trim(),
      customerId: customerId || null,
      customerName: customerId ? customerName : customerName.trim(),
      deliveryDate,
      depositAmount,
      mobilePhone: mobilePhone.trim(),
      landlinePhone: landlinePhone.trim(),
      nationalId: nationalId.trim()
    });

    setDeviceModel("");
    setImei("");
    setSerialNumber("");
    setDevicePassword("");
    setFaultDescription("");
    setAccessoriesReceived("");
    setPriority("عادی");
    setTechnician("");
    setCustomerId("");
    setCustomerName("");
    setMobilePhone("");
    setLandlinePhone("");
    setNationalId("");
    setDepositAmount(0);
  }

  function openDetails(ticket: RepairTicket): void {
    setSelectedTicketId(ticket.id);
    setPartsDraft(ticket.partsUsed);
    setLaborDraft(ticket.laborFee);
  }

  function handleSavePartsAndLabor(): void {
    if (!selectedTicket) return;
    updatePartsAndLabor(selectedTicket.id, partsDraft.trim(), laborDraft);
  }

  return (
    <div>
      <div className="card">
        <h3 style={{ marginTop: 0 }}>ثبت دستگاه جدید برای تعمیر</h3>
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div>
              <label htmlFor="rep-device">مدل دستگاه</label>
              <input id="rep-device" value={deviceModel} onChange={(e) => setDeviceModel(e.target.value)} required />
            </div>
            <div>
              <label htmlFor="rep-imei">IMEI</label>
              <input id="rep-imei" value={imei} onChange={(e) => setImei(e.target.value)} />
            </div>
            <div>
              <label htmlFor="rep-serial">شماره سریال</label>
              <input id="rep-serial" value={serialNumber} onChange={(e) => setSerialNumber(e.target.value)} />
            </div>
            <div>
              <label htmlFor="rep-pass">رمز / الگوی قفل دستگاه</label>
              <input id="rep-pass" value={devicePassword} onChange={(e) => setDevicePassword(e.target.value)} />
            </div>
          </div>

          <div className="form-row">
            <div style={{ gridColumn: "1 / -1" }}>
              <label htmlFor="rep-fault">شرح خرابی</label>
              <input id="rep-fault" value={faultDescription} onChange={(e) => setFaultDescription(e.target.value)} required />
            </div>
          </div>

          <div className="form-row">
            <div>
              <label htmlFor="rep-accessories">لوازم تحویلی همراه دستگاه</label>
              <input id="rep-accessories" value={accessoriesReceived} onChange={(e) => setAccessoriesReceived(e.target.value)} />
            </div>
            <div>
              <label htmlFor="rep-priority">اولویت تعمیر</label>
              <select id="rep-priority" value={priority} onChange={(e) => setPriority(e.target.value as RepairPriority)}>
                {REPAIR_PRIORITIES.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="rep-tech">تکنسین مسئول</label>
              <input id="rep-tech" value={technician} onChange={(e) => setTechnician(e.target.value)} />
            </div>
            <div>
              <label htmlFor="rep-delivery">زمان تحویل تخمینی</label>
              <input id="rep-delivery" type="date" value={deliveryDate} onChange={(e) => setDeliveryDate(e.target.value)} />
            </div>
          </div>

          <div className="form-row">
            <div>
              <label htmlFor="rep-customer">مشتری (اختیاری، از لیست)</label>
              <select id="rep-customer" value={customerId} onChange={(e) => handleCustomerPick(e.target.value)}>
                <option value="">— انتخاب نشده —</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.fullName}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="rep-customer-name">یا نام مشتری به‌صورت آزاد</label>
              <input
                id="rep-customer-name"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                disabled={Boolean(customerId)}
              />
            </div>
          </div>

          <div className="form-row">
            <div>
              <label htmlFor="rep-mobile">تلفن همراه</label>
              <input
                id="rep-mobile"
                value={mobilePhone}
                maxLength={11}
                onChange={(e) => setMobilePhone(e.target.value.replace(/\D/g, "").slice(0, 11))}
              />
            </div>
            <div>
              <label htmlFor="rep-landline">تلفن ثابت</label>
              <input
                id="rep-landline"
                value={landlinePhone}
                maxLength={11}
                onChange={(e) => setLandlinePhone(e.target.value.replace(/\D/g, "").slice(0, 11))}
              />
            </div>
            <div>
              <label htmlFor="rep-national-id">کد ملی (برای رسید)</label>
              <input
                id="rep-national-id"
                value={nationalId}
                maxLength={10}
                onChange={(e) => setNationalId(e.target.value.replace(/\D/g, "").slice(0, 10))}
              />
            </div>
            <div>
              <label htmlFor="rep-deposit">بیعانه (تومان)</label>
              <CurrencyInput id="rep-deposit" value={depositAmount} onChange={setDepositAmount} />
            </div>
          </div>

          <button type="submit" className="btn-primary">
            ثبت دستگاه
          </button>
        </form>
      </div>

      <div className="card" style={{ marginTop: 24 }}>
        <h3 style={{ marginTop: 0 }}>لیست تعمیرات</h3>
        <table className="data-table">
          <thead>
            <tr>
              <SortableTh label="دستگاه" sortKeyName="deviceModel" activeKey={sortKey} direction={direction} onSort={toggleSort} />
              <SortableTh label="مشتری" sortKeyName="customerName" activeKey={sortKey} direction={direction} onSort={toggleSort} />
              <SortableTh label="اولویت" sortKeyName="priority" activeKey={sortKey} direction={direction} onSort={toggleSort} />
              <SortableTh label="وضعیت" sortKeyName="status" activeKey={sortKey} direction={direction} onSort={toggleSort} />
              <SortableTh label="تکنسین" sortKeyName="technician" activeKey={sortKey} direction={direction} onSort={toggleSort} />
              <SortableTh label="تحویل" sortKeyName="deliveryDate" activeKey={sortKey} direction={direction} onSort={toggleSort} />
              <th>جزئیات</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((ticket) => (
              <tr key={ticket.id}>
                <td>{ticket.deviceModel}</td>
                <td>{ticket.customerName || "—"}</td>
                <td className={ticket.priority === "بحرانی" ? "data-table__low-stock" : undefined}>{ticket.priority}</td>
                <td>
                  <select value={ticket.status} onChange={(e) => updateStatus(ticket.id, e.target.value as RepairTicket["status"])}>
                    {REPAIR_STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </td>
                <td>{ticket.technician || "—"}</td>
                <td>{formatDateForDisplay(ticket.deliveryDate)}</td>
                <td>
                  <button type="button" className="btn-secondary" onClick={() => openDetails(ticket)}>
                    مشاهده
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedTicket ? (
        <div className="card" style={{ marginTop: 24 }}>
          <h3 style={{ marginTop: 0 }}>
            جزئیات تعمیر — {selectedTicket.deviceModel}
          </h3>
          <p style={{ color: "var(--sv-text-400)" }}>شرح خرابی: {selectedTicket.faultDescription}</p>

          <div className="form-row">
            <div>
              <label htmlFor="rep-parts">قطعات مصرف‌شده</label>
              <input id="rep-parts" value={partsDraft} onChange={(e) => setPartsDraft(e.target.value)} />
            </div>
            <div>
              <label htmlFor="rep-labor">اجرت</label>
              <CurrencyInput id="rep-labor" value={laborDraft} onChange={setLaborDraft} />
            </div>
          </div>
          <button type="button" className="btn-primary" onClick={handleSavePartsAndLabor}>
            ذخیرهٔ قطعات و اجرت
          </button>

          <div style={{ marginTop: "var(--sv-space-6)" }}>
            <label>امضای مشتری (تحویل دستگاه)</label>
            <SignaturePad
              existingSignature={selectedTicket.customerSignature}
              onSave={(dataUrl) => setSignature(selectedTicket.id, dataUrl)}
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}
