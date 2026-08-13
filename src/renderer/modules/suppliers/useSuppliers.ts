import { createStore } from "@/state/createStore";
import type { PaymentMethod, Supplier, SupplierPurchase } from "@shared/types";
import { accountingActions } from "@/modules/accounting/useAccounting";
import { generateId } from "@/lib/id";

interface SuppliersState {
  suppliers: Supplier[];
  purchases: SupplierPurchase[];
}

const seedSuppliers: Supplier[] = [
  {
    id: "sup-1",
    name: "پخش موبایل آریا",
    phone: "021xxxxxxx",
    address: "",
    contractNotes: "تسویه ماهانه",
    balance: 0,
    rating: 4,
    createdAt: new Date().toISOString()
  }
];

const suppliersStore = createStore<SuppliersState>({ suppliers: seedSuppliers, purchases: [] }, "data-suppliers");

interface NewSupplierInput {
  name: string;
  phone: string;
  address: string;
  contractNotes: string;
}

function createSupplier(input: NewSupplierInput): void {
  const supplier: Supplier = {
    ...input,
    id: generateId("sup"),
    balance: 0,
    rating: 0,
    createdAt: new Date().toISOString()
  };
  suppliersStore.setState((prev) => ({ ...prev, suppliers: [...prev.suppliers, supplier] }));
}

interface NewPurchaseInput {
  supplierId: string;
  itemDescription: string;
  amount: number;
  paid: boolean;
  /** How the purchase was paid, when paid=true. Defaults to نقد. */
  paymentMethod?: PaymentMethod;
}

function recordPurchase(input: NewPurchaseInput): void {
  const purchase: SupplierPurchase = {
    ...input,
    id: generateId("pur"),
    date: new Date().toISOString().slice(0, 10),
    paymentMethod: input.paymentMethod ?? "نقد"
  };
  suppliersStore.setState((prev) => ({
    ...prev,
    purchases: [...prev.purchases, purchase],
    suppliers: prev.suppliers.map((s) =>
      s.id === input.supplierId && !input.paid ? { ...s, balance: s.balance + input.amount } : s
    )
  }));

  // Only a cash purchase is an immediate expense. A credit (نسیه) purchase
  // becomes an expense when it's actually settled (see settleBalance) —
  // that's when cash actually leaves the shop.
  if (input.paid) {
    const supplierName = suppliersStore.getState().suppliers.find((s) => s.id === input.supplierId)?.name ?? "تأمین‌کننده";
    accountingActions.recordTransaction({
      type: "هزینه",
      account: "صندوق",
      category: "خرید کالا",
      paymentMethod: input.paymentMethod ?? "نقد",
      amount: input.amount,
      description: `خرید نقدی از ${supplierName}: ${input.itemDescription}`
    });
  }
}

function settleBalance(supplierId: string, amount: number, paymentMethod: PaymentMethod = "نقد"): void {
  suppliersStore.setState((prev) => ({
    ...prev,
    suppliers: prev.suppliers.map((s) =>
      s.id === supplierId ? { ...s, balance: s.balance - amount } : s
    )
  }));

  const supplierName = suppliersStore.getState().suppliers.find((s) => s.id === supplierId)?.name ?? "تأمین‌کننده";
  accountingActions.recordTransaction({
    type: "هزینه",
    account: "صندوق",
    category: "خرید کالا",
    paymentMethod,
    amount,
    description: `تسویهٔ بدهی به ${supplierName}`
  });
}

function setRating(supplierId: string, rating: number): void {
  suppliersStore.setState((prev) => ({
    ...prev,
    suppliers: prev.suppliers.map((s) => (s.id === supplierId ? { ...s, rating } : s))
  }));
}

export function useSuppliers() {
  const state = suppliersStore.useStore();
  return {
    suppliers: state.suppliers,
    purchases: state.purchases,
    createSupplier,
    recordPurchase,
    settleBalance,
    setRating
  };
}

export const supplierActions = {
  createSupplier,
  recordPurchase,
  settleBalance,
  setRating,
  getState: suppliersStore.getState
};
