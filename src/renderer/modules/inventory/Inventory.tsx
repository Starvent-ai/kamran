import { useState, type FormEvent } from "react";
import { useInventory } from "./useInventory";
import { useSortableRows } from "@/components/useSortableRows";
import { SortableTh } from "@/components/SortableTh";
import { useMobilePriceList } from "@/state/useMobilePriceList";
import { CurrencyInput } from "@/components/CurrencyInput";
import type { InventoryItem } from "@shared/types";

const CATEGORIES = ["موبایل", "تبلت", "لوازم جانبی", "گجت", "تعمیراتی"];

interface EditableFields {
  name: string;
  category: string;
  sku: string;
  quantity: string;
  salePrice: string;
}

export function Inventory(): JSX.Element {
  const { items, addItem, updateItem, deleteItem } = useInventory();
  const { sorted, sortKey, direction, toggleSort } = useSortableRows<InventoryItem>(items, "name");
  const { items: livePrices } = useMobilePriceList();
  const [name, setName] = useState("");
  const [category, setCategory] = useState("موبایل");
  const [sku, setSku] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [purchasePrice, setPurchasePrice] = useState(0);
  const [salePrice, setSalePrice] = useState("");
  const [recordAsPurchase, setRecordAsPurchase] = useState(true);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editFields, setEditFields] = useState<EditableFields>({
    name: "",
    category: "موبایل",
    sku: "",
    quantity: "0",
    salePrice: "0"
  });
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  function handleNameChange(value: string): void {
    setName(value);
    const match = livePrices.find((p) => p.name === value);
    if (match) {
      setSalePrice(String(match.price));
    }
  }

  function handleSubmit(event: FormEvent): void {
    event.preventDefault();
    if (!name.trim() || !sku.trim()) return;

    addItem(
      {
        name: name.trim(),
        category,
        sku: sku.trim(),
        quantity: Number(quantity) || 0,
        purchasePrice,
        salePrice: Number(salePrice) || 0,
        lowStockThreshold: 3
      },
      recordAsPurchase
    );

    setName("");
    setSku("");
    setQuantity("1");
    setPurchasePrice(0);
    setSalePrice("");
    setRecordAsPurchase(true);
  }

  function startEdit(item: InventoryItem): void {
    setEditingId(item.id);
    setEditFields({
      name: item.name,
      category: item.category,
      sku: item.sku,
      quantity: String(item.quantity),
      salePrice: String(item.salePrice)
    });
    setConfirmDeleteId(null);
  }

  function cancelEdit(): void {
    setEditingId(null);
  }

  function saveEdit(itemId: string): void {
    if (!editFields.name.trim() || !editFields.sku.trim()) return;
    updateItem(itemId, {
      name: editFields.name.trim(),
      category: editFields.category,
      sku: editFields.sku.trim(),
      quantity: Number(editFields.quantity) || 0,
      salePrice: Number(editFields.salePrice) || 0
    });
    setEditingId(null);
  }

  function handleDeleteClick(itemId: string): void {
    if (confirmDeleteId === itemId) {
      deleteItem(itemId);
      setConfirmDeleteId(null);
    } else {
      setConfirmDeleteId(itemId);
    }
  }

  return (
    <div>
      <div className="card">
        <h3 style={{ marginTop: 0 }}>افزودن کالای جدید</h3>
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div>
              <label htmlFor="item-name">نام کالا</label>
              <input
                id="item-name"
                list="live-mobile-prices"
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                required
              />
              {livePrices.length > 0 ? (
                <datalist id="live-mobile-prices">
                  {livePrices.map((p, index) => (
                    <option key={`${p.name}-${index}`} value={p.name}>
                      {p.price.toLocaleString("fa-IR")} تومان
                    </option>
                  ))}
                </datalist>
              ) : null}
            </div>
            <div>
              <label htmlFor="item-category">دسته‌بندی</label>
              <select id="item-category" value={category} onChange={(e) => setCategory(e.target.value)}>
                {CATEGORIES.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="item-sku">کد کالا / SKU</label>
              <input id="item-sku" value={sku} onChange={(e) => setSku(e.target.value)} required />
            </div>
            <div>
              <label htmlFor="item-qty">موجودی اولیه</label>
              <input id="item-qty" type="number" min={0} value={quantity} onChange={(e) => setQuantity(e.target.value)} />
            </div>
            <div>
              <label htmlFor="item-purchase-price">قیمت خرید (تومان)</label>
              <CurrencyInput id="item-purchase-price" value={purchasePrice} onChange={setPurchasePrice} />
            </div>
            <div>
              <label htmlFor="item-price">قیمت فروش (تومان)</label>
              <CurrencyInput id="item-price" value={Number(salePrice) || 0} onChange={(v) => setSalePrice(String(v))} />
            </div>
          </div>
          <div className="form-row" style={{ alignItems: "center" }}>
            <label htmlFor="item-record-purchase" style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <input
                id="item-record-purchase"
                type="checkbox"
                checked={recordAsPurchase}
                onChange={(e) => setRecordAsPurchase(e.target.checked)}
              />
              ثبت به‌عنوان خرید واقعی (هزینه در حسابداری ثبت شود)
            </label>
          </div>
          <button type="submit" className="btn-primary">
            ثبت کالا
          </button>
        </form>
      </div>

      <div className="card" style={{ marginTop: 24 }}>
        <h3 style={{ marginTop: 0 }}>موجودی انبار</h3>
        <table className="data-table">
          <thead>
            <tr>
              <SortableTh label="نام کالا" sortKeyName="name" activeKey={sortKey} direction={direction} onSort={toggleSort} />
              <SortableTh label="دسته‌بندی" sortKeyName="category" activeKey={sortKey} direction={direction} onSort={toggleSort} />
              <SortableTh label="کد کالا" sortKeyName="sku" activeKey={sortKey} direction={direction} onSort={toggleSort} />
              <SortableTh label="موجودی" sortKeyName="quantity" activeKey={sortKey} direction={direction} onSort={toggleSort} />
              <SortableTh label="قیمت فروش" sortKeyName="salePrice" activeKey={sortKey} direction={direction} onSort={toggleSort} />
              <th>عملیات</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((item) =>
              editingId === item.id ? (
                <tr key={item.id}>
                  <td>
                    <input value={editFields.name} onChange={(e) => setEditFields((f) => ({ ...f, name: e.target.value }))} />
                  </td>
                  <td>
                    <select
                      value={editFields.category}
                      onChange={(e) => setEditFields((f) => ({ ...f, category: e.target.value }))}
                    >
                      {CATEGORIES.map((c) => (
                        <option key={c}>{c}</option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <input value={editFields.sku} onChange={(e) => setEditFields((f) => ({ ...f, sku: e.target.value }))} />
                  </td>
                  <td>
                    <input
                      type="number"
                      min={0}
                      value={editFields.quantity}
                      onChange={(e) => setEditFields((f) => ({ ...f, quantity: e.target.value }))}
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      min={0}
                      value={editFields.salePrice}
                      onChange={(e) => setEditFields((f) => ({ ...f, salePrice: e.target.value }))}
                    />
                  </td>
                  <td style={{ display: "flex", gap: 8 }}>
                    <button type="button" className="btn-primary" onClick={() => saveEdit(item.id)}>
                      ذخیره
                    </button>
                    <button type="button" className="btn-secondary" onClick={cancelEdit}>
                      انصراف
                    </button>
                  </td>
                </tr>
              ) : (
                <tr key={item.id}>
                  <td>{item.name}</td>
                  <td>{item.category}</td>
                  <td>{item.sku}</td>
                  <td className={item.quantity <= item.lowStockThreshold ? "data-table__low-stock" : undefined}>
                    {item.quantity}
                    {item.quantity <= item.lowStockThreshold ? " (کمبود موجودی)" : ""}
                  </td>
                  <td>{item.salePrice.toLocaleString("fa-IR")} تومان</td>
                  <td style={{ display: "flex", gap: 8 }}>
                    <button type="button" className="btn-secondary" onClick={() => startEdit(item)}>
                      ویرایش
                    </button>
                    <button
                      type="button"
                      className="btn-secondary"
                      style={confirmDeleteId === item.id ? { borderColor: "var(--sv-warning)", color: "var(--sv-warning)" } : undefined}
                      onClick={() => handleDeleteClick(item.id)}
                    >
                      {confirmDeleteId === item.id ? "مطمئن هستید؟ حذف" : "حذف"}
                    </button>
                  </td>
                </tr>
              )
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
