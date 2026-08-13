import { describe, expect, it, beforeEach, vi } from "vitest";
import { createStore } from "@/state/createStore";

// These tests run without window.starvent (no Electron preload bridge in
// jsdom), so createStore falls back to localStorage — same fallback path
// used in production during `npm run dev` before packaging.
describe("createStore persistence", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useRealTimers();
  });

  it("does not touch localStorage when no persistKey is given", async () => {
    const store = createStore<{ value: number }>({ value: 0 });
    store.setState(() => ({ value: 1 }));
    await new Promise((resolve) => setTimeout(resolve, 500));
    expect(localStorage.length).toBe(0);
  });

  it("saves state to localStorage under persistKey after a change settles", async () => {
    const store = createStore<{ items: string[] }>({ items: [] }, "test-persist-key-1");
    store.setState((prev) => ({ items: [...prev.items, "a"] }));

    // Debounced — nothing written yet immediately after setState.
    expect(localStorage.getItem("test-persist-key-1")).toBeNull();

    await new Promise((resolve) => setTimeout(resolve, 500));
    const saved = JSON.parse(localStorage.getItem("test-persist-key-1") ?? "null");
    expect(saved).toEqual({ items: ["a"] });
  });

  it("a new store instance with the same persistKey loads the previously saved state", async () => {
    const first = createStore<{ items: string[] }>({ items: [] }, "test-persist-key-2");
    first.setState((prev) => ({ items: [...prev.items, "seeded-by-first-instance"] }));
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Simulates an app restart: a brand-new store with default seed data,
    // but the same persistKey, should pick up what was saved above instead
    // of keeping its own seed.
    const second = createStore<{ items: string[] }>({ items: ["default-seed"] }, "test-persist-key-2");
    // Hydration is async (awaits the settings/localStorage read).
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(second.getState()).toEqual({ items: ["seeded-by-first-instance"] });
  });

  it("changes made after hydration finishes persist and merge with the previously saved state", async () => {
    createStore<{ items: string[] }>({ items: ["saved"] }, "test-persist-key-3");
    await new Promise((resolve) => setTimeout(resolve, 500));

    const second = createStore<{ items: string[] }>({ items: ["seed"] }, "test-persist-key-3");
    await new Promise((resolve) => setTimeout(resolve, 50)); // let hydration finish
    second.setState((prev) => ({ items: [...prev.items, "added-after-hydration"] }));
    await new Promise((resolve) => setTimeout(resolve, 500));

    const saved = JSON.parse(localStorage.getItem("test-persist-key-3") ?? "null");
    expect(saved).toEqual({ items: ["saved", "added-after-hydration"] });
  });
});
