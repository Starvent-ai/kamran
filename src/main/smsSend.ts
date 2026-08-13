import type { SmsGatewayConfig } from "../shared/types.js";

// Pure request-building/sending logic, deliberately kept free of any
// "electron" import. Electron's ipcMain/BrowserWindow etc. only exist
// inside the Electron runtime — outside it (e.g. this file loaded by
// vitest under plain Node for unit tests), importing "electron" at
// module scope is a well-known source of ESM/CJS interop errors ("Named
// export 'ipcMain' not found..."). Splitting this out means the tests
// exercise the exact same function the app calls, with zero risk of
// that failure mode. sms.ts (electron-facing) imports this file.

function substitutePlaceholders(template: string, values: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (_match, key: string) => values[key] ?? "");
}

export interface SendSmsResult {
  ok: boolean;
  error: string | null;
}

/** Builds the request from the configured template and calls the gateway. */
export async function sendSms(config: SmsGatewayConfig, phone: string, message: string): Promise<SendSmsResult> {
  if (!config.endpoint) {
    return { ok: false, error: "آدرس پنل پیامکی در تنظیمات وارد نشده است." };
  }

  const placeholderValues: Record<string, string> = {
    phone,
    message,
    sender: config.senderNumber,
    apikey: config.apiKey
  };

  try {
    if (config.method === "GET") {
      const url = new URL(config.endpoint);
      for (const param of config.params) {
        url.searchParams.set(param.key, substitutePlaceholders(param.valueTemplate, placeholderValues));
      }
      const response = await fetch(url.toString());
      if (!response.ok) {
        return { ok: false, error: `پنل پیامکی پاسخ ${response.status} داد.` };
      }
      return { ok: true, error: null };
    }

    const body: Record<string, string> = {};
    for (const param of config.params) {
      body[param.key] = substitutePlaceholders(param.valueTemplate, placeholderValues);
    }
    const response = await fetch(config.endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    if (!response.ok) {
      return { ok: false, error: `پنل پیامکی پاسخ ${response.status} داد.` };
    }
    return { ok: true, error: null };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "خطای نامشخص در ارسال پیامک.";
    return { ok: false, error: errorMessage };
  }
}
