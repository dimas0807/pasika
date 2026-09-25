/**
 * Database Backup & Persistence Management Module
 * Provides online, ACID-consistent SQLite backups without locking database operations
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { db, DB_PATH } from "./db.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const BACKUPS_DIR = path.resolve(__dirname, "../storage/backups");

// Ensure backup storage directory exists
fs.mkdirSync(BACKUPS_DIR, { recursive: true });

function formatBytes(bytes) {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

/**
 * Perform online ACID backup of SQLite database
 */
export async function createBackupFile(customFilename = null) {
  fs.mkdirSync(BACKUPS_DIR, { recursive: true });
  const now = Date.now();
  const dateStr = new Date(now).toISOString().replace(/[:.]/g, "-");
  const filename = customFilename || `pasika-backup-${dateStr}.db`;
  const destPath = path.join(BACKUPS_DIR, filename);

  try {
    // better-sqlite3 native online backup
    await db.backup(destPath);
    const stats = fs.statSync(destPath);
    return {
      success: true,
      filename,
      filePath: destPath,
      size: stats.size,
      sizeFormatted: formatBytes(stats.size),
      createdAt: now,
    };
  } catch (err) {
    console.error("[Database Backup Error]:", err.message);
    throw new Error(`Помилка створення резервної копії: ${err.message}`);
  }
}

/**
 * List all saved backups
 */
export function listBackups() {
  fs.mkdirSync(BACKUPS_DIR, { recursive: true });
  try {
    const files = fs.readdirSync(BACKUPS_DIR);
    const backups = files
      .filter((f) => f.endsWith(".db"))
      .map((f) => {
        const fullPath = path.join(BACKUPS_DIR, f);
        try {
          const stats = fs.statSync(fullPath);
          return {
            filename: f,
            size: stats.size,
            sizeFormatted: formatBytes(stats.size),
            createdAt: stats.mtimeMs,
          };
        } catch {
          return null;
        }
      })
      .filter(Boolean)
      .sort((a, b) => b.createdAt - a.createdAt);

    return backups;
  } catch (err) {
    console.error("[List Backups Error]:", err.message);
    return [];
  }
}

/**
 * Express handler to download live backup
 */
export async function handleDownloadBackup(req, res) {
  try {
    const backup = await createBackupFile();
    res.setHeader("Content-Type", "application/x-sqlite3");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${backup.filename}"`
    );
    return res.sendFile(backup.filePath);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

/**
 * Express handler to trigger creation of snapshot
 */
export async function handleCreateBackup(req, res) {
  try {
    const result = await createBackupFile();
    return res.status(201).json(result);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

/**
 * Express handler to list snapshots
 */
export function handleListBackups(req, res) {
  const backups = listBackups();
  return res.json({
    databasePath: DB_PATH,
    backupDirectory: BACKUPS_DIR,
    backups,
  });
}

/**
 * Express handler to download a specific backup file
 */
export function handleDownloadSpecificBackup(req, res) {
  try {
    const rawFilename = req.params.filename;
    const safeFilename = path.basename(rawFilename);
    const targetPath = path.join(BACKUPS_DIR, safeFilename);

    if (!fs.existsSync(targetPath)) {
      return res.status(404).json({ error: "Файл резервної копії не знайдено" });
    }

    res.setHeader("Content-Type", "application/x-sqlite3");
    res.setHeader("Content-Disposition", `attachment; filename="${safeFilename}"`);
    return res.sendFile(targetPath);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

