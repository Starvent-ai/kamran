import { createStore } from "@/state/createStore";

interface PrintRequestState {
  pendingSaleId: string | null;
  pendingReservationId: string | null;
}

const printRequestStore = createStore<PrintRequestState>({ pendingSaleId: null, pendingReservationId: null });

/** Called by Sales right before navigating to Printing, when auto-print-after-sale is on. */
function requestInvoicePrint(saleId: string): void {
  printRequestStore.setState((prev) => ({ ...prev, pendingSaleId: saleId }));
}

/** Called by Printing once it has consumed the pending request, so it doesn't re-trigger later. */
function clearPendingSaleId(): void {
  printRequestStore.setState((prev) => ({ ...prev, pendingSaleId: null }));
}

/** Called by Warehouse's «چاپ» button on a reservation row, before navigating to Printing. */
function requestReservationPrint(reservationId: string): void {
  printRequestStore.setState((prev) => ({ ...prev, pendingReservationId: reservationId }));
}

function clearPendingReservationId(): void {
  printRequestStore.setState((prev) => ({ ...prev, pendingReservationId: null }));
}

export function usePendingSalePrint() {
  const state = printRequestStore.useStore();
  return { pendingSaleId: state.pendingSaleId, clearPendingSaleId };
}

export function usePendingReservationPrint() {
  const state = printRequestStore.useStore();
  return { pendingReservationId: state.pendingReservationId, clearPendingReservationId };
}

export const printRequestActions = {
  requestInvoicePrint,
  clearPendingSaleId,
  requestReservationPrint,
  clearPendingReservationId,
  getState: printRequestStore.getState
};
