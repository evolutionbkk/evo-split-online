// Persistence: Postgres if DATABASE_URL is set (recommended on Railway), else a local JSON file.
'use strict';
const fs = require('fs');
const path = require('path');

const DATABASE_URL = process.env.DATABASE_URL;
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, 'data');
const FILE = path.join(DATA_DIR, 'state.json');

let pg = null;
let pool = null;

async function init() {
  if (DATABASE_URL) {
    pg = require('pg');
    pool = new pg.Pool({
      connectionString: DATABASE_URL,
      ssl: DATABASE_URL.includes('localhost') ? false : { rejectUnauthorized: false },
    });
    await pool.query('CREATE TABLE IF NOT EXISTS app_state (id INT PRIMARY KEY, data JSONB NOT NULL, updated_at TIMESTAMPTZ DEFAULT now())');
    console.log('[store] using Postgres');
  } else {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
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
  return payload;
}

module.exports = { init, load, save };
