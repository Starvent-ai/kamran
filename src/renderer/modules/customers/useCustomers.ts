import { createStore } from "@/state/createStore";
import type { Customer } from "@shared/types";
import { smsEventQueueActions } from "@/modules/notifications/useSmsEventQueue";
import { generateId } from "@/lib/id";

interface CustomersState {
  customers: Customer[];
}

const seedCustomers: Customer[] = [
  { id: "cus-1", fullName: "محمد رضایی", phone: "0912xxxxxxx", loyaltyTier: "طلایی", totalPurchases: 4 },
  { id: "cus-2", fullName: "سارا احمدی", phone: "0935xxxxxxx", loyaltyTier: "نقره‌ای", totalPurchases: 2 },
  { id: "cus-3", fullName: "علی کریمی", phone: "0917xxxxxxx", loyaltyTier: "عادی", totalPurchases: 1 }
];

const customersStore = createStore<CustomersState>({ customers: seedCustomers }, "data-customers");

function addCustomer(customer: Omit<Customer, "id" | "totalPurchases">): void {
  customersStore.setState((prev) => ({
    customers: [
      ...prev.customers,
      { ...customer, id: generateId("cus"), totalPurchases: 0 }
    ]
  }));

  smsEventQueueActions.queueEvent({
    eventLabel: "مشتری جدید ثبت شد",
    phone: customer.phone,
    customerName: customer.fullName || "مشتری",
    category: "خوشامدگویی"
  });
}

function incrementPurchases(customerId: string): void {
  customersStore.setState((prev) => ({
    customers: prev.customers.map((c) =>
      c.id === customerId ? { ...c, totalPurchases: c.totalPurchases + 1 } : c
    )
  }));
}

function updateCustomer(customerId: string, updates: Partial<Omit<Customer, "id">>): void {
  customersStore.setState((prev) => ({
    customers: prev.customers.map((c) => (c.id === customerId ? { ...c, ...updates } : c))
  }));
}

function deleteCustomer(customerId: string): void {
  customersStore.setState((prev) => ({
    customers: prev.customers.filter((c) => c.id !== customerId)
  }));
}

export function useCustomers() {
  const state = customersStore.useStore();
  return { customers: state.customers, addCustomer, updateCustomer, deleteCustomer };
}

export const customerActions = {
  addCustomer,
  incrementPurchases,
  updateCustomer,
  deleteCustomer,
  getState: customersStore.getState
};
