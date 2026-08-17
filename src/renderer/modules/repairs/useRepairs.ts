import { createStore } from "@/state/createStore";
import type { RepairPriority, RepairStatus, RepairTicket } from "@shared/types";
import { customerActions } from "@/modules/customers/useCustomers";
import { accountingActions } from "@/modules/accounting/useAccounting";
import { smsEventQueueActions } from "@/modules/notifications/useSmsEventQueue";
import { generateId } from "@/lib/id";

interface RepairsState {
  tickets: RepairTicket[];
}

const seedTickets: RepairTicket[] = [
  {
    id: "rep-1",
    deviceModel: "آیفون 13",
    imei: "35xxxxxxxxxxxxx",
    serialNumber: "SN-A13-001",
    devicePassword: "الگو: ⌐‌⌐",
    faultDescription: "شکستگی صفحه نمایش",
    accessoriesReceived: "کابل شارژ",
    partsUsed: "",
    laborFee: 0,
    depositAmount: 0,
    mobilePhone: "",
    landlinePhone: "",
    nationalId: "",
    status: "در حال تعمیر",
    priority: "فوری",
    technician: "امیر",
    customerId: null,
    customerName: "محمد رضایی",
    deliveryDate: new Date(Date.now() + 2 * 86400000).toISOString().slice(0, 10),
    createdAt: new Date().toISOString()
  }
];

const repairsStore = createStore<RepairsState>({ tickets: seedTickets }, "data-repairs");

interface NewTicketInput {
  deviceModel: string;
  imei: string;
  serialNumber: string;
  devicePassword: string;
  faultDescription: string;
  accessoriesReceived: string;
  priority: RepairPriority;
  technician: string;
  customerId: string | null;
  customerName: string;
  deliveryDate: string;
  depositAmount: number;
  mobilePhone: string;
  landlinePhone: string;
  nationalId: string;
}

function createTicket(input: NewTicketInput): void {
  const ticket: RepairTicket = {
    ...input,
    id: generateId("rep"),
    partsUsed: "",
    laborFee: 0,
    status: "دریافت شده",
    createdAt: new Date().toISOString()
  };
  repairsStore.setState((prev) => ({ tickets: [...prev.tickets, ticket] }));
  if (input.customerId) {
    customerActions.incrementPurchases(input.customerId);
  }
}

function updateStatus(ticketId: string, status: RepairStatus): void {
  const previous = repairsStore.getState().tickets.find((t) => t.id === ticketId);

  repairsStore.setState((prev) => ({
    tickets: prev.tickets.map((t) => (t.id === ticketId ? { ...t, status } : t))
  }));

  // Queue the "device ready for pickup" SMS the instant it happens — not
  // when the shopkeeper next happens to open the notifications page.
  if (previous && previous.status !== "تکمیل شده" && status === "تکمیل شده") {
    const phone = previous.customerId
      ? customerActions.getState().customers.find((c) => c.id === previous.customerId)?.phone ?? ""
      : "";
    smsEventQueueActions.queueEvent({
      eventLabel: `تعمیر ${previous.deviceModel} آماده تحویل شد`,
      phone,
      customerName: previous.customerName || "مشتری",
      category: "دستگاه آماده"
    });
  }

  // Record the repair income exactly once, at the genuine moment of
  // delivery — not on every edit to parts/labor, and not if the ticket
  // was already delivered before (avoids double-counting on a repeat click).
  if (previous && previous.status !== "تحویل داده شده" && status === "تحویل داده شده" && previous.laborFee > 0) {
    accountingActions.recordTransaction({
      type: "درآمد",
      account: "صندوق",
      category: "سایر",
      amount: previous.laborFee,
      description: `اجرت تعمیر ${previous.deviceModel} — ${previous.customerName || "بدون نام"}`
    });
  }
}

function updatePartsAndLabor(ticketId: string, partsUsed: string, laborFee: number): void {
  repairsStore.setState((prev) => ({
    tickets: prev.tickets.map((t) => (t.id === ticketId ? { ...t, partsUsed, laborFee } : t))
  }));
}

export function useRepairs() {
  const state = repairsStore.useStore();
  return {
    tickets: state.tickets,
    createTicket,
    updateStatus,
    updatePartsAndLabor
  };
}

export const repairActions = {
  createTicket,
  updateStatus,
  updatePartsAndLabor,
  getState: repairsStore.getState
};
