import { ipcMain } from "electron";
import type Store from "electron-store";
import type { SmsGatewayConfig } from "../shared/types.js";
import { sendSms } from "./smsSend.js";

// No specific SMS panel was named, so this talks to *any* REST-based
// Iranian SMS gateway (Kavenegar, Melipayamak, etc. all expose a simple
// GET/POST endpoint) via a small key→value param template the shopkeeper
// fills in from their panel's own docs — same "point it at your own
// config" pattern already used for the mobile-price scraper. No SDK
// dependency, no native module, nothing extra for GitHub's build RAM.
//
// The actual request-building/sending logic lives in ./smsSend.ts, kept
// free of any "electron" import so it can be unit-tested under plain
// Node — see that file's comment for why that split matters.

export { sendSms, type SendSmsResult } from "./smsSend.js";

const GATEWAY_CONFIG_KEY = "sms-gateway-config";

export function registerSmsHandlers(settingsStore: Store): void {
  ipcMain.handle("sms:getConfig", () => {
    return (settingsStore.get(GATEWAY_CONFIG_KEY) as SmsGatewayConfig | undefined) ?? null;
  });

  ipcMain.handle("sms:saveConfig", (_event, config: SmsGatewayConfig) => {
    settingsStore.set(GATEWAY_CONFIG_KEY, config);
    return true;
  });

  ipcMain.handle("sms:send", async (_event, config: SmsGatewayConfig, phone: string, message: string) => {
    return sendSms(config, phone, message);
  });
}
