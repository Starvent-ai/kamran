import { createStore } from "@/state/createStore";
import type {
  InstallmentCompany,
  InstallmentContract,
  InstallmentContractStatus,
  InstallmentPayment,
  PaymentMethod
} from "@shared/types";
import { generateId } from "@/lib/id";
import { accountingActions } from "@/modules/accounting/useAccounting";

interface InstallmentState {
  companies: InstallmentCompany[];
  contracts: InstallmentContract[];
  payments: InstallmentPayment[];
}

const seedCompanies: InstallmentCompany[] = [
  { id: "ic-1", name: "بدون واسطه (مستقیم فروشگاه)", terms: "بدون کارمزد، پیگیری توسط خود فروشگاه" }
];

const installmentStore = createStore<InstallmentState>(
  {
    companies: seedCompanies,
    contracts: [],
    payments: []
  },
  "data-installments"
);

function createCompany(name: string, terms: string): void {
  const company: InstallmentCompany = { id: generateId("ic"), name, terms };
  installmentStore.setState((prev) => ({ ...prev, companies: [...prev.companies, company] }));
}

interface NewContractInput {
  companyId: string | null;
  customerName: string;
  itemDescription: string;
  totalAmount: number;
  downPayment: number;
  installmentCount: number;
  startDate: string;
  guaranteeNote: string;
  checkSerialNumber: string;
  registeredWithAcceptor: boolean;
  /** Installment fee/interest percent to apply to the remaining balance
   *  (totalAmount - downPayment) before splitting it into installments.
   *  Defaults to 0 — no fee — for callers/tests that don't pass it. */
  feePercent?: number;
  /** How the down payment was collected. Defaults to نقد for callers/tests
   *  that don't pass it. */
  downPaymentMethod?: PaymentMethod;
}

function createContract(input: NewContractInput): void {
  const feePercent = input.feePercent ?? 0;
  const baseRemaining = Math.max(0, input.totalAmount - input.downPayment);
  const feeAmount = Math.round((baseRemaining * feePercent) / 100);
  const remaining = baseRemaining + feeAmount;
  const installmentCount = Math.max(1, input.installmentCount);
  const contract: InstallmentContract = {
    ...input,
    id: generateId("con"),
    installmentCount,
    monthlyAmount: remaining / installmentCount,
    feePercent,
    feeAmount,
    status: "در جریان",
    createdAt: new Date().toISOString()
  };
  installmentStore.setState((prev) => ({ ...prev, contracts: [...prev.contracts, contract] }));

  // The down payment is cash in hand the moment the contract is signed —
  // record it as income right away, same as any other sale proceeds.
  if (contract.downPayment > 0) {
    accountingActions.recordTransaction({
      type: "درآمد",
      account: "صندوق",
      category: "فروش",
      paymentMethod: input.downPaymentMethod ?? "نقد",
      amount: contract.downPayment,
      description: `پیش‌پرداخت فروش اقساطی «${contract.itemDescription}» — ${contract.customerName || "بدون نام"}`
    });
  }
}

/** Total the contract still owes after the down payment (fee already
 *  folded in) — the number a partial/arbitrary-amount payment schedule is
 *  actually being paid down against. */
function totalOwed(contract: InstallmentContract): number {
  return Math.round(contract.monthlyAmount * contract.installmentCount);
}

/** Sum of every payment recorded against a contract so far. */
function totalPaid(contractId: string): number {
  return installmentStore
    .getState()
    .payments.filter((p) => p.contractId === contractId)
    .reduce((sum, p) => sum + p.amount, 0);
}

/** مانده بدهی, مبلغ پرداخت‌شده و... — everything the UI needs to show the
 *  live state of a contract, computed from actual amounts paid rather than
 *  a fixed count of payments, so any mix of small/uneven payments is
 *  reflected correctly. */
