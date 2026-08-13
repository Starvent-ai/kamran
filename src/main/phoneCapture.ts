import { createServer, type Server } from "node:http";
import { ipcMain, type BrowserWindow } from "electron";
import type Store from "electron-store";
import type { PhoneCaptureConfig } from "../shared/types.js";

// The customer-number-entry device wasn't specified yet, so this covers
// the option that needs main-process support: a device/box on the local
// network that can be configured to call a URL with the phone number
// (e.g. GET http://127.0.0.1:PORT/capture?phone=0912...). If the device
// instead behaves like a keyboard (types the digits + Enter into whatever
// field is focused — common for these customer kiosks), it needs nothing
// here at all; the renderer's phone-capture input field handles that case
// directly with no main-process involvement.
//
// Built with Node's built-in http module only — no new dependency, so it
// carries none of the native-module RAM risk the project has been
// avoiding in GitHub Actions.

const CONFIG_KEY = "phone-capture-config";

function extractPhone(url: URL, bodyParsed: Record<string, unknown> | null): string | null {
  const fromQuery = url.searchParams.get("phone");
  if (fromQuery) return fromQuery;
  const fromBody = bodyParsed && typeof bodyParsed.phone === "string" ? bodyParsed.phone : null;
  return fromBody;
}

let server: Server | null = null;

function stopServer(): void {
  server?.close();
  server = null;
}

function startServer(port: number, onPhoneReceived: (phone: string) => void): void {
  stopServer();

  server = createServer((req, res) => {
    const url = new URL(req.url ?? "/", `http://127.0.0.1:${port}`);

    if (url.pathname !== "/capture") {
      res.writeHead(404).end();
      return;
    }

    if (req.method === "GET") {
      const phone = extractPhone(url, null);
      if (phone) onPhoneReceived(phone);
      res.writeHead(200, { "Content-Type": "text/plain; charset=utf-8" }).end("OK");
      return;
    }

    if (req.method === "POST") {
      let raw = "";
      req.on("data", (chunk) => {
        raw += chunk;
      });
      req.on("end", () => {
        let parsed: Record<string, unknown> | null = null;
        try {
          parsed = JSON.parse(raw);
        } catch {
          parsed = null;
        }
        const phone = extractPhone(url, parsed);
        if (phone) onPhoneReceived(phone);
        res.writeHead(200, { "Content-Type": "text/plain; charset=utf-8" }).end("OK");
      });
      return;
    }

    res.writeHead(405).end();
  });

  server.listen(port, "0.0.0.0");
}

export function registerPhoneCaptureHandlers(settingsStore: Store, getWindows: () => BrowserWindow[]): void {
  function broadcast(phone: string): void {
    for (const win of getWindows()) {
      win.webContents.send("phoneCapture:received", phone);
    }
  }

  function applyConfig(config: PhoneCaptureConfig): void {
    if (config.networkListenerEnabled) {
      startServer(config.port, broadcast);
    } else {
      stopServer();
    }
  }

  ipcMain.handle("phoneCapture:getConfig", () => {
    return (
      (settingsStore.get(CONFIG_KEY) as PhoneCaptureConfig | undefined) ?? {
        networkListenerEnabled: false,
        port: 8787
      }
    );
  });

  ipcMain.handle("phoneCapture:saveConfig", (_event, config: PhoneCaptureConfig) => {
    settingsStore.set(CONFIG_KEY, config);
    applyConfig(config);
    return true;
  });

  const existing = settingsStore.get(CONFIG_KEY) as PhoneCaptureConfig | undefined;
  if (existing) applyConfig(existing);
}
