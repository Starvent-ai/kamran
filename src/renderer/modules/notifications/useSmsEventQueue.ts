import { createStore } from "@/state/createStore";
import type { SmsTemplateCategory } from "@shared/types";
import { generateId } from "@/lib/id";

export interface QueuedSmsEvent {
  id: string;
  /** Human label of what triggered this, shown in the queue — e.g. "مشتری جدید ثبت شد". */
  eventLabel: string;
  phone: string;
  customerName: string;
  category: SmsTemplateCategory;
  suggestedValues?: Record<string, string>;
  createdAt: string;
  /** true once the shopkeeper has sent or dismissed it — kept (not deleted) for history. */
  handled: boolean;
}

interface QueueState {
  events: QueuedSmsEvent[];
}

const queueStore = createStore<QueueState>({ events: [] }, "data-sms-event-queue");

interface QueueEventInput {
  eventLabel: string;
  phone: string;
  customerName: string;
  category: SmsTemplateCategory;
  suggestedValues?: Record<string, string>;
}

/**
 * Called directly by other modules the instant a real event happens
 * (a new customer is registered, a repair becomes ready for pickup...) —
 * this is what makes the SMS system event-driven rather than something
 * that only notices things when the shopkeeper happens to open this page.
 * Silently does nothing if there's no phone number to text.
 */
function queueEvent(input: QueueEventInput): void {
  if (!input.phone) return;
  const event: QueuedSmsEvent = {
    ...input,
    id: generateId("evt"),
    createdAt: new Date().toISOString(),
    handled: false
  };
  queueStore.setState((prev) => ({ events: [event, ...prev.events] }));
}

function markHandled(eventId: string): void {
  queueStore.setState((prev) => ({
    events: prev.events.map((e) => (e.id === eventId ? { ...e, handled: true } : e))
  }));
}

export function useSmsEventQueue() {
  const state = queueStore.useStore();
  return { pendingEvents: state.events.filter((e) => !e.handled), markHandled };
}

export const smsEventQueueActions = {
  queueEvent,
  markHandled,
  getState: queueStore.getState
};
