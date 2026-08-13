export {};

import type {
  MobilePriceListResult,
  MobilePriceSourceConfig,
  SmsGatewayConfig,
  PhoneCaptureConfig
} from "@shared/types";

declare global {
  interface Window {
    starvent?: {
      appInfo: {
        getVersion: () => Promise<string>;
        platform: string;
      };
      settings: {
        get: (key: string) => Promise<unknown>;
        set: (key: string, value: unknown) => Promise<boolean>;
      };
      mobilePrices: {
        test: (config: MobilePriceSourceConfig) => Promise<{ ok: true; items: { name: string; price: number }[] } | { ok: false; error: string }>;
        getConfig: () => Promise<MobilePriceSourceConfig | null>;
        saveConfig: (config: MobilePriceSourceConfig) => Promise<boolean>;
        getList: () => Promise<MobilePriceListResult>;
        onUpdated: (callback: (result: MobilePriceListResult) => void) => () => void;
      };
      sms: {
        getConfig: () => Promise<SmsGatewayConfig | null>;
        saveConfig: (config: SmsGatewayConfig) => Promise<boolean>;
        send: (config: SmsGatewayConfig, phone: string, message: string) => Promise<{ ok: boolean; error: string | null }>;
      };
      phoneCapture: {
        getConfig: () => Promise<PhoneCaptureConfig>;
        saveConfig: (config: PhoneCaptureConfig) => Promise<boolean>;
        onReceived: (callback: (phone: string) => void) => () => void;
      };
      backup: {
        createNow: () => Promise<{ ok: true; filePath: string } | { ok: false; error: string }>;
        list: () => Promise<
          | { ok: true; folder: string; backups: { fileName: string; filePath: string; createdAt: string; sizeBytes: number }[] }
          | { ok: false; folder: string; backups: []; error: string }
        >;
        pickFolder: () => Promise<string | null>;
        restoreFromFile: (filePath: string) => Promise<{ ok: true } | { ok: false; error: string }>;
        deleteFile: (filePath: string) => Promise<{ ok: true } | { ok: false; error: string }>;
      };
      update: {
        check: () => Promise<{ ok: true; updateAvailable: boolean } | { ok: false; error: string }>;
        download: () => Promise<{ ok: true } | { ok: false; error: string }>;
        install: () => Promise<{ ok: true }>;
        openReleasesPage: () => Promise<{ ok: true } | { ok: false; error: string }>;
        onStatus: (callback: (status: UpdateStatus) => void) => () => void;
      };
    };
  }
}

export type UpdateStatus =
  | { phase: "checking" }
  | { phase: "available"; version: string }
  | { phase: "up-to-date" }
  | { phase: "downloading"; percent: number }
  | { phase: "downloaded"; version: string }
  | { phase: "error"; error: string };
