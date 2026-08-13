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
 *  don't trigger a disk/IPC write per call — only once activity settles. */
function schedulePersist<T>(key: string, state: T): void {
  if (typeof window === "undefined") return;
  const existing = persistTimers.get(key);
  if (existing) clearTimeout(existing);
  persistTimers.set(
    key,
    setTimeout(() => {
      persistTimers.delete(key);
      if (window.starvent) {
        void window.starvent.settings.set(key, state);
      } else {
        localStorage.setItem(key, JSON.stringify(state));
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
  // Until hydration finishes, setState must not persist — otherwise the
  // seed data would momentarily overwrite whatever was already saved on
  // disk, in the split second before the real saved state loads in.
  let hydrated = !persistKey;
  const listeners = new Set<() => void>();

  function getState(): T {
    return state;
  }

  function setState(updater: (prev: T) => T): void {
    state = updater(state);
    listeners.forEach((listener) => listener());
    if (persistKey && hydrated) schedulePersist(persistKey, state);
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
      hydrated = true;
      if (saved !== undefined) {
        state = saved;
        listeners.forEach((listener) => listener());
      }
    });
  }

  return { getState, setState, useStore };
}
