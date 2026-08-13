import { useState, type FormEvent } from "react";
import { CENTRAL_WAREHOUSE_ID, useWarehouse } from "./useWarehouse";
import { useSortableRows } from "@/components/useSortableRows";
import { SortableTh } from "@/components/SortableTh";
import type { PaymentMethod, StockReservation } from "@shared/types";
import { formatDateForDisplay } from "@/lib/jalali";
import { CurrencyInput } from "@/components/CurrencyInput";
import { navigationActions } from "@/state/navigationStore";
import { printRequestActions } from "@/state/printRequestStore";

const PAYMENT_METHODS: PaymentMethod[] = ["نقد", "کارت‌خوان (پوز)", "انتقال وجه"];

export function WarehouseModule(): JSX.Element {
  const {
    warehouses,
    transfers,
    stocktakes,
    reservations,
    defective,
    returns,
    inventoryItems,
    suppliers,
    getStockQuantity,
    createWarehouse,
    transferStock,
    recordStocktake,
    createReservation,
    updateReservation,
    deleteReservation,
    updateReservationStatus,
    recordDefective,
    recordReturn,
    receivePurchase
  } = useWarehouse();

  const [editingReservationId, setEditingReservationId] = useState<string | null>(null);
  const [editCustomerName, setEditCustomerName] = useState("");
  const [editQuantity, setEditQuantity] = useState("1");

  function startEditReservation(r: StockReservation): void {
    setEditingReservationId(r.id);
    setEditCustomerName(r.customerName);
    setEditQuantity(String(r.quantity));
  }

  function saveEditReservation(): void {
    if (!editingReservationId) return;
    updateReservation(editingReservationId, {
      customerName: editCustomerName.trim(),
      quantity: Number(editQuantity) || 1
    });
    setEditingReservationId(null);
  }

  function handleDeleteReservation(id: string): void {
    if (!window.confirm("این رزرو برای همیشه حذف شود؟")) return;
    if (editingReservationId === id) setEditingReservationId(null);
    deleteReservation(id);
  }

  function handlePrintReservation(id: string): void {
    printRequestActions.requestReservationPrint(id);
    navigationActions.goTo("printing");
  }

  const [warehouseName, setWarehouseName] = useState("");
  const [warehouseAddress, setWarehouseAddress] = useState("");

  const [viewWarehouseId, setViewWarehouseId] = useState(CENTRAL_WAREHOUSE_ID);

  const [purchaseWarehouseId, setPurchaseWarehouseId] = useState(CENTRAL_WAREHOUSE_ID);
  const [purchaseItemId, setPurchaseItemId] = useState("");
  const [purchaseSupplierId, setPurchaseSupplierId] = useState("");
  const [purchaseQty, setPurchaseQty] = useState("1");
  const [purchaseUnitPrice, setPurchaseUnitPrice] = useState(0);
  const [purchasePaid, setPurchasePaid] = useState(true);
  const [purchaseMethod, setPurchaseMethod] = useState<PaymentMethod>("نقد");
  const [purchaseError, setPurchaseError] = useState<string | null>(null);
  const [purchaseSuccess, setPurchaseSuccess] = useState<string | null>(null);

  function handleReceivePurchase(event: FormEvent): void {
    event.preventDefault();
    setPurchaseError(null);
    setPurchaseSuccess(null);
    if (!purchaseItemId || !purchaseSupplierId) return;
    const result = receivePurchase({
      warehouseId: purchaseWarehouseId,
      itemId: purchaseItemId,
      quantity: Number(purchaseQty) || 0,
      supplierId: purchaseSupplierId,
      unitPrice: purchaseUnitPrice,
      paid: purchasePaid,
      paymentMethod: purchaseMethod
    });
    if (!result.ok) {
      setPurchaseError(result.error ?? "خطا در ثبت خرید");
      return;
    }
    setPurchaseSuccess("خرید با موفقیت ثبت شد و به موجودی انبار اضافه شد.");
    setPurchaseQty("1");
    setPurchaseUnitPrice(0);
  }

  const selectedPurchaseSupplierName = suppliers.find((s) => s.id === purchaseSupplierId)?.name ?? "";

  const [transferItemId, setTransferItemId] = useState("");
  const [fromWarehouseId, setFromWarehouseId] = useState(CENTRAL_WAREHOUSE_ID);
  const [toWarehouseId, setToWarehouseId] = useState("");
  const [transferQty, setTransferQty] = useState("1");
  const [transferError, setTransferError] = useState<string | null>(null);

  const [stocktakeWarehouseId, setStocktakeWarehouseId] = useState(CENTRAL_WAREHOUSE_ID);
  const [stocktakeItemId, setStocktakeItemId] = useState("");
  const [countedQty, setCountedQty] = useState("0");
  const [stocktakeNote, setStocktakeNote] = useState("");

  const [reserveItemId, setReserveItemId] = useState("");
  const [reserveWarehouseId, setReserveWarehouseId] = useState(CENTRAL_WAREHOUSE_ID);
  const [reserveCustomer, setReserveCustomer] = useState("");
  const [reserveQty, setReserveQty] = useState("1");

  const [defectiveItemId, setDefectiveItemId] = useState("");
  const [defectiveWarehouseId, setDefectiveWarehouseId] = useState(CENTRAL_WAREHOUSE_ID);
  const [defectiveQty, setDefectiveQty] = useState("1");
  const [defectiveReason, setDefectiveReason] = useState("");

  const [returnItemId, setReturnItemId] = useState("");
  const [returnQty, setReturnQty] = useState("1");
  const [returnReason, setReturnReason] = useState("");
  const [returnRefunded, setReturnRefunded] = useState(true);

  const { sorted: sortedReservations, sortKey, direction, toggleSort } = useSortableRows<StockReservation>(
    reservations,
    "createdAt",
    "desc"
  );

  function itemName(itemId: string): string {
    return inventoryItems.find((i) => i.id === itemId)?.name ?? "—";
  }
  function warehouseName_(warehouseId: string): string {
    return warehouses.find((w) => w.id === warehouseId)?.name ?? "—";
  }

  function handleCreateWarehouse(event: FormEvent): void {
    event.preventDefault();
    if (!warehouseName.trim()) return;
    createWarehouse(warehouseName.trim(), warehouseAddress.trim());
    setWarehouseName("");
    setWarehouseAddress("");
  }

  function handleTransfer(event: FormEvent): void {
    event.preventDefault();
    setTransferError(null);
    if (!transferItemId || !toWarehouseId) return;
    const result = transferStock({
      itemId: transferItemId,
      fromWarehouseId,
      toWarehouseId,
      quantity: Number(transferQty) || 0
    });
    if (!result.ok) setTransferError(result.error ?? "خطای نامشخص");
    else setTransferQty("1");
  }

  function handleStocktake(event: FormEvent): void {
    event.preventDefault();
    if (!stocktakeItemId) return;
    recordStocktake({
      warehouseId: stocktakeWarehouseId,
      itemId: stocktakeItemId,
      countedQuantity: Number(countedQty) || 0,
      note: stocktakeNote.trim()
    });
    setStocktakeNote("");
  }

  function handleReserve(event: FormEvent): void {
    event.preventDefault();
    if (!reserveItemId || !reserveCustomer.trim()) return;
    createReservation({
      itemId: reserveItemId,
      warehouseId: reserveWarehouseId,
      customerName: reserveCustomer.trim(),
      quantity: Number(reserveQty) || 0
    });
    setReserveCustomer("");
    setReserveQty("1");
  }

  function handleDefective(event: FormEvent): void {
    event.preventDefault();
    if (!defectiveItemId || !defectiveReason.trim()) return;
    recordDefective({
      itemId: defectiveItemId,
      warehouseId: defectiveWarehouseId,
      quantity: Number(defectiveQty) || 0,
      reason: defectiveReason.trim()
    });
    setDefectiveReason("");
  }

  function handleReturn(event: FormEvent): void {
    event.preventDefault();
    if (!returnItemId || !returnReason.trim()) return;
    recordReturn({
      itemId: returnItemId,
      quantity: Number(returnQty) || 0,
      reason: returnReason.trim(),
      refunded: returnRefunded
    });
    setReturnReason("");
  }

  return (
    <div>
      <div className="card">
        <h3 style={{ marginTop: 0 }}>انبارها</h3>
        <form onSubmit={handleCreateWarehouse}>
          <div className="form-row">
            <div>
              <label htmlFor="wh-name">نام انبار جدید</label>
              <input id="wh-name" value={warehouseName} onChange={(e) => setWarehouseName(e.target.value)} />
            </div>
            <div>
              <label htmlFor="wh-address">آدرس</label>
              <input id="wh-address" value={warehouseAddress} onChange={(e) => setWarehouseAddress(e.target.value)} />
            </div>
          </div>
          <button type="submit" className="btn-primary">
            افزودن انبار
          </button>
        </form>

        <div className="form-row" style={{ marginTop: 16 }}>
          <div>
            <label htmlFor="wh-view">مشاهدهٔ موجودی انبار</label>
            <select id="wh-view" value={viewWarehouseId} onChange={(e) => setViewWarehouseId(e.target.value)}>
              {warehouses.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        <table className="data-table" style={{ marginTop: 8 }}>
          <thead>
            <tr>
              <th>کالا</th>
              <th>موجودی در این انبار</th>
            </tr>
          </thead>
          <tbody>
            {inventoryItems.map((item) => (
              <tr key={item.id}>
                <td>{item.name}</td>
                <td>{getStockQuantity(viewWarehouseId, item.id)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="card" style={{ marginTop: 24 }}>
        <h3 style={{ marginTop: 0 }}>ثبت خرید</h3>
        <form onSubmit={handleReceivePurchase}>
          <div className="form-row">
            <div>
              <label htmlFor="pur-warehouse">انبار مقصد</label>
              <select id="pur-warehouse" value={purchaseWarehouseId} onChange={(e) => setPurchaseWarehouseId(e.target.value)}>
                {warehouses.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="pur-item">کالا</label>
              <select id="pur-item" value={purchaseItemId} onChange={(e) => setPurchaseItemId(e.target.value)}>
                <option value="">— انتخاب کنید —</option>
                {inventoryItems.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="pur-supplier">تأمین‌کننده</label>
              <select id="pur-supplier" value={purchaseSupplierId} onChange={(e) => setPurchaseSupplierId(e.target.value)}>
                <option value="">— انتخاب کنید —</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="pur-from">خرید از</label>
              <input id="pur-from" value={selectedPurchaseSupplierName} disabled placeholder="با انتخاب تأمین‌کننده تکمیل می‌شود" />
            </div>
          </div>
          <div className="form-row">
            <div>
              <label htmlFor="pur-qty">تعداد</label>
              <input id="pur-qty" type="number" min={1} value={purchaseQty} onChange={(e) => setPurchaseQty(e.target.value)} />
            </div>
            <div>
              <label htmlFor="pur-price">قیمت واحد (تومان)</label>
              <CurrencyInput id="pur-price" value={purchaseUnitPrice} onChange={setPurchaseUnitPrice} />
            </div>
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
            <div style={{ display: "flex", alignItems: "flex-end" }}>
              <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <input type="checkbox" checked={purchasePaid} onChange={(e) => setPurchasePaid(e.target.checked)} />
                پرداخت شد (در غیر این صورت نسیه ثبت می‌شود)
              </label>
            </div>
          </div>
          {purchaseError ? <p style={{ color: "var(--sv-danger)" }}>{purchaseError}</p> : null}
          {purchaseSuccess ? <p style={{ color: "var(--sv-success)" }}>{purchaseSuccess}</p> : null}
          <button type="submit" className="btn-primary">
            ثبت خرید و افزایش موجودی
          </button>
        </form>
      </div>

      <div className="card" style={{ marginTop: 24 }}>
        <h3 style={{ marginTop: 0 }}>انتقال بین انبارها</h3>
        <form onSubmit={handleTransfer}>
          <div className="form-row">
            <div>
              <label htmlFor="trf-item">کالا</label>
              <select id="trf-item" value={transferItemId} onChange={(e) => setTransferItemId(e.target.value)} required>
                <option value="">— انتخاب کنید —</option>
                {inventoryItems.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="trf-from">از انبار</label>
              <select id="trf-from" value={fromWarehouseId} onChange={(e) => setFromWarehouseId(e.target.value)}>
                {warehouses.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="trf-to">به انبار</label>
              <select id="trf-to" value={toWarehouseId} onChange={(e) => setToWarehouseId(e.target.value)} required>
                <option value="">— انتخاب کنید —</option>
                {warehouses.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="trf-qty">تعداد</label>
              <input id="trf-qty" type="number" min={1} value={transferQty} onChange={(e) => setTransferQty(e.target.value)} />
            </div>
          </div>
          {transferError ? <p style={{ color: "var(--sv-warning)" }}>{transferError}</p> : null}
          <button type="submit" className="btn-primary">
            انتقال
          </button>
        </form>

        {transfers.length > 0 ? (
          <table className="data-table" style={{ marginTop: 16 }}>
            <thead>
              <tr>
                <th>تاریخ</th>
                <th>کالا</th>
                <th>از</th>
                <th>به</th>
                <th>تعداد</th>
              </tr>
            </thead>
            <tbody>
              {transfers.map((t) => (
                <tr key={t.id}>
                  <td>{formatDateForDisplay(t.date)}</td>
                  <td>{itemName(t.itemId)}</td>
                  <td>{warehouseName_(t.fromWarehouseId)}</td>
                  <td>{warehouseName_(t.toWarehouseId)}</td>
                  <td>{t.quantity}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : null}
      </div>

      <div className="card" style={{ marginTop: 24 }}>
        <h3 style={{ marginTop: 0 }}>انبارگردانی</h3>
        <form onSubmit={handleStocktake}>
          <div className="form-row">
            <div>
              <label htmlFor="stk-wh">انبار</label>
              <select id="stk-wh" value={stocktakeWarehouseId} onChange={(e) => setStocktakeWarehouseId(e.target.value)}>
                {warehouses.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="stk-item">کالا</label>
              <select id="stk-item" value={stocktakeItemId} onChange={(e) => setStocktakeItemId(e.target.value)} required>
                <option value="">— انتخاب کنید —</option>
                {inventoryItems.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="stk-count">تعداد شمارش‌شده</label>
              <input id="stk-count" type="number" min={0} value={countedQty} onChange={(e) => setCountedQty(e.target.value)} />
            </div>
            <div>
              <label htmlFor="stk-note">یادداشت</label>
              <input id="stk-note" value={stocktakeNote} onChange={(e) => setStocktakeNote(e.target.value)} />
            </div>
          </div>
          <button type="submit" className="btn-primary">
            ثبت انبارگردانی
          </button>
        </form>

        {stocktakes.length > 0 ? (
          <table className="data-table" style={{ marginTop: 16 }}>
            <thead>
              <tr>
                <th>تاریخ</th>
                <th>انبار</th>
                <th>کالا</th>
                <th>سیستم</th>
                <th>شمارش‌شده</th>
                <th>اختلاف</th>
              </tr>
            </thead>
            <tbody>
              {stocktakes.map((s) => (
                <tr key={s.id}>
                  <td>{formatDateForDisplay(s.date)}</td>
                  <td>{warehouseName_(s.warehouseId)}</td>
                  <td>{itemName(s.itemId)}</td>
                  <td>{s.systemQuantity}</td>
                  <td>{s.countedQuantity}</td>
                  <td className={s.difference !== 0 ? "data-table__low-stock" : undefined}>{s.difference}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : null}
      </div>

      <div className="card" style={{ marginTop: 24 }}>
        <h3 style={{ marginTop: 0 }}>رزرو کالا</h3>
        <form onSubmit={handleReserve}>
          <div className="form-row">
            <div>
              <label htmlFor="rsv-item">کالا</label>
              <select id="rsv-item" value={reserveItemId} onChange={(e) => setReserveItemId(e.target.value)} required>
                <option value="">— انتخاب کنید —</option>
                {inventoryItems.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="rsv-wh">انبار</label>
              <select id="rsv-wh" value={reserveWarehouseId} onChange={(e) => setReserveWarehouseId(e.target.value)}>
                {warehouses.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="rsv-customer">نام مشتری</label>
              <input id="rsv-customer" value={reserveCustomer} onChange={(e) => setReserveCustomer(e.target.value)} required />
            </div>
            <div>
              <label htmlFor="rsv-qty">تعداد</label>
              <input id="rsv-qty" type="number" min={1} value={reserveQty} onChange={(e) => setReserveQty(e.target.value)} />
            </div>
          </div>
          <button type="submit" className="btn-primary">
            ثبت رزرو
          </button>
        </form>

        {reservations.length > 0 ? (
          <table className="data-table" style={{ marginTop: 16 }}>
            <thead>
              <tr>
                <SortableTh label="مشتری" sortKeyName="customerName" activeKey={sortKey} direction={direction} onSort={toggleSort} />
                <SortableTh label="کالا" sortKeyName="itemId" activeKey={sortKey} direction={direction} onSort={toggleSort} />
                <SortableTh label="تعداد" sortKeyName="quantity" activeKey={sortKey} direction={direction} onSort={toggleSort} />
                <SortableTh label="تاریخ ثبت" sortKeyName="createdAt" activeKey={sortKey} direction={direction} onSort={toggleSort} />
                <th>وضعیت</th>
                <th>عملیات</th>
              </tr>
            </thead>
            <tbody>
              {sortedReservations.map((r) =>
                editingReservationId === r.id ? (
                  <tr key={r.id}>
                    <td>
                      <input value={editCustomerName} onChange={(e) => setEditCustomerName(e.target.value)} />
                    </td>
                    <td>{itemName(r.itemId)}</td>
                    <td>
                      <input
                        type="number"
                        min={1}
                        style={{ width: 70 }}
                        value={editQuantity}
                        onChange={(e) => setEditQuantity(e.target.value)}
                      />
                    </td>
                    <td>{formatDateForDisplay(r.createdAt)}</td>
                    <td>{r.status}</td>
                    <td style={{ display: "flex", gap: 6 }}>
                      <button type="button" className="btn-primary" onClick={saveEditReservation}>
                        ذخیره
                      </button>
                      <button type="button" className="btn-secondary" onClick={() => setEditingReservationId(null)}>
                        انصراف
                      </button>
                    </td>
                  </tr>
                ) : (
                  <tr key={r.id}>
                    <td>{r.customerName}</td>
                    <td>{itemName(r.itemId)}</td>
                    <td>{r.quantity}</td>
                    <td>{formatDateForDisplay(r.createdAt)}</td>
                    <td>
                      <select value={r.status} onChange={(e) => updateReservationStatus(r.id, e.target.value as StockReservation["status"])}>
                        <option value="رزرو شده">رزرو شده</option>
                        <option value="تحویل شده">تحویل شده</option>
                        <option value="لغو شده">لغو شده</option>
                      </select>
                    </td>
                    <td style={{ display: "flex", gap: 6 }}>
                      <button type="button" className="btn-secondary" onClick={() => startEditReservation(r)}>
                        ویرایش
                      </button>
                      <button type="button" className="btn-secondary" onClick={() => handlePrintReservation(r.id)}>
                        چاپ
                      </button>
                      <button type="button" className="btn-secondary" onClick={() => handleDeleteReservation(r.id)}>
                        حذف
                      </button>
                    </td>
                  </tr>
                )
              )}
            </tbody>
          </table>
        ) : null}
      </div>

      <div className="card" style={{ marginTop: 24 }}>
        <h3 style={{ marginTop: 0 }}>کالای معیوب</h3>
        <form onSubmit={handleDefective}>
          <div className="form-row">
            <div>
              <label htmlFor="def-item">کالا</label>
              <select id="def-item" value={defectiveItemId} onChange={(e) => setDefectiveItemId(e.target.value)} required>
                <option value="">— انتخاب کنید —</option>
                {inventoryItems.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="def-wh">انبار</label>
              <select id="def-wh" value={defectiveWarehouseId} onChange={(e) => setDefectiveWarehouseId(e.target.value)}>
                {warehouses.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="def-qty">تعداد</label>
              <input id="def-qty" type="number" min={1} value={defectiveQty} onChange={(e) => setDefectiveQty(e.target.value)} />
            </div>
            <div>
              <label htmlFor="def-reason">دلیل</label>
              <input id="def-reason" value={defectiveReason} onChange={(e) => setDefectiveReason(e.target.value)} required />
            </div>
          </div>
          <button type="submit" className="btn-primary">
            ثبت کالای معیوب
          </button>
        </form>

        {defective.length > 0 ? (
          <table className="data-table" style={{ marginTop: 16 }}>
            <thead>
              <tr>
                <th>تاریخ</th>
                <th>کالا</th>
                <th>انبار</th>
                <th>تعداد</th>
                <th>دلیل</th>
              </tr>
            </thead>
            <tbody>
              {defective.map((d) => (
                <tr key={d.id}>
                  <td>{formatDateForDisplay(d.date)}</td>
                  <td>{itemName(d.itemId)}</td>
                  <td>{warehouseName_(d.warehouseId)}</td>
                  <td>{d.quantity}</td>
                  <td>{d.reason}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : null}
      </div>

      <div className="card" style={{ marginTop: 24 }}>
        <h3 style={{ marginTop: 0 }}>مرجوعی</h3>
        <form onSubmit={handleReturn}>
          <div className="form-row">
            <div>
              <label htmlFor="ret-item">کالا</label>
              <select id="ret-item" value={returnItemId} onChange={(e) => setReturnItemId(e.target.value)} required>
                <option value="">— انتخاب کنید —</option>
                {inventoryItems.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="ret-qty">تعداد</label>
              <input id="ret-qty" type="number" min={1} value={returnQty} onChange={(e) => setReturnQty(e.target.value)} />
            </div>
            <div>
              <label htmlFor="ret-reason">دلیل مرجوعی</label>
              <input id="ret-reason" value={returnReason} onChange={(e) => setReturnReason(e.target.value)} required />
            </div>
            <div>
              <label htmlFor="ret-refund">وضعیت</label>
              <select id="ret-refund" value={returnRefunded ? "yes" : "no"} onChange={(e) => setReturnRefunded(e.target.value === "yes")}>
                <option value="yes">مبلغ بازگردانده شد</option>
                <option value="no">فقط تعویض کالا</option>
              </select>
            </div>
          </div>
          <button type="submit" className="btn-primary">
            ثبت مرجوعی
          </button>
        </form>

        {returns.length > 0 ? (
          <table className="data-table" style={{ marginTop: 16 }}>
            <thead>
              <tr>
                <th>تاریخ</th>
                <th>کالا</th>
                <th>تعداد</th>
                <th>دلیل</th>
                <th>بازگشت وجه</th>
              </tr>
            </thead>
            <tbody>
              {returns.map((r) => (
                <tr key={r.id}>
                  <td>{formatDateForDisplay(r.date)}</td>
                  <td>{itemName(r.itemId)}</td>
                  <td>{r.quantity}</td>
                  <td>{r.reason}</td>
                  <td>{r.refunded ? "بله" : "خیر"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : null}
      </div>
    </div>
  );
}
