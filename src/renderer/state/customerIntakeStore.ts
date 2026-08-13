import { createStore } from "@/state/createStore";

interface CustomerIntakeState {
  pendingPhone: string | null;
}

const customerIntakeStore = createStore<CustomerIntakeState>({ pendingPhone: null });

/** Called when a captured phone number doesn't match any existing customer. */
function requestNewCustomerForm(phone: string): void {
  customerIntakeStore.setState(() => ({ pendingPhone: phone }));
}

/** Called by Customers once it has consumed the pending phone, so it doesn't re-trigger later. */
function clearPendingPhone(): void {
  customerIntakeStore.setState(() => ({ pendingPhone: null }));
}

export function usePendingCustomerIntake() {
  const state = customerIntakeStore.useStore();
  return { pendingPhone: state.pendingPhone, clearPendingPhone };
}

export const customerIntakeActions = {
  requestNewCustomerForm,
  clearPendingPhone,
  getState: customerIntakeStore.getState
};
