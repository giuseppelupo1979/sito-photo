import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.resolve(process.cwd(), 'database.sqlite');
const db = new Database(dbPath);

// Initialize tables
db.exec(`
  CREATE TABLE IF NOT EXISTS stories (
    id TEXT PRIMARY KEY,
    slug TEXT UNIQUE NOT NULL,
    cat TEXT NOT NULL,
    title TEXT NOT NULL,
    loc TEXT NOT NULL,
    year INTEGER NOT NULL,
    blurb TEXT,
    lat REAL,
    lng REAL,
    cover_src TEXT,
    cover_angle INTEGER DEFAULT 0,
    cover_tone TEXT DEFAULT 'dark'
  );

  CREATE TABLE IF NOT EXISTS frames (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    story_id TEXT NOT NULL,
    n TEXT NOT NULL,
    lbl TEXT,
    src TEXT NOT NULL,
    angle INTEGER DEFAULT 0,
    tone TEXT DEFAULT 'dark',
    is_star BOOLEAN DEFAULT 0,
    camera_data TEXT, -- JSON string
    FOREIGN KEY (story_id) REFERENCES stories(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT
  );

  CREATE TABLE IF NOT EXISTS print_requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    frame_src TEXT NOT NULL,
    frame_lbl TEXT,
    story_title TEXT NOT NULL,
    story_id TEXT NOT NULL,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    size TEXT NOT NULL,
    paper TEXT NOT NULL,
    notes TEXT,
    status TEXT DEFAULT 'pending',
    created_at TEXT DEFAULT (datetime('now'))
  );
`);

// Migration: add order_idx to frames if not exists
try { db.exec('ALTER TABLE frames ADD COLUMN order_idx INTEGER DEFAULT 0'); } catch {}
// Back-fill: set order_idx = id for existing rows that have it at 0
db.exec('UPDATE frames SET order_idx = id WHERE order_idx = 0');

// Seed default settings if not exists
const seedSettings = db.prepare('INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)');
seedSettings.run('email', 'hello@giuseppelupo.it');
seedSettings.run('ig_handle', '@giuseppelupo');
seedSettings.run('admin_password', 'Admin123!');
// Print service
seedSettings.run('print_sizes', '30×40 cm\n40×60 cm\n50×70 cm\n60×90 cm');
seedSettings.run('print_papers', 'Baryta\nCotton Rag\nHahnemühle Photo Rag\nHahnemühle German Etching');
seedSettings.run('print_edition', '8');
seedSettings.run('print_response_time', 'entro 48 ore');
seedSettings.run('print_intro', 'Ogni stampa è prodotta in edizione limitata, numerata e firmata a mano.');
// SMTP notifications
seedSettings.run('smtp_host', '');
seedSettings.run('smtp_port', '587');
seedSettings.run('smtp_user', '');
seedSettings.run('smtp_pass', '');
seedSettings.run('notify_email', 'hello@giuseppelupo.it');

// Seed stories if empty
const count = db.prepare('SELECT count(*) as count FROM stories').get() as { count: number };
if (count.count === 0) {
  const insertStory = db.prepare('INSERT INTO stories (id, slug, cat, title, loc, year, blurb, cover_src) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
  insertStory.run('LMP', 'lampedusa', 'REPORTAGE', 'Il molo prima dell\'alba', 'Lampedusa, IT', 2024, 'Tre settimane al porto vecchio...', '/photos/lampedusa_molo_dawn_1776460589179.png');
  insertStory.run('PLR', 'palermo', 'RITRATTO', 'Le Nonne della Vucciria', 'Palermo, IT', 2025, 'Dodici ritratti di donne...', '/photos/palermo_nonna_window_1776460630947.png');
  insertStory.run('HYO', 'huancayo', 'VIAGGIO', 'Mercato domenicale', 'Huancayo, PE', 2022, 'Il mercato di Huancayo...', '/photos/huancayo_mercato_peru_1776460650270.png');

  const insertFrame = db.prepare('INSERT INTO frames (story_id, n, lbl, src, is_star, camera_data) VALUES (?, ?, ?, ?, ?, ?)');
  
  // Lampedusa frames
  insertFrame.run('LMP', '01A', 'molo — corde bagnate', '/photos/lampedusa_molo_dawn_1776460589179.png', 1, JSON.stringify({ Model: 'Leica M11', LensModel: '35mm Summilux', ExposureTime: 0.004, FNumber: 4, ISO: 400 }));
  insertFrame.run('LMP', '02A', 'silhouette — pescatori', '/photos/lampedusa_molo_dawn_1776460589179.png', 0, JSON.stringify({ Model: 'Leica M11', LensModel: '35mm Summilux', ExposureTime: 0.008, FNumber: 2.8, ISO: 800 }));
  
  // Palermo frames
  insertFrame.run('PLR', '01P', 'Ignazia, 94 — finestra', '/photos/palermo_nonna_window_1776460630947.png', 1, JSON.stringify({ Model: 'Leica Q2', LensModel: '28mm Summilux', ExposureTime: 0.0125, FNumber: 1.7, ISO: 1600 }));
  
  // Huancayo frames
  insertFrame.run('HYO', '01H', 'venditore — cappello nero', '/photos/huancayo_mercato_peru_1776460650270.png', 1, JSON.stringify({ Model: 'Fujifilm X-T5', LensModel: '23mm f/1.4', ExposureTime: 0.002, FNumber: 5.6, ISO: 200 }));
}

export function getSettings() {
  const rows = db.prepare('SELECT * FROM settings').all() as { key: string, value: string }[];
  const settings: Record<string, string> = {};
  rows.forEach(r => settings[r.key] = r.value);
  return settings;
}

export default db;
