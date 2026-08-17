import { useEffect, useState, type FormEvent } from "react";
import { useInventory } from "@/modules/inventory/useInventory";
import { useCustomers } from "@/modules/customers/useCustomers";
import { useSales } from "./useSales";
import { useSortableRows } from "@/components/useSortableRows";
import { SortableTh } from "@/components/SortableTh";
import { formatDateForDisplay } from "@/lib/jalali";
import type { PaymentMethod, SaleChannel, SaleRecord } from "@shared/types";
import { loadStoreProfile } from "@/lib/storeProfile";
import { printRequestActions } from "@/state/printRequestStore";
import { navigationActions } from "@/state/navigationStore";

const SALE_CHANNELS: SaleChannel[] = ["حضوری", "اینستاگرام", "تلگرام", "واتساپ"];
const PAYMENT_METHODS: PaymentMethod[] = ["نقد", "کارت‌خوان (پوز)", "انتقال وجه"];

export function Sales(): JSX.Element {
  const { items } = useInventory();
  const { customers } = useCustomers();
  const { sales, recordSale } = useSales();
  const { sorted, sortKey, direction, toggleSort } = useSortableRows<SaleRecord>(sales, "createdAt", "desc");

  const [itemId, setItemId] = useState(items[0]?.id ?? "");
  const [customerId, setCustomerId] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [channel, setChannel] = useState<SaleChannel>("حضوری");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("نقد");
  const [channelFilter, setChannelFilter] = useState<SaleChannel | "همه">("همه");
  const [feedback, setFeedback] = useState<{ type: "error" | "success"; text: string } | null>(null);
  const [autoPrint, setAutoPrint] = useState(false);

  useEffect(() => {
    let cancelled = false;
    loadStoreProfile().then((profile) => {
      if (!cancelled) setAutoPrint(profile.autoPrintAfterSale);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  function handleSubmit(event: FormEvent): void {
    event.preventDefault();
    const result = recordSale({
      itemId,
      customerId: customerId || null,
      quantity: Number(quantity) || 0,
      channel,
      paymentMethod
    });

    if (result.ok) {
      setFeedback({ type: "success", text: "فروش با موفقیت ثبت شد." });
      setQuantity("1");
      if (autoPrint) {
        printRequestActions.requestInvoicePrint(result.saleId);
        navigationActions.goTo("printing");
      }
    } else {
      setFeedback({ type: "error", text: result.error });
    }
  }

  function handlePrintSale(saleId: string): void {
    printRequestActions.requestInvoicePrint(saleId);
    navigationActions.goTo("printing");
  }

  return (
    <div>
      <div className="card">
        <h3 style={{ marginTop: 0 }}>ثبت فروش سریع</h3>
        {items.length === 0 ? (
          <p className="empty-state">ابتدا از بخش «مدیریت کالا» یک کالا ثبت کنید.</p>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <div>
                <label htmlFor="sale-item">کالا</label>
                <select id="sale-item" value={itemId} onChange={(e) => setItemId(e.target.value)}>
                  {items.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name} — موجودی: {item.quantity}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="sale-customer">مشتری (اختیاری)</label>
                <select id="sale-customer" value={customerId} onChange={(e) => setCustomerId(e.target.value)}>
                  <option value="">بدون ثبت مشتری</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.fullName}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="sale-qty">تعداد</label>
                <input
                  id="sale-qty"
                  type="number"
                  min={1}
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="sale-channel">نوع فروش</label>
                <select id="sale-channel" value={channel} onChange={(e) => setChannel(e.target.value as SaleChannel)}>
                  {SALE_CHANNELS.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="sale-method">روش پرداخت</label>
                <select id="sale-method" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}>
                  {PAYMENT_METHODS.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <button type="submit" className="btn-primary">
              ثبت فروش
            </button>
            {feedback ? (
              <p
                style={{
                  marginTop: 12,
                  color: feedback.type === "error" ? "var(--sv-danger)" : "var(--sv-success)"
                }}
              >
                {feedback.text}
              </p>
            ) : null}
          </form>
        )}
      </div>

      <div className="card" style={{ marginTop: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
          <h3 style={{ margin: 0 }}>تاریخچهٔ فروش</h3>
          {sales.length > 0 ? (
            <div>
              <label htmlFor="sale-channel-filter" style={{ marginLeft: 8 }}>
                فیلتر نوع فروش
              </label>
              <select
                id="sale-channel-filter"
                value={channelFilter}
                onChange={(e) => setChannelFilter(e.target.value as SaleChannel | "همه")}
              >
                <option value="همه">همه</option>
                {SALE_CHANNELS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          ) : null}
        </div>
        {sales.length === 0 ? (
          <p className="empty-state">هنوز فروشی ثبت نشده است.</p>
        ) : (
          <table className="data-table" style={{ marginTop: 12 }}>
            <thead>
              <tr>
                <SortableTh label="کالا" sortKeyName="itemName" activeKey={sortKey} direction={direction} onSort={toggleSort} />
                <SortableTh label="تعداد" sortKeyName="quantity" activeKey={sortKey} direction={direction} onSort={toggleSort} />
                <SortableTh label="قیمت واحد" sortKeyName="unitPrice" activeKey={sortKey} direction={direction} onSort={toggleSort} />
                <SortableTh label="مبلغ کل" sortKeyName="total" activeKey={sortKey} direction={direction} onSort={toggleSort} />
                <SortableTh label="نوع فروش" sortKeyName="channel" activeKey={sortKey} direction={direction} onSort={toggleSort} />
                <SortableTh label="روش پرداخت" sortKeyName="paymentMethod" activeKey={sortKey} direction={direction} onSort={toggleSort} />
                <SortableTh label="تاریخ" sortKeyName="createdAt" activeKey={sortKey} direction={direction} onSort={toggleSort} />
                <th>عملیات</th>
              </tr>
            </thead>
            <tbody>
              {sorted
                .filter((s) => channelFilter === "همه" || s.channel === channelFilter)
                .map((s) => (
                  <tr key={s.id}>
                    <td>{s.itemName}</td>
                    <td>{s.quantity}</td>
                    <td>{s.unitPrice.toLocaleString("fa-IR")} تومان</td>
                    <td>{s.total.toLocaleString("fa-IR")} تومان</td>
                    <td>{s.channel}</td>
                    <td>{s.paymentMethod}</td>
                    <td>{formatDateForDisplay(s.createdAt)}</td>
                    <td>
                      <button type="button" className="btn-secondary" onClick={() => handlePrintSale(s.id)}>
                        چاپ
                      </button>
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
