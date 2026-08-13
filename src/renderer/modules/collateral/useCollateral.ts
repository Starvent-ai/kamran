import { createStore } from "@/state/createStore";
import type { CollateralRecord, CollateralStatus, CollateralType } from "@shared/types";
import { generateId } from "@/lib/id";
import { accountingActions } from "@/modules/accounting/useAccounting";

interface CollateralState {
  records: CollateralRecord[];
}

const collateralStore = createStore<CollateralState>({ records: [] }, "data-collateral");

interface NewCollateralInput {
  type: CollateralType;
  relatedTo: string;
  description: string;
  guarantorName: string;
  buyerName: string;
  dueDate: string;
  amount: number;
}

function createCollateral(input: NewCollateralInput): void {
  const record: CollateralRecord = {
    ...input,
    id: generateId("col"),
    status: "معتبر",
    createdAt: new Date().toISOString()
  };
  collateralStore.setState((prev) => ({ records: [...prev.records, record] }));
}

function updateStatus(recordId: string, status: CollateralStatus): void {
  const previous = collateralStore.getState().records.find((r) => r.id === recordId);

  collateralStore.setState((prev) => ({
    records: prev.records.map((r) => (r.id === recordId ? { ...r, status } : r))
  }));

  // Seizing a collateral (چک/طلا/سفته/ضامن) means the shop is recovering an
  // unpaid debt through it — record it as income exactly once, at the moment
  // of seizure, guarded against double-counting on a repeat click, same
  // pattern used for repair delivery income.
  if (previous && previous.status !== "ضبط شده" && status === "ضبط شده" && previous.amount > 0) {
    accountingActions.recordTransaction({
      type: "درآمد",
      account: "صندوق",
      category: "سایر",
      amount: previous.amount,
      description: `ضبط ضمانت (${previous.type}) — ${previous.relatedTo || previous.description}`
    });
  }

  // The reverse case: a previously seized collateral is un-seized (e.g. the
  // seizure is corrected and the item is returned to the guarantor). The
  // earlier income entry stays in place (transactions are never edited), so
  // this books an offsetting expense — keeping the accounting picture correct
  // without ever deleting the original record.
  if (previous && previous.status === "ضبط شده" && status !== "ضبط شده" && previous.amount > 0) {
    accountingActions.recordTransaction({
      type: "هزینه",
      account: "صندوق",
      category: "سایر",
      amount: previous.amount,
      description: `برگشت از ضبط ضمانت (${previous.type}) — ${previous.relatedTo || previous.description}`
    });
  }
}

const NEAR_DUE_WINDOW_DAYS = 7;

/** True when a valid (not yet returned/seized) collateral's due date is
 *  today or within the next NEAR_DUE_WINDOW_DAYS days. */
function isNearDue(record: CollateralRecord): boolean {
  if (record.status !== "معتبر" || !record.dueDate) return false;
  const due = new Date(record.dueDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diffDays = Math.floor((due.getTime() - today.getTime()) / 86400000);
  return diffDays <= NEAR_DUE_WINDOW_DAYS;
}

export function useCollateral() {
  const state = collateralStore.useStore();
  return {
    records: state.records,
    createCollateral,
    updateStatus,
    isNearDue
  };
}

export const collateralActions = {
  createCollateral,
  updateStatus,
  isNearDue,
  getState: collateralStore.getState
};
