import { useEffect, useState, type CSSProperties } from "react";
import { useSales } from "@/modules/sales/useSales";
import { useCustomers } from "@/modules/customers/useCustomers";
import { useRepairs } from "@/modules/repairs/useRepairs";
import { useInstallments } from "@/modules/installments/useInstallments";
import { useWarehouse } from "@/modules/warehouse/useWarehouse";
import { DEFAULT_STORE_PROFILE, loadStoreProfile, type StoreProfile } from "@/lib/storeProfile";
import type { InstallmentContract, RepairTicket, SaleRecord, StockReservation } from "@shared/types";
import { formatDateForDisplay } from "@/lib/jalali";
import { usePendingSalePrint, usePendingReservationPrint, usePendingRepairPrint } from "@/state/printRequestStore";

type DocType = "invoice" | "repair-receipt" | "repair-delivery" | "installment" | "reservation";

export function Printing(): JSX.Element {
  const { sales } = useSales();
  const { customers } = useCustomers();
  const { tickets } = useRepairs();
  const { contracts, paidInstallmentCount } = useInstallments();
  const { reservations, inventoryItems, warehouses } = useWarehouse();

  const [storeProfile, setStoreProfile] = useState<StoreProfile>(DEFAULT_STORE_PROFILE);
  const [docType, setDocType] = useState<DocType>("invoice");
  const [selectedSaleId, setSelectedSaleId] = useState("");
  const [selectedTicketId, setSelectedTicketId] = useState("");
  const [selectedContractId, setSelectedContractId] = useState("");
  const [selectedReservationId, setSelectedReservationId] = useState("");
  const { pendingSaleId, clearPendingSaleId } = usePendingSalePrint();
  const { pendingReservationId, clearPendingReservationId } = usePendingReservationPrint();
  const { pendingRepairPrint, clearPendingRepairPrint } = usePendingRepairPrint();

  useEffect(() => {
    if (pendingSaleId) {
      setDocType("invoice");
      setSelectedSaleId(pendingSaleId);
      clearPendingSaleId();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingSaleId]);

  useEffect(() => {
    if (pendingRepairPrint) {
      setDocType(pendingRepairPrint.docType);
      setSelectedTicketId(pendingRepairPrint.ticketId);
      clearPendingRepairPrint();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingRepairPrint]);

  useEffect(() => {
    if (pendingReservationId) {
      setDocType("reservation");
      setSelectedReservationId(pendingReservationId);
      clearPendingReservationId();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingReservationId]);

  useEffect(() => {
    let cancelled = false;
    loadStoreProfile().then((profile) => {
      if (!cancelled) setStoreProfile(profile);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const selectedSale = sales.find((s) => s.id === selectedSaleId) ?? null;
  const selectedTicket = tickets.find((t) => t.id === selectedTicketId) ?? null;
  const selectedContract = contracts.find((c) => c.id === selectedContractId) ?? null;
  const selectedReservation = reservations.find((r) => r.id === selectedReservationId) ?? null;

  function handlePrint(): void {
    window.print();
  }

  return (
    <div>
      <div className="card no-print">
        <h3 style={{ marginTop: 0 }}>چاپ فاکتور و رسید تعمیر</h3>
        <p style={{ color: "var(--sv-text-600)", marginTop: 0 }}>
          سربرگ (نام فروشگاه، لوگو، آدرس، تلفن، اطلاعات مالیاتی) از «تنظیمات ← تنظیمات پایهٔ فروشگاه»
          خوانده می‌شود.
        </p>
        <div className="form-row">
          <div>
            <label htmlFor="doc-type">نوع سند</label>
            <select id="doc-type" value={docType} onChange={(e) => setDocType(e.target.value as DocType)}>
              <option value="invoice">فاکتور فروش</option>
              <option value="repair-receipt">رسید تعمیر</option>
              <option value="repair-delivery">رسید تحویلی (کار انجام‌شده و فاکتور)</option>
              <option value="installment">پروندهٔ فروش اقساطی</option>
              <option value="reservation">رسید رزرو کالا</option>
            </select>
          </div>
          {docType === "invoice" ? (
            <div>
              <label htmlFor="doc-sale">فاکتور</label>
              <select id="doc-sale" value={selectedSaleId} onChange={(e) => setSelectedSaleId(e.target.value)}>
                <option value="">— انتخاب کنید —</option>
                {sales.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.itemName} — {s.total.toLocaleString("fa-IR")} تومان ({formatDateForDisplay(s.createdAt)})
                  </option>
                ))}
              </select>
            </div>
          ) : docType === "repair-receipt" || docType === "repair-delivery" ? (
            <div>
              <label htmlFor="doc-ticket">تعمیر</label>
              <select id="doc-ticket" value={selectedTicketId} onChange={(e) => setSelectedTicketId(e.target.value)}>
                <option value="">— انتخاب کنید —</option>
                {tickets.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.deviceModel} — {t.customerName || "بدون نام"} ({t.status})
                  </option>
                ))}
              </select>
            </div>
          ) : docType === "installment" ? (
            <div>
              <label htmlFor="doc-contract">پروندهٔ اقساط</label>
              <select id="doc-contract" value={selectedContractId} onChange={(e) => setSelectedContractId(e.target.value)}>
                <option value="">— انتخاب کنید —</option>
                {contracts.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.customerName} — {c.itemDescription} ({c.status})
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div>
              <label htmlFor="doc-reservation">رزرو</label>
              <select id="doc-reservation" value={selectedReservationId} onChange={(e) => setSelectedReservationId(e.target.value)}>
                <option value="">— انتخاب کنید —</option>
                {reservations.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.customerName} — {inventoryItems.find((i) => i.id === r.itemId)?.name ?? "کالای حذف‌شده"} ({r.status})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
        <button
          type="button"
          className="btn-primary"
          onClick={handlePrint}
          disabled={
            docType === "invoice"
              ? !selectedSale
              : docType === "repair-receipt" || docType === "repair-delivery"
                ? !selectedTicket
                : docType === "installment"
                  ? !selectedContract
                  : !selectedReservation
          }
        >
          چاپ
        </button>
      </div>

      <div className="card print-area" style={{ marginTop: 24 }}>
        <PrintHeader profile={storeProfile} />
        {docType === "invoice" ? (
          selectedSale ? (
            <InvoiceBody
              sale={selectedSale}
              customerName={customers.find((c) => c.id === selectedSale.customerId)?.fullName ?? null}
            />
          ) : (
            <p className="empty-state">یک فاکتور برای پیش‌نمایش انتخاب کنید.</p>
          )
        ) : docType === "repair-receipt" ? (
          selectedTicket ? (
            <RepairReceiptBody ticket={selectedTicket} storeProfile={storeProfile} />
          ) : (
            <p className="empty-state">یک تعمیر برای پیش‌نمایش انتخاب کنید.</p>
          )
        ) : docType === "repair-delivery" ? (
          selectedTicket ? (
            <RepairDeliveryBody ticket={selectedTicket} />
          ) : (
            <p className="empty-state">یک تعمیر برای پیش‌نمایش انتخاب کنید.</p>
          )
        ) : docType === "installment" ? (
          selectedContract ? (
            <InstallmentContractBody
              contract={selectedContract}
              paidCount={paidInstallmentCount(selectedContract.id)}
              printFields={storeProfile.installmentPrintFields}
            />
          ) : (
            <p className="empty-state">یک پروندهٔ اقساط برای پیش‌نمایش انتخاب کنید.</p>
          )
        ) : selectedReservation ? (
          <ReservationReceiptBody
            reservation={selectedReservation}
            itemName={inventoryItems.find((i) => i.id === selectedReservation.itemId)?.name ?? "کالای حذف‌شده"}
            warehouseName={warehouses.find((w) => w.id === selectedReservation.warehouseId)?.name ?? "—"}
          />
        ) : (
          <p className="empty-state">یک رزرو برای پیش‌نمایش انتخاب کنید.</p>
        )}
      </div>
    </div>
  );
}

function PrintHeader({ profile }: { profile: StoreProfile }): JSX.Element {
  return (
    <div className="print-header">
      {profile.logoDataUrl ? <img src={profile.logoDataUrl} alt={profile.storeName} className="print-header__logo" /> : null}
      <div>
        <h2 style={{ margin: 0 }}>{profile.storeName || "نام فروشگاه ثبت نشده"}</h2>
        {profile.brand ? <p style={{ margin: 0, color: "var(--sv-text-600)" }}>{profile.brand}</p> : null}
        <p style={{ margin: 0, fontSize: 13, color: "var(--sv-text-600)" }}>
          {[profile.address, profile.phone, profile.taxId ? `شناسهٔ مالیاتی: ${profile.taxId}` : ""]
            .filter(Boolean)
            .join(" — ")}
        </p>
      </div>
    </div>
  );
}

function InvoiceBody({ sale, customerName }: { sale: SaleRecord; customerName: string | null }): JSX.Element {
  return (
    <div>
      <h3>فاکتور فروش</h3>
      <p>تاریخ: {formatDateForDisplay(sale.createdAt)}</p>
      {customerName ? <p>مشتری: {customerName}</p> : null}
      <table className="data-table">
        <thead>
          <tr>
            <th>کالا</th>
            <th>تعداد</th>
            <th>قیمت واحد</th>
            <th>جمع</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>{sale.itemName}</td>
            <td>{sale.quantity}</td>
            <td>{sale.unitPrice.toLocaleString("fa-IR")}</td>
            <td>{sale.total.toLocaleString("fa-IR")}</td>
          </tr>
        </tbody>
      </table>
      <p style={{ fontWeight: 700, marginTop: 12 }}>جمع کل: {sale.total.toLocaleString("fa-IR")} تومان</p>
    </div>
  );
}

function ReservationReceiptBody({
  reservation,
  itemName,
  warehouseName
}: {
  reservation: StockReservation;
  itemName: string;
  warehouseName: string;
}): JSX.Element {
  return (
    <div>
      <h3>رسید رزرو کالا</h3>
      <p>تاریخ ثبت: {formatDateForDisplay(reservation.createdAt)}</p>
      <table className="data-table">
        <tbody>
          <ReceiptRow label="مشتری" value={reservation.customerName} />
          <ReceiptRow label="کالا" value={itemName} />
          <ReceiptRow label="انبار" value={warehouseName} />
          <ReceiptRow label="تعداد" value={reservation.quantity} />
          <ReceiptRow label="وضعیت" value={reservation.status} />
        </tbody>
      </table>
    </div>
  );
}

function ReceiptRow({ label, value }: { label: string; value: string | number | null | undefined }): JSX.Element | null {
  if (value === null || value === undefined || value === "" || value === 0) return null;
  return (
    <tr>
      <td>{label}</td>
      <td>{value}</td>
    </tr>
  );
}

const REPAIR_RECEIPT_RULES = [
  "این واحد صنفی در قبال گوشی های غیر استاندارد (کپی-رفرش) ضربه خورده، سریال تعمیر شده، دستکاری شده، هیچگونه مسئولیتی ندارد.",
  "قبل از تحویل گوشی مموری، سیم کارت و لوازم جانبی و ... را خارج کنید.",
  "اعتبار این سند 30 روز می باشد و پس از 30 روز این واحد صنفی در صورت عدم حضور مالک هزینه ها و اجرت تعمیرات را از طریق غرامت قانونی جبران می نماید.",
  "این واحد صنفی در قبال گوشی هایی که روی آرم راه راه، چشمک زن، هارد ضربه، صفحه ی سفید به عنوان خاموش تحویل گرفته و هیچگونه مسئولیتی به حالت اولیه را ندارد.",
  "زمان تحویل، گوشی را کاملا تست نمایید در صورت هرگونه عیب و ایراد پس از تحویل، این واحد صنفی هیچگونه مسئولیتی نخواهد داشت و فقط معایبی که مشتری اظهار نموده مورد بررسی قرار میگیرد.",
  "ممکن است در هنگام تعمیر نیازی به بازگشت به حالت کارخانه باشد و اطلاعات داخل گوشی و مموری حذف شود این واحد صنفی در قبال اطلاعات حذف شده، قفل Apple id, frp ... هیچگونه مسئولیتی نخواهد داشت.",
  "گوشی های آب خورده به عنوان خاموش تحویل گرفته میشود حتی اگر روشن باشد.",
  "در صورت ضربه خوردگی آبخوردگی گوشی در هنگام باز شدن دستگاه، این واحد صنفی هیچگونه مسئولیتی در قبال اثر انگشت، شناسایی چهره و سنسور تماس، میکروفن نخواهد داشت."
];

/**
 * Matches the shop's own paper repair-receipt sample as closely as HTML/CSS
 * reasonably allows — same field order, same 8 numbered rules verbatim, same
 * acknowledgment clause, same blank pen-signature lines at the bottom.
 * Two deliberate departures from the sample, both necessary:
 *  - Store name/phone come from Settings (storeProfile) instead of being
 *    hardcoded, since this same receipt is used by any shop running the app.
 *  - Font is the app's existing Vazirmatn (already used everywhere else in
 *    Starvent) instead of the sample's Nazanin/Titr — those are commercial
 *    fonts this app can't legally bundle.
 */
/**
 * The invoice-style handover document: what work was done, which parts
 * were replaced, and the final amount — separate from RepairReceiptBody
 * (the liability/signature form), so either can be printed independently.
 */
function RepairDeliveryBody({ ticket }: { ticket: RepairTicket }): JSX.Element {
  return (
    <div>
      <h3>رسید تحویلی تعمیر</h3>
      <p>تاریخ چاپ: {formatDateForDisplay(new Date().toISOString())}</p>
      <table className="data-table">
        <tbody>
          <ReceiptRow label="مشتری" value={ticket.customerName} />
          <ReceiptRow label="دستگاه" value={ticket.deviceModel} />
          <ReceiptRow label="شمارهٔ سریال" value={ticket.serialNumber} />
          <ReceiptRow label="شرح خرابی" value={ticket.faultDescription} />
          <ReceiptRow label="قطعات تعویض‌شده" value={ticket.partsUsed || "—"} />
          <ReceiptRow label="تکنسین" value={ticket.technician} />
          <ReceiptRow label="تاریخ تحویل" value={formatDateForDisplay(ticket.deliveryDate)} />
          <ReceiptRow label="وضعیت" value={ticket.status} />
        </tbody>
      </table>
      <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 12 }}>
        <tbody>
          <tr>
            <td style={{ border: "1px solid #333", padding: "8px 10px", fontWeight: "bold" }}>مبلغ اجرت</td>
            <td style={{ border: "1px solid #333", padding: "8px 10px" }}>
              {ticket.laborFee > 0 ? `${ticket.laborFee.toLocaleString("fa-IR")} تومان` : "—"}
            </td>
          </tr>
          <tr>
            <td style={{ border: "1px solid #333", padding: "8px 10px", fontWeight: "bold" }}>بیعانهٔ دریافتی</td>
            <td style={{ border: "1px solid #333", padding: "8px 10px" }}>
              {ticket.depositAmount > 0 ? `${ticket.depositAmount.toLocaleString("fa-IR")} تومان` : "—"}
            </td>
          </tr>
          <tr>
            <td style={{ border: "1px solid #333", padding: "8px 10px", fontWeight: "bold" }}>مبلغ باقیمانده</td>
            <td style={{ border: "1px solid #333", padding: "8px 10px" }}>
              {Math.max(0, ticket.laborFee - ticket.depositAmount).toLocaleString("fa-IR")} تومان
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

function RepairReceiptBody({ ticket, storeProfile }: { ticket: RepairTicket; storeProfile: StoreProfile }): JSX.Element {
  const cellStyle: CSSProperties = { border: "1px solid #333", padding: "6px 10px", verticalAlign: "top" };

  return (
    <div style={{ fontSize: 13 }}>
      <h3 style={{ textAlign: "center", marginBottom: 4 }}>
        رسید تعمیرات {storeProfile.storeName || "فروشگاه"}
      </h3>
      {storeProfile.phone ? <p style={{ textAlign: "center", margin: "0 0 4px" }}>{storeProfile.phone}</p> : null}
      <p style={{ textAlign: "center", margin: "0 0 12px" }}>تاریخ: {formatDateForDisplay(new Date().toISOString())}</p>

      <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 12 }}>
        <tbody>
          <tr>
            <td style={cellStyle}>نام و نام خانوادگی: {ticket.customerName || "—"}</td>
            <td style={cellStyle}>مدل دستگاه: {ticket.deviceModel || "—"}</td>
          </tr>
          <tr>
            <td style={cellStyle}>سریال: {ticket.serialNumber || "—"}</td>
            <td style={cellStyle}>بیعانه: {ticket.depositAmount > 0 ? `${ticket.depositAmount.toLocaleString("fa-IR")} تومان` : "—"}</td>
          </tr>
          <tr>
            <td style={cellStyle}>تلفن همراه: {ticket.mobilePhone || "—"}</td>
            <td style={cellStyle}>تلفن ثابت: {ticket.landlinePhone || "—"}</td>
          </tr>
        </tbody>
      </table>

      <ol style={{ margin: 0, padding: 0, listStyle: "none" }}>
        {REPAIR_RECEIPT_RULES.map((rule, i) => (
          <li key={i} style={{ ...cellStyle, display: "flex", gap: 8, marginBottom: -1 }}>
            <span>{i + 1}.</span>
            <span>{rule}</span>
          </li>
        ))}
        <li style={{ ...cellStyle, marginBottom: -1 }}>
          9. اینجانب {ticket.customerName || "......................."} به کد ملی {ticket.nationalId || "......................."} کلیه موارد فوق را
          قبول دارم. با علم آبخوردگی، ضربه خوردگی، دستکاری شده، شرط خاموش، تغییر به حالت اولیه در حین تعمیر را میپذیرم.
        </li>
      </ol>

      <table style={{ width: "100%", borderCollapse: "collapse", marginTop: -1 }}>
        <tbody>
          <tr>
            <td style={{ ...cellStyle, height: 60, width: "50%" }}>امضاء مشتری:</td>
            <td style={{ ...cellStyle, height: 60, width: "50%" }}>امضاء فروشگاه:</td>
          </tr>
        </tbody>
      </table>
      <p style={{ color: "#666", fontSize: 11, marginTop: 6 }}>
        امضاها با خودکار و به‌صورت دستی توسط مشتری و فروشگاه انجام می‌شود.
      </p>
    </div>
  );
}

export interface ScheduleRow {
  installmentNumber: number;
  dueDate: Date;
  amount: number;
  paid: boolean;
}

export function buildInstallmentSchedule(contract: InstallmentContract, paidCount: number): ScheduleRow[] {
  const [startYear, startMonth, startDay] = contract.startDate.split("-").map(Number);

  return Array.from({ length: contract.installmentCount }, (_, index) => {
    const installmentNumber = index + 1;
    const dueDate = new Date(startYear, startMonth - 1 + installmentNumber, startDay);
    return {
      installmentNumber,
      dueDate,
      amount: contract.monthlyAmount,
      paid: installmentNumber <= paidCount
    };
  });
}

function InstallmentContractBody({
  contract,
  paidCount,
  printFields
}: {
  contract: InstallmentContract;
  paidCount: number;
  printFields: StoreProfile["installmentPrintFields"];
}): JSX.Element {
  const schedule = buildInstallmentSchedule(contract, paidCount);

  return (
    <div>
      <h3>پروندهٔ فروش اقساطی</h3>
      <p>تاریخ ثبت: {formatDateForDisplay(contract.createdAt)}</p>
      <table className="data-table">
        <tbody>
          <ReceiptRow label="مشتری" value={contract.customerName} />
          <ReceiptRow label="شرح کالا" value={contract.itemDescription} />
          <ReceiptRow label="مبلغ کل" value={`${contract.totalAmount.toLocaleString("fa-IR")} تومان`} />
          <ReceiptRow
            label="پیش‌پرداخت"
            value={contract.downPayment > 0 ? `${contract.downPayment.toLocaleString("fa-IR")} تومان` : null}
          />
          <ReceiptRow
            label="کارمزد/سود اقساطی"
            value={
              contract.feeAmount > 0
                ? `${contract.feeAmount.toLocaleString("fa-IR")} تومان (${contract.feePercent}%)`
                : null
            }
          />
          {printFields.installmentCount ? <ReceiptRow label="تعداد اقساط" value={contract.installmentCount} /> : null}
          {printFields.monthlyAmount ? (
            <ReceiptRow label="مبلغ هر قسط" value={`${contract.monthlyAmount.toLocaleString("fa-IR")} تومان`} />
          ) : null}
          {printFields.startDate ? <ReceiptRow label="تاریخ شروع" value={formatDateForDisplay(contract.startDate)} /> : null}
          {printFields.status ? <ReceiptRow label="وضعیت پرونده" value={contract.status} /> : null}
          {printFields.guaranteeNote ? <ReceiptRow label="یادداشت ضمانت" value={contract.guaranteeNote} /> : null}
        </tbody>
      </table>

      {printFields.scheduleTable ? (
        <>
          <h3 style={{ marginTop: 16 }}>جدول اقساط</h3>
          <table className="data-table">
            <thead>
              <tr>
                <th>قسط</th>
                <th>سررسید</th>
                <th>مبلغ</th>
                <th>وضعیت</th>
              </tr>
            </thead>
            <tbody>
              {schedule.map((row) => (
                <tr key={row.installmentNumber}>
                  <td>{row.installmentNumber}</td>
                  <td>{formatDateForDisplay(row.dueDate.toISOString())}</td>
                  <td>{row.amount.toLocaleString("fa-IR")} تومان</td>
                  <td>{row.paid ? "پرداخت‌شده" : "پرداخت‌نشده"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      ) : null}
    </div>
  );
}
