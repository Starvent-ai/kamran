import { createStore } from "@/state/createStore";
import type { AccountingCategory, CashTransaction, CheckRecord, PaymentMethod } from "@shared/types";
import { generateId } from "@/lib/id";

interface AccountingState {
  transactions: CashTransaction[];
  checks: CheckRecord[];
}

const accountingStore = createStore<AccountingState>({ transactions: [], checks: [] }, "data-accounting");

interface NewTransactionInput {
  type: "درآمد" | "هزینه";
  account: "صندوق" | "بانک";
  category: AccountingCategory;
  amount: number;
  description: string;
  /** Defaults to "نقد" for the internal/automatic chains (e.g. a repair's
   *  labor fee booked on delivery) that don't have a real payment-method
   *  selection moment — pass it explicitly wherever the shopkeeper is
   *  actually choosing how the money moved (sale, manual entry, etc). */
  paymentMethod?: PaymentMethod;
}

function recordTransaction(input: NewTransactionInput): void {
  const transaction: CashTransaction = {
    ...input,
    paymentMethod: input.paymentMethod ?? "نقد",
    id: generateId("txn"),
    date: new Date().toISOString().slice(0, 10),
    createdAt: new Date().toISOString(),
    voided: false
  };
  accountingStore.setState((prev) => ({ ...prev, transactions: [...prev.transactions, transaction] }));
}

/**
 * The ONLY way to reverse a transaction — there is deliberately no
 * deleteTransaction function anywhere in the app. Voiding keeps the
 * record (and its audit trail) but excludes it from balances/summary,
 * so mistakes can be corrected without ever losing financial history.
 */
function voidTransaction(transactionId: string): void {
  accountingStore.setState((prev) => ({
    ...prev,
    transactions: prev.transactions.map((t) => (t.id === transactionId ? { ...t, voided: true } : t))
  }));
}

interface NewCheckInput {
  direction: "دریافتنی" | "پرداختنی";
  payerOrPayee: string;
  amount: number;
  dueDate: string;
}

function recordCheck(input: NewCheckInput): void {
  const check: CheckRecord = {
    ...input,
    id: generateId("chk"),
    status: "در جریان",
    createdAt: new Date().toISOString()
  };
  accountingStore.setState((prev) => ({ ...prev, checks: [...prev.checks, check] }));
}

function updateCheckStatus(checkId: string, status: CheckRecord["status"]): void {
  accountingStore.setState((prev) => ({
    ...prev,
    checks: prev.checks.map((c) => (c.id === checkId ? { ...c, status } : c))
  }));
}

export interface AccountingSummary {
  cashBalance: number;
  bankBalance: number;
  totalIncome: number;
  totalExpense: number;
  netProfit: number;
}

function computeSummary(transactions: CashTransaction[]): AccountingSummary {
  let cashBalance = 0;
  let bankBalance = 0;
  let totalIncome = 0;
  let totalExpense = 0;

  for (const t of transactions) {
    if (t.voided) continue;
    const signed = t.type === "درآمد" ? t.amount : -t.amount;
    if (t.account === "صندوق") cashBalance += signed;
    else bankBalance += signed;

    if (t.type === "درآمد") totalIncome += t.amount;
    else totalExpense += t.amount;
  }

  return { cashBalance, bankBalance, totalIncome, totalExpense, netProfit: totalIncome - totalExpense };
}

export function useAccounting() {
  const state = accountingStore.useStore();
  return {
    transactions: state.transactions,
    checks: state.checks,
    summary: computeSummary(state.transactions),
    recordTransaction,
    voidTransaction,
    recordCheck,
    updateCheckStatus
  };
}

export const accountingActions = {
  recordTransaction,
  voidTransaction,
  recordCheck,
  updateCheckStatus,
  getState: accountingStore.getState
};
