import { createStore } from "@/state/createStore";
import type { InventoryItem } from "@shared/types";
import { generateId } from "@/lib/id";
import { accountingActions } from "@/modules/accounting/useAccounting";

interface InventoryState {
  items: InventoryItem[];
}

const seedItems: InventoryItem[] = [
  {
    id: "itm-1",
    name: "گوشی موبایل سامسونگ A55",
    category: "موبایل",
    sku: "SM-A55-128",
    quantity: 6,
    purchasePrice: 18500000,
    salePrice: 21900000,
    lowStockThreshold: 3
  },
  {
    id: "itm-2",
    name: "قاب محافظ شفاف",
    category: "قاب",
    sku: "CASE-CLR-01",
    quantity: 2,
    purchasePrice: 85000,
    salePrice: 190000,
    lowStockThreshold: 5
  },
  {
    id: "itm-3",
    name: "پاوربانک 20000mAh",
    category: "پاوربانک",
    sku: "PB-20K",
    quantity: 14,
    purchasePrice: 620000,
    salePrice: 890000,
    lowStockThreshold: 4
  }
];

const inventoryStore = createStore<InventoryState>({ items: seedItems }, "data-inventory");

/**
 * Adds a brand-new item (new SKU) to inventory. When recordAsPurchase is
 * true (the default — matches the checkbox in the "افزودن کالای جدید" form,
 * pre-checked) and the item has a quantity and purchase price, this also
 * books a matching "خرید کالا" expense in accounting — one entry per new
 * item, same one-way trigger pattern as a sale or a supplier purchase.
 * Pass recordAsPurchase: false for cases that are not a real cash purchase
 * (e.g. importing an existing catalog, or a stock correction that happens
 * to go through this function).
 */
function addItem(item: Omit<InventoryItem, "id">, recordAsPurchase = true): void {
  inventoryStore.setState((prev) => ({
    items: [...prev.items, { ...item, id: generateId("itm") }]
  }));

  if (recordAsPurchase && item.quantity > 0 && item.purchasePrice > 0) {
    accountingActions.recordTransaction({
      type: "هزینه",
      account: "صندوق",
      category: "خرید کالا",
      amount: item.quantity * item.purchasePrice,
      description: `خرید کالای جدید: ${item.name} × ${item.quantity}`
    });
  }
}

function adjustQuantity(itemId: string, delta: number): void {
  inventoryStore.setState((prev) => ({
    items: prev.items.map((item) =>
      item.id === itemId
        ? { ...item, quantity: Math.max(0, item.quantity + delta) }
        : item
    )
  }));
}

function updateItem(itemId: string, updates: Partial<Omit<InventoryItem, "id">>): void {
  inventoryStore.setState((prev) => ({
    items: prev.items.map((item) => (item.id === itemId ? { ...item, ...updates } : item))
  }));
}

function deleteItem(itemId: string): void {
  inventoryStore.setState((prev) => ({
    items: prev.items.filter((item) => item.id !== itemId)
  }));
}

export function useInventory() {
  const state = inventoryStore.useStore();
  return { items: state.items, addItem, adjustQuantity, updateItem, deleteItem };
}

// Exposed for direct, non-hook access (e.g. from other module hooks like Sales).
export const inventoryActions = {
  addItem,
  adjustQuantity,
  updateItem,
  deleteItem,
  getState: inventoryStore.getState
};
