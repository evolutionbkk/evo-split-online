// Persistence: Postgres if DATABASE_URL is set (recommended on Railway), else a local JSON file.
// Also keeps automatic daily snapshots (last 30 days) so data can be recovered after a mistake.
'use strict';
const fs = require('fs');
const path = require('path');

const DATABASE_URL = process.env.DATABASE_URL;
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, 'data');
const FILE = path.join(DATA_DIR, 'state.json');
const BK_DIR = path.join(DATA_DIR, 'backups');
const KEEP_DAYS = 30;

let pg = null;
let pool = null;

function todayKey() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate());
}

async function init() {
  if (DATABASE_URL) {
    pg = require('pg');
    // Railway's internal Postgres (*.railway.internal) and localhost do NOT support SSL.
    const noSSL = /localhost|127\.0\.0\.1|\.railway\.internal/.test(DATABASE_URL);
    pool = new pg.Pool({
      connectionString: DATABASE_URL,
      ssl: noSSL ? false : { rejectUnauthorized: false },
    });
    await pool.query('CREATE TABLE IF NOT EXISTS app_state (id INT PRIMARY KEY, data JSONB NOT NULL, updated_at TIMESTAMPTZ DEFAULT now())');
    await pool.query('CREATE TABLE IF NOT EXISTS app_backups (day TEXT PRIMARY KEY, data JSONB NOT NULL, records INT NOT NULL, created_at TIMESTAMPTZ DEFAULT now())');
    console.log('[store] using Postgres');
  } else {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    if (!fs.existsSync(BK_DIR)) fs.mkdirSync(BK_DIR, { recursive: true });
    console.log('[store] using JSON file at', FILE, '(attach a Railway volume here for durability)');
  }
}

async function load() {
  if (pool) {
    const r = await pool.query('SELECT data FROM app_state WHERE id = 1');
    return r.rows.length ? r.rows[0].data : null;
  }
  try { return JSON.parse(fs.readFileSync(FILE, 'utf8')); } catch (e) { return null; }
}

// Keep one snapshot per calendar day. IMPORTANT: a snapshot is only overwritten when the
// new state has >= as many records as the existing one — so an accidental wipe (fewer/zero
// records) can never destroy that day's good backup. Prunes snapshots older than KEEP_DAYS.
async function snapshot(state) {
  try {
    const records = Array.isArray(state.assigned) ? state.assigned.length : 0;
    const day = todayKey();
    if (pool) {
      await pool.query(
        `INSERT INTO app_backups (day, data, records, created_at) VALUES ($1,$2,$3, now())
         ON CONFLICT (day) DO UPDATE SET data = EXCLUDED.data, records = EXCLUDED.records, created_at = now()
         WHERE app_backups.records <= EXCLUDED.records`,
        [day, state, records]
      );
      await pool.query(
        `DELETE FROM app_backups WHERE day IN (
           SELECT day FROM app_backups ORDER BY day DESC OFFSET $1)`,
        [KEEP_DAYS]
      );
    } else {
      if (!fs.existsSync(BK_DIR)) fs.mkdirSync(BK_DIR, { recursive: true });
      const f = path.join(BK_DIR, day + '.json');
      let existing = 0;
      try { existing = (JSON.parse(fs.readFileSync(f, 'utf8')).assigned || []).length; } catch (e) {}
      if (records >= existing) fs.writeFileSync(f, JSON.stringify(state));
      // prune
      const files = fs.readdirSync(BK_DIR).filter((x) => x.endsWith('.json')).sort().reverse();
      files.slice(KEEP_DAYS).forEach((x) => { try { fs.unlinkSync(path.join(BK_DIR, x)); } catch (e) {} });
    }
  } catch (e) {
    console.warn('[store] snapshot failed (non-fatal):', String(e));
  }
}

async function save(state) {
  const payload = { ...state, updatedAt: new Date().toISOString() };
  if (pool) {
    await pool.query(
      'INSERT INTO app_state (id, data, updated_at) VALUES (1, $1, now()) ON CONFLICT (id) DO UPDATE SET data = $1, updated_at = now()',
      [payload]
    );
  } else {
    fs.writeFileSync(FILE, JSON.stringify(payload));
  }
  await snapshot(payload);
  return payload;
}

async function listBackups() {
  if (pool) {
    const r = await pool.query('SELECT day, records, created_at FROM app_backups ORDER BY day DESC');
    return r.rows.map((x) => ({ day: x.day, records: x.records, createdAt: x.created_at }));
  }
  try {
    return fs.readdirSync(BK_DIR).filter((x) => x.endsWith('.json')).sort().reverse().map((x) => {
      const day = x.replace('.json', '');
      let records = 0, createdAt = null;
      try { const s = JSON.parse(fs.readFileSync(path.join(BK_DIR, x), 'utf8')); records = (s.assigned || []).length; createdAt = s.updatedAt || null; } catch (e) {}
      return { day, records, createdAt };
    });
  } catch (e) { return []; }
}

async function loadBackup(day) {
  if (pool) {
    const r = await pool.query('SELECT data FROM app_backups WHERE day = $1', [day]);
    return r.rows.length ? r.rows[0].data : null;
  }
  try { return JSON.parse(fs.readFileSync(path.join(BK_DIR, day + '.json'), 'utf8')); } catch (e) { return null; }
}

module.exports = { init, load, save, snapshot, listBackups, loadBackup };