function getContractBalance(contractId: string): { totalOwed: number; totalPaid: number; remaining: number } {
  const contract = installmentStore.getState().contracts.find((c) => c.id === contractId);
  if (!contract) return { totalOwed: 0, totalPaid: 0, remaining: 0 };
  const owed = totalOwed(contract);
  const paid = totalPaid(contractId);
  return { totalOwed: owed, totalPaid: paid, remaining: Math.max(0, owed - paid) };
}

function recordPayment(contractId: string, amount: number, paymentMethod: PaymentMethod = "نقد"): void {
  const state = installmentStore.getState();
  const contract = state.contracts.find((c) => c.id === contractId);
  if (!contract) return;

  const priorPaidCount = state.payments.filter((p) => p.contractId === contractId).length;
  const payment: InstallmentPayment = {
    id: generateId("pay"),
    contractId,
    installmentNumber: priorPaidCount + 1,
    amount,
    date: new Date().toISOString().slice(0, 10)
  };

  installmentStore.setState((prev) => {
    const nextPayments = [...prev.payments, payment];
    const paidSoFar = nextPayments.filter((p) => p.contractId === contractId).reduce((sum, p) => sum + p.amount, 0);
    // Settlement is decided by amount paid vs. what's owed — not by how
    // many separate payments were made, since payments can be any amount
    // at any time (a few large ones or many small ones both count).
    const isSettled = paidSoFar >= totalOwed(contract);
    return {
      ...prev,
      payments: nextPayments,
      contracts: prev.contracts.map((c) =>
        c.id === contractId && isSettled ? { ...c, status: "تسویه شده" } : c
      )
    };
  });

  // Each recorded installment payment is real cash received — one accounting
  // income entry per payment, exactly matching the button click that created it.
  if (amount > 0) {
    accountingActions.recordTransaction({
      type: "درآمد",
      account: "صندوق",
      category: "فروش",
      paymentMethod,
      amount,
      description: `قسط شمارهٔ ${payment.installmentNumber} — «${contract.itemDescription}» — ${contract.customerName || "بدون نام"}`
    });
  }
}

function updateContractStatus(contractId: string, status: InstallmentContractStatus): void {
  installmentStore.setState((prev) => ({
    ...prev,
    contracts: prev.contracts.map((c) => (c.id === contractId ? { ...c, status } : c))
  }));
}

/** Edits the free-text/administrative fields of a contract after creation —
 *  the financial fields (amounts, fee, schedule) are intentionally not
 *  editable here since changing them after payments exist would make the
 *  paid/remaining math ambiguous. */
function updateContractDetails(
  contractId: string,
  patch: Partial<Pick<InstallmentContract, "itemDescription" | "checkSerialNumber" | "guaranteeNote" | "registeredWithAcceptor">>
): void {
  installmentStore.setState((prev) => ({
    ...prev,
    contracts: prev.contracts.map((c) => (c.id === contractId ? { ...c, ...patch } : c))
  }));
}

function paidInstallmentCount(contractId: string): number {
  return installmentStore.getState().payments.filter((p) => p.contractId === contractId).length;
}

/**
 * Estimates the next unpaid installment's due date: startDate + one month
 * per installment already paid. Returns null once the contract is fully
 * settled/cancelled — there's nothing left to be "due".
 */
export function getNextDueDate(contract: InstallmentContract, paidCount: number): Date | null {
  if (contract.status !== "در جریان") return null;
  const [y, m, d] = contract.startDate.split("-").map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1 + paidCount + 1, d);
}

export function useInstallments() {
  const state = installmentStore.useStore();
  return {
    companies: state.companies,
    contracts: state.contracts,
    payments: state.payments,
    createCompany,
    createContract,
    recordPayment,
    updateContractStatus,
    updateContractDetails,
    paidInstallmentCount,
    getContractBalance
  };
}

export const installmentActions = {
  createCompany,
  createContract,
  recordPayment,
  updateContractStatus,
  updateContractDetails,
  paidInstallmentCount,
  getContractBalance,
  getState: installmentStore.getState
};
