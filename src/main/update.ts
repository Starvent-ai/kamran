import { app, BrowserWindow, ipcMain, shell } from "electron";
import electronUpdaterPkg from "electron-updater";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const { autoUpdater } = electronUpdaterPkg;
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// electron-updater checks a GitHub Release's `latest.yml` metadata file to
// decide if a newer version exists — that file is only produced when a
// release is actually published (see package.json's "release:win" script
// and the "publish-release" job in .github/workflows/build.yml, which only
// runs on a pushed `v*` tag). Regular pushes to main keep building exactly
// as before — this feature is entirely opt-in and never runs unless the
// project owner deliberately tags a release.
//
// Rollback: electron-updater/NSIS don't support a safe, fully-automatic
// downgrade (no signed "previous version" staged locally). Instead,
// "بازگشت به نسخهٔ قبلی" opens the GitHub Releases page so an older
// installer can be downloaded and run manually if needed.

autoUpdater.autoDownload = false;
autoUpdater.autoInstallOnAppQuit = false;

function broadcast(channel: string, payload: unknown): void {
  for (const win of BrowserWindow.getAllWindows()) {
    win.webContents.send(channel, payload);
  }
}

export function registerUpdateHandlers(): void {
  ipcMain.handle("app:getVersion", () => app.getVersion());

  ipcMain.handle("update:openReleasesPage", async () => {
    const repoUrl = getRepositoryUrl();
    if (!repoUrl) {
      return { ok: false, error: "آدرس مخزن GitHub در package.json تنظیم نشده است." };
    }
    await shell.openExternal(`${repoUrl}/releases`);
    return { ok: true };
  });

  ipcMain.handle("update:check", async () => {
    if (!app.isPackaged) {
      return { ok: false, error: "بررسی به‌روزرسانی فقط در نسخهٔ نصب‌شده (نه محیط توسعه) کار می‌کند." };
    }
    try {
      const result = await autoUpdater.checkForUpdates();
      return { ok: true, updateAvailable: Boolean(result?.updateInfo && result.updateInfo.version !== app.getVersion()) };
    } catch (error) {
      return { ok: false, error: friendlyUpdateError(error) };
    }
  });

  ipcMain.handle("update:download", async () => {
    if (!app.isPackaged) {
      return { ok: false, error: "دانلود به‌روزرسانی فقط در نسخهٔ نصب‌شده کار می‌کند." };
    }
    try {
      await autoUpdater.downloadUpdate();
      return { ok: true };
    } catch (error) {
      return { ok: false, error: friendlyUpdateError(error) };
    }
  });

  ipcMain.handle("update:install", () => {
    // isSilent=false: respects the project's existing nsis.oneClick=false
    // setting — the installer window still briefly appears instead of a
    // fully silent swap, so "allow choosing install directory" keeps working.
    autoUpdater.quitAndInstall(false, true);
    return { ok: true };
  });

  autoUpdater.on("checking-for-update", () => broadcast("update:status", { phase: "checking" }));
  autoUpdater.on("update-available", (info) => broadcast("update:status", { phase: "available", version: info.version }));
  autoUpdater.on("update-not-available", () => broadcast("update:status", { phase: "up-to-date" }));
  autoUpdater.on("download-progress", (progress) =>
    broadcast("update:status", { phase: "downloading", percent: Math.round(progress.percent) })
  );
  autoUpdater.on("update-downloaded", (info) => broadcast("update:status", { phase: "downloaded", version: info.version }));
  autoUpdater.on("error", (error) => broadcast("update:status", { phase: "error", error: friendlyUpdateError(error) }));
}

function getRepositoryUrl(): string | null {
  try {
    const pkgPath = path.join(__dirname, "../../package.json");
    const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8")) as { repository?: { url?: string } | string };
    const raw = typeof pkg.repository === "string" ? pkg.repository : pkg.repository?.url;
    if (!raw || raw.includes("REPLACE-WITH-YOUR")) return null;
    return raw.replace(/\.git$/, "");
  } catch {
    return null;
  }
}

function friendlyUpdateError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  if (message.includes("REPLACE-WITH-YOUR") || message.includes("404")) {
    return "هیچ نسخهٔ منتشرشده‌ای در GitHub پیدا نشد — یا هنوز نسخه‌ای release نشده، یا آدرس مخزن در package.json تنظیم نشده است.";
  }
  return `خطا در بررسی/دانلود به‌روزرسانی: ${message}`;
}
