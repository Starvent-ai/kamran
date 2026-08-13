import * as cheerio from "cheerio";
import { ipcMain, type BrowserWindow } from "electron";
import type Store from "electron-store";
import type { MobilePriceItem, MobilePriceListResult, MobilePriceSourceConfig } from "../shared/types";

// There is no official API for live mobile/tablet prices in Iran (checked —
// none of the usual free/paid gold-and-currency providers cover phones).
// This module is the fallback the user asked for instead: point it at a
// site that already displays live phone prices, tell it which CSS
// selectors wrap each product/name/price, and it scrapes that page on a
// timer so prices show up in the app without retyping them by hand.

const SOURCE_KEY = "mobile-price-source";
const LIST_KEY = "mobile-price-list";
const MIN_REFRESH_MINUTES = 5;

function toEnglishDigits(input: string): string {
  const persian = "۰۱۲۳۴۵۶۷۸۹";
  const arabic = "٠١٢٣٤٥٦٧٨٩";
  return input.replace(/[۰-۹٠-٩]/g, (digit) => {
    const persianIndex = persian.indexOf(digit);
    if (persianIndex > -1) return String(persianIndex);
    const arabicIndex = arabic.indexOf(digit);
    return arabicIndex > -1 ? String(arabicIndex) : digit;
  });
}

function parsePrice(raw: string): number | null {
  const digitsOnly = toEnglishDigits(raw).replace(/[^\d]/g, "");
  if (!digitsOnly) return null;
  const value = Number(digitsOnly);
  return Number.isFinite(value) ? value : null;
}

/** Fetches the configured page and scrapes {name, price} pairs out of it using the given selectors. */
export async function fetchMobilePrices(config: MobilePriceSourceConfig): Promise<MobilePriceItem[]> {
  if (!config.url || !config.itemSelector) {
    throw new Error("آدرس سایت و انتخاب‌گر (selector) هر آیتم الزامی است.");
  }

  const response = await fetch(config.url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Starvent-PriceFetcher/1.0"
    }
  });

  if (!response.ok) {
    throw new Error(`سایت مرجع پاسخ ${response.status} داد.`);
  }

  const html = await response.text();
  const $ = cheerio.load(html);
  const items: MobilePriceItem[] = [];

  $(config.itemSelector).each((_index, element) => {
    const scope = $(element);
    const nameNode = config.nameSelector ? scope.find(config.nameSelector).first() : scope;
    const priceNode = config.priceSelector ? scope.find(config.priceSelector).first() : scope;

    const name = nameNode.text().trim();
    const price = parsePrice(priceNode.text());

    if (name && price !== null) {
      items.push({ name, price });
    }
  });

  return items;
}

let refreshTimer: ReturnType<typeof setInterval> | null = null;

/** Registers the settings/preview/list IPC handlers and resumes the background refresh timer if a source was already configured. */
export function registerMobilePriceHandlers(settingsStore: Store, getWindows: () => BrowserWindow[]): void {
  function broadcastUpdate(result: MobilePriceListResult): void {
    for (const win of getWindows()) {
      win.webContents.send("mobilePrices:updated", result);
    }
  }

  async function refreshAndStore(config: MobilePriceSourceConfig): Promise<void> {
    const previous = settingsStore.get(LIST_KEY) as MobilePriceListResult | undefined;
    try {
      const items = await fetchMobilePrices(config);
      const result: MobilePriceListResult = { items, updatedAt: new Date().toISOString(), error: null };
      settingsStore.set(LIST_KEY, result);
      broadcastUpdate(result);
    } catch (error) {
      // Keep the last good list on screen even if a refresh fails (e.g. the
      // site is briefly down) — only the error message is surfaced, not an
      // emptied-out price list.
      const message = error instanceof Error ? error.message : "خطای نامشخص در دریافت قیمت‌ها.";
      const result: MobilePriceListResult = {
        items: previous?.items ?? [],
        updatedAt: previous?.updatedAt ?? null,
        error: message
      };
      settingsStore.set(LIST_KEY, result);
      broadcastUpdate(result);
    }
  }

  function scheduleRefresh(config: MobilePriceSourceConfig): void {
    if (refreshTimer) {
      clearInterval(refreshTimer);
      refreshTimer = null;
    }
    const minutes = Math.max(config.refreshMinutes || MIN_REFRESH_MINUTES, MIN_REFRESH_MINUTES);
    refreshTimer = setInterval(() => {
      void refreshAndStore(config);
    }, minutes * 60 * 1000);
  }

  ipcMain.handle("mobilePrices:test", async (_event, config: MobilePriceSourceConfig) => {
    try {
      const items = await fetchMobilePrices(config);
      return { ok: true as const, items };
    } catch (error) {
      const message = error instanceof Error ? error.message : "خطای نامشخص در دریافت قیمت‌ها.";
      return { ok: false as const, error: message };
    }
  });

  ipcMain.handle("mobilePrices:getConfig", () => {
    return (settingsStore.get(SOURCE_KEY) as MobilePriceSourceConfig | undefined) ?? null;
  });

  ipcMain.handle("mobilePrices:saveConfig", async (_event, config: MobilePriceSourceConfig) => {
    settingsStore.set(SOURCE_KEY, config);
    scheduleRefresh(config);
    await refreshAndStore(config);
    return true;
  });

  ipcMain.handle("mobilePrices:getList", () => {
    return (settingsStore.get(LIST_KEY) as MobilePriceListResult | undefined) ?? { items: [], updatedAt: null, error: null };
  });

  const existingConfig = settingsStore.get(SOURCE_KEY) as MobilePriceSourceConfig | undefined;
  if (existingConfig?.url) {
    scheduleRefresh(existingConfig);
  }
}
