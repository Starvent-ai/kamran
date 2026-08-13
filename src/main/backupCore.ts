import fs from "node:fs";
import path from "node:path";

export const BACKUP_FILE_PREFIX = "starvent-backup-";

/** The folder a backup goes to: the shopkeeper's configured folder if set,
 *  otherwise a "Starvent Backups" folder inside their Documents folder. */
export function resolveBackupFolder(configuredFolder: string | undefined, documentsPath: string): string {
  const trimmed = configuredFolder?.trim();
  return trimmed || path.join(documentsPath, "Starvent Backups");
}

export function buildBackupFileName(date: Date): string {
  return `${BACKUP_FILE_PREFIX}${date.toISOString().replace(/[:.]/g, "-")}.json`;
}

/** Writes `data` as a formatted JSON backup file into `folder` (creating it
 *  if needed) and returns the full path written to. */
export function writeBackupFile(folder: string, data: unknown, date: Date = new Date()): string {
  fs.mkdirSync(folder, { recursive: true });
  const filePath = path.join(folder, buildBackupFileName(date));
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
  return filePath;
}

export interface BackupFileInfo {
  fileName: string;
  filePath: string;
  createdAt: string;
  sizeBytes: number;
}

/** Lists this app's backup files in `folder`, newest first. Returns an
 *  empty list (not an error) when the folder doesn't exist yet — that just
 *  means no backup has been taken there. */
export function listBackups(folder: string): BackupFileInfo[] {
  if (!fs.existsSync(folder)) return [];
  return fs
    .readdirSync(folder)
    .filter((f) => f.startsWith(BACKUP_FILE_PREFIX) && f.endsWith(".json"))
    .map((fileName) => {
      const filePath = path.join(folder, fileName);
      const stat = fs.statSync(filePath);
      return { fileName, filePath, createdAt: stat.mtime.toISOString(), sizeBytes: stat.size };
    })
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

/** Whether an automatic backup is due, given when the last one ran (or
 *  never, i.e. undefined) and the configured interval. Pure function so the
 *  scheduling decision itself is testable without faking timers. */
export function isAutoBackupDue(lastBackupAt: string | undefined, intervalHours: number, now: Date = new Date()): boolean {
  if (!lastBackupAt) return true;
  const dueAt = new Date(lastBackupAt).getTime() + intervalHours * 60 * 60 * 1000;
  return now.getTime() >= dueAt;
}

/** Reads and JSON-parses a backup file, returning null if it isn't a
 *  plausible backup (not an object) rather than throwing — callers decide
 *  how to surface that as a user-facing error. */
export function readBackupFile(filePath: string): Record<string, unknown> | null {
  const raw = fs.readFileSync(filePath, "utf-8");
  const parsed: unknown = JSON.parse(raw);
  if (typeof parsed !== "object" || parsed === null) return null;
  return parsed as Record<string, unknown>;
}
