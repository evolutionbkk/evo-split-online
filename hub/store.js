// Persistence: Postgres when DATABASE_URL is set (Railway), otherwise a JSON file in DATA_DIR.
// Keeps one snapshot per day for 30 days so a bad change can be rolled back.
'use strict';
const fs = require('fs');
const path = require('path');

const DATABASE_URL = process.env.DATABASE_URL;
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, 'data');
const FILE = path.join(DATA_DIR, 'hub-state.json');
const KEEP_DAYS = 30;
let pool = null;

const dayKey = () => new Date(Date.now() + 7 * 3600000).toISOString().slice(0, 10);
function pgPool(url) {
  const pg = require('pg');
  const noSSL = /localhost|127\.0\.0\.1|\.railway\.internal/.test(url);
  return new pg.Pool({ connectionString: url, ssl: noSSL ? false : { rejectUnauthorized: false }, max: 4 });
}

async function init() {
  if (DATABASE_URL) {
    pool = pgPool(DATABASE_URL);
    await pool.query('CREATE TABLE IF NOT EXISTS hub_state (id INT PRIMARY KEY, data JSONB NOT NULL, updated_at TIMESTAMPTZ DEFAULT now())');
    await pool.query('CREATE TABLE IF NOT EXISTS hub_backups (day TEXT PRIMARY KEY, data JSONB NOT NULL, created_at TIMESTAMPTZ DEFAULT now())');
    console.log('[store] Postgres');
  } else {
    fs.mkdirSync(path.join(DATA_DIR, 'backups'), { recursive: true });
    console.log('[store] JSON file', FILE, '— attach a Railway Postgres or volume to keep data across deploys');
  }
}
async function load() {
  if (pool) { const r = await pool.query('SELECT data FROM hub_state WHERE id = 1'); return r.rows[0] ? r.rows[0].data : null; }
  try { return JSON.parse(fs.readFileSync(FILE, 'utf8')); } catch (e) { return null; }
}
let lastSnap = '';
async function save(state) {
  state.updatedAt = new Date().toISOString();
  if (pool) {
    await pool.query('INSERT INTO hub_state (id, data, updated_at) VALUES (1, $1, now()) ON CONFLICT (id) DO UPDATE SET data = $1, updated_at = now()', [state]);
  } else {
    fs.writeFileSync(FILE + '.tmp', JSON.stringify(state));
    fs.renameSync(FILE + '.tmp', FILE);
  }
  const d = dayKey();
  if (lastSnap !== d) {           // first save of the day → snapshot
    lastSnap = d;
    try {
      if (pool) {
        await pool.query('INSERT INTO hub_backups (day, data) VALUES ($1, $2) ON CONFLICT (day) DO NOTHING', [d, state]);
        await pool.query('DELETE FROM hub_backups WHERE day IN (SELECT day FROM hub_backups ORDER BY day DESC OFFSET $1)', [KEEP_DAYS]);
      } else {
        const f = path.join(DATA_DIR, 'backups', d + '.json');
        if (!fs.existsSync(f)) fs.writeFileSync(f, JSON.stringify(state));
        const files = fs.readdirSync(path.join(DATA_DIR, 'backups')).sort().reverse();
        files.slice(KEEP_DAYS).forEach((x) => fs.unlinkSync(path.join(DATA_DIR, 'backups', x)));
      }
    } catch (e) { console.warn('[store] snapshot failed', String(e)); }
  }
  return state;
}
async function listBackups() {
  if (pool) return (await pool.query('SELECT day, created_at FROM hub_backups ORDER BY day DESC')).rows;
  try { return fs.readdirSync(path.join(DATA_DIR, 'backups')).sort().reverse().map((f) => ({ day: f.replace('.json', '') })); } catch (e) { return []; }
}
async function loadBackup(day) {
  if (pool) { const r = await pool.query('SELECT data FROM hub_backups WHERE day = $1', [day]); return r.rows[0] ? r.rows[0].data : null; }
  try { return JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'backups', day + '.json'), 'utf8')); } catch (e) { return null; }
}
// Read the old evo-split-online state (same Railway project → reference its DATABASE_URL).
async function loadLegacy(url) {
  if (!url) return null;
  const p = pgPool(url);
  try { const r = await p.query('SELECT data FROM app_state WHERE id = 1'); return r.rows[0] ? r.rows[0].data : null; }
  finally { p.end().catch(() => {}); }
}
module.exports = { init, load, save, listBackups, loadBackup, loadLegacy };
