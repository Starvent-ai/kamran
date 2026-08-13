import { createStore } from "@/state/createStore";
import type { SmsLogEntry } from "@shared/types";
import { generateId } from "@/lib/id";

interface LogState {
  entries: SmsLogEntry[];
}

const logStore = createStore<LogState>({ entries: [] }, "data-sms-log");

interface NewLogInput {
  phone: string;
  message: string;
  status: SmsLogEntry["status"];
  errorDetail: string | null;
  templateId: string | null;
}

function addLogEntry(input: NewLogInput): void {
  const entry: SmsLogEntry = { ...input, id: generateId("smslog"), createdAt: new Date().toISOString() };
  logStore.setState((prev) => ({ entries: [entry, ...prev.entries] }));
}

export function useSmsLog() {
  const state = logStore.useStore();
  return { entries: state.entries, addLogEntry };
}

export const smsLogActions = { addLogEntry, getState: logStore.getState };
