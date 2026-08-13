import { app, BrowserWindow, dialog, ipcMain } from "electron";
import fs from "node:fs";
import type Store from "electron-store";
import { isAutoBackupDue, listBackups, readBackupFile, resolveBackupFolder, writeBackupFile } from "./backupCore.js";

// This is the ONLY real backup mechanism in the app — a full JSON snapshot
// of everything electron-store holds (every module's persisted data plus
// settings), written to a plain file the shopkeeper can copy anywhere
// (USB drive, cloud-synced folder, email to themselves). Restoring replaces
// the whole store, then relaunches the app so the renderer's in-memory
// stores rehydrate from the restored data instead of drifting from it.
// The actual file I/O lives in ./backupCore.ts, kept free of any "electron"
// import so it can be unit-tested under plain Node — see that file.

interface BackupProfileFields {
  autoBackupEnabled: boolean;
  backupFolder: string;
  backupIntervalHours: number;
}

const LAST_BACKUP_KEY = "last-auto-backup-at";
const AUTO_BACKUP_CHECK_INTERVAL_MS = 10 * 60 * 1000;

function currentBackupFolder(settingsStore: Store): string {
  const profile = settingsStore.get("store-profile") as Partial<BackupProfileFields> | undefined;
  return resolveBackupFolder(profile?.backupFolder, app.getPath("documents"));
}

export function registerBackupHandlers(settingsStore: Store, getWindows: () => BrowserWindow[]): void {
  ipcMain.handle("backup:createNow", () => {
    try {
      const folder = currentBackupFolder(settingsStore);
      const filePath = writeBackupFile(folder, settingsStore.store);
      settingsStore.set(LAST_BACKUP_KEY, new Date().toISOString());
      return { ok: true, filePath };
    } catch (error) {
      return { ok: false, error: error instanceof Error ? error.message : "خطای نامشخص" };
    }
  });

  ipcMain.handle("backup:list", () => {
    try {
      const folder = currentBackupFolder(settingsStore);
      return { ok: true, folder, backups: listBackups(folder) };
    } catch (error) {
      return { ok: false, folder: "", backups: [], error: error instanceof Error ? error.message : "خطای نامشخص" };
    }
  });

  ipcMain.handle("backup:pickFolder", async () => {
    const win = getWindows()[0];
    const result = win
      ? await dialog.showOpenDialog(win, { properties: ["openDirectory", "createDirectory"] })
      : await dialog.showOpenDialog({ properties: ["openDirectory", "createDirectory"] });
    if (result.canceled || result.filePaths.length === 0) return null;
    return result.filePaths[0];
  });

  ipcMain.handle("backup:restoreFromFile", (_event, filePath: string) => {
    try {
      const parsed = readBackupFile(filePath);
      if (!parsed) {
        return { ok: false, error: "فایل بکاپ معتبر نیست." };
      }
      // Full replace, not a merge — a restore should put the app back
      // exactly as the backup captured it, not blend with current data.
      settingsStore.store = parsed;

      // The renderer's stores already hydrated from the old data at
      // startup; relaunching is the simplest reliable way to make every
      // module re-read the restored data instead of drifting from it.
      setTimeout(() => {
        app.relaunch();
        app.exit(0);
      }, 300);

      return { ok: true };
    } catch (error) {
      return { ok: false, error: error instanceof Error ? error.message : "خطا در خواندن فایل بکاپ" };
    }
  });

  ipcMain.handle("backup:deleteFile", (_event, filePath: string) => {
    try {
      fs.unlinkSync(filePath);
      return { ok: true };
    } catch (error) {
      return { ok: false, error: error instanceof Error ? error.message : "خطا در حذف فایل" };
    }
  });

  // Checked periodically rather than scheduled per-interval-hours exactly,
  // so a change to backupIntervalHours in Settings takes effect on the next
  // check instead of needing the app restarted.
  setInterval(() => {
    try {
      const profile = settingsStore.get("store-profile") as Partial<BackupProfileFields> | undefined;
      if (!profile?.autoBackupEnabled) return;
      const intervalHours = profile.backupIntervalHours && profile.backupIntervalHours > 0 ? profile.backupIntervalHours : 24;
      const lastAt = settingsStore.get(LAST_BACKUP_KEY) as string | undefined;
      if (!isAutoBackupDue(lastAt, intervalHours)) return;
      writeBackupFile(currentBackupFolder(settingsStore), settingsStore.store);
      settingsStore.set(LAST_BACKUP_KEY, new Date().toISOString());
    } catch {
      // Silent — the manual "بکاپ‌گیری الان" button is the supported way
      // to see and diagnose a backup failure directly.
    }
  }, AUTO_BACKUP_CHECK_INTERVAL_MS);
}
