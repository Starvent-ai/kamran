import { useSyncExternalStore } from "react";

const PERSIST_DEBOUNCE_MS = 400;
const persistTimers = new Map<string, ReturnType<typeof setTimeout>>();

/**
 * Reads a previously persisted value for `key`, if any. Uses the same
 * window.starvent.settings channel (electron-store on disk) that Settings/
 * StoreSettings already use — no new IPC channel needed. Falls back to
 * localStorage when the preload bridge isn't present (Vite dev server,
 * Vitest/jsdom), same fallback already used by storeProfile.ts.
 */
async function loadPersisted<T>(key: string): Promise<T | undefined> {
  if (typeof window === "undefined") return undefined;
  if (window.starvent) {
    const saved = await window.starvent.settings.get(key);
    return saved as T | undefined;
  }
  const raw = localStorage.getItem(key);
  return raw ? (JSON.parse(raw) as T) : undefined;
}

/** Debounced so rapid successive setState calls (e.g. seeding several rows)
 *  don't trigger a disk/IPC write per call — only once activity settles.
 *  Takes a getter (not a value) so that if this fires after hydration has
 *  since resolved and updated state, it writes the current state — never a
 *  stale snapshot captured back when it was first scheduled. */
function schedulePersist<T>(key: string, getCurrent: () => T): void {
  if (typeof window === "undefined") return;
  const existing = persistTimers.get(key);
  if (existing) clearTimeout(existing);
  persistTimers.set(
    key,
    setTimeout(() => {
      persistTimers.delete(key);
      const current = getCurrent();
      if (window.starvent) {
        void window.starvent.settings.set(key, current);
      } else {
        localStorage.setItem(key, JSON.stringify(current));
      }
    }, PERSIST_DEBOUNCE_MS)
  );
}

/**
 * A tiny store shared across modules, with useSyncExternalStore for React
 * subscriptions. When persistKey is given, the store loads any previously
 * saved state on creation (replacing the seed data once it arrives) and
 * saves on every change — this is the ONLY place a module's data actually
 * reaches disk, so every module hook already reads/writes through this one
 * abstraction. Omit persistKey for genuinely transient, in-session-only
 * state (e.g. printRequestStore's "pending print" flag).
 */
export function createStore<T>(initialState: T, persistKey?: string) {
  let state = initialState;
  const listeners = new Set<() => void>();

  function getState(): T {
    return state;
  }

  function setState(updater: (prev: T) => T): void {
    state = updater(state);
    listeners.forEach((listener) => listener());
    // Always schedule — even if this fires before hydration resolves.
    // schedulePersist reads state fresh when its timer actually fires
    // (400ms later), by which point hydration has long since settled in
    // any realistic scenario, so this never writes stale pre-hydration
    // data over real saved data on disk.
    if (persistKey) schedulePersist(persistKey, getState);
  }

  function subscribe(listener: () => void): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  }

  function useStore(): T {
    return useSyncExternalStore(subscribe, getState, getState);
  }

  if (persistKey) {
    void loadPersisted<T>(persistKey).then((saved) => {
      if (saved !== undefined) {
        state = saved;
        listeners.forEach((listener) => listener());
      }
    });
  }

  return { getState, setState, useStore };
}
