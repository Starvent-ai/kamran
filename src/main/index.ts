import { app, BrowserWindow, ipcMain, shell } from "electron";
import path from "node:path";
import { fileURLToPath } from "node:url";
import Store from "electron-store";
import { registerMobilePriceHandlers } from "./mobilePrices.js";
import { registerSmsHandlers } from "./sms.js";
import { registerPhoneCaptureHandlers } from "./phoneCapture.js";
import { registerBackupHandlers } from "./backup.js";
import { registerUpdateHandlers } from "./update.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Local settings (including AI provider API keys) never touch the
// renderer directly — they only pass through the ipcMain handlers below.
// electron-store's built-in encryptionKey uses Node's own crypto module
// (pure JS, no native compile step), so it keeps CI build memory/time
// low while still obfuscating secrets at rest.
const settingsStore = new Store({
  name: "starvent-settings",
  encryptionKey: "starvent-local-store-v1"
});

const isDev = process.env.NODE_ENV === "development" || !app.isPackaged;
const DEV_SERVER_URL = "http://localhost:5173";

let mainWindow: BrowserWindow | null = null;
let splashWindow: BrowserWindow | null = null;

const SPLASH_MIN_VISIBLE_MS = 3000;
let splashShownAt = 0;

function createSplashWindow(): void {
  splashShownAt = Date.now();
  splashWindow = new BrowserWindow({
    width: 420,
    height: 300,
    frame: false,
    resizable: false,
    movable: false,
    show: true,
    backgroundColor: "#0a0a0d",
    icon: path.join(__dirname, "../../build/icon.ico"),
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  });

  void splashWindow.loadFile(path.join(__dirname, "splash.html"));

  splashWindow.on("closed", () => {
    splashWindow = null;
  });
}

function createMainWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1360,
    height: 860,
    minWidth: 1024,
    minHeight: 640,
    show: false,
    backgroundColor: "#0a0a0d",
    icon: path.join(__dirname, "../../build/icon.ico"),
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, "../preload/index.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  });

  mainWindow.once("ready-to-show", () => {
    // Splash must stay visible at least SPLASH_MIN_VISIBLE_MS, even if the
    // main window becomes ready sooner — otherwise it can flash for a
    // fraction of a second on a fast machine.
    const elapsed = Date.now() - splashShownAt;
    const remaining = Math.max(0, SPLASH_MIN_VISIBLE_MS - elapsed);
    setTimeout(() => {
      splashWindow?.close();
      mainWindow?.show();
    }, remaining);
  });

  // Open external links in the user's default browser, not inside the app window.
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    void shell.openExternal(url);
    return { action: "deny" };
  });

  if (isDev) {
    void mainWindow.loadURL(DEV_SERVER_URL);
    mainWindow.webContents.openDevTools({ mode: "detach" });
  } else {
    void mainWindow.loadFile(path.join(__dirname, "../../dist-renderer/index.html"));
  }

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

ipcMain.handle("settings:get", (_event, key: string) => settingsStore.get(key));
ipcMain.handle("settings:set", (_event, key: string, value: unknown) => {
  settingsStore.set(key, value);
  return true;
});

registerMobilePriceHandlers(settingsStore, () => BrowserWindow.getAllWindows());
registerSmsHandlers(settingsStore);
registerPhoneCaptureHandlers(settingsStore, () => BrowserWindow.getAllWindows());
registerBackupHandlers(settingsStore, () => BrowserWindow.getAllWindows());
registerUpdateHandlers();

app.whenReady().then(() => {
  createSplashWindow();
  createMainWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
