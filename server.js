'use strict';
// build: seed.json restored to 376 records (2026-07-25) — redeploy trigger
const express = require('express');
const crypto = require('crypto');
const path = require('path');
const fs = require('fs');
const XLSX = require('xlsx');
const store = require('./store');
const S = require('./split');

const PORT = process.env.PORT || 3000;
const ADMIN_USER = process.env.ADMIN_USER || 'admin';
const ADMIN_PASS = process.env.ADMIN_PASS || '';
const SESSION_SECRET = process.env.SESSION_SECRET || 'dev-secret-change-me';
const INGEST_KEY = process.env.INGEST_KEY || '';

if (!ADMIN_PASS) console.warn('[warn] ADMIN_PASS is not set — set it in Railway Variables before going live.');
if (!INGEST_KEY) console.warn('[warn] INGEST_KEY is not set — the browser script cannot push data until you set one.');

let state = { assigned: [], maxRound: 1, updatedAt: null };
// relayed Evolution access (kept in memory only) so the web app can pull on demand
let evo = { token: null, facility: 'WebStoreWarehouse', updatedAt: null };
const EVO_API = 'https://app.evolutionecommerce.co.th:8443/api/person/getPersons/CUSTOMER/find';
function evoBody() {
  return {
    filter: { FACILITY_ID: evo.facility || 'WebStoreWarehouse' },
    paginator: { page: 1, pageSize: 100000, total: 0, pageSizes: [] },
    sorting: { column: 'PARTY_ID', direction: 'desc' },
    searchTerm: '', grouping: { selectedRowIds: {}, itemIds: [], selectAll: false },
  };
}
function mapItems(j) {
  return (j.items || []).map((it) => {
    const p = it.person || {};
    const name = [p.FIRST_NAME, p.MIDDLE_NAME, p.LAST_NAME].filter((x) => x && ('' + x).trim()).join(' ').trim();
    const phone = (it.telecomNumber && it.telecomNumber.CONTACT_NUMBER) || '';
    return { code: it.PARTY_ID, name, phone };
  });
}

async function boot() {
  await store.init();
  let s = await store.load();
  if (!s || !Array.isArray(s.assigned) || !s.assigned.length) {
    const seed = JSON.parse(fs.readFileSync(path.join(__dirname, 'seed.json'), 'utf8'));
    s = S.buildSeed(seed);
    s = await store.save(s);
    console.log('[boot] seeded base:', s.assigned.length, 'records');
  }
  state = s;
  console.log('[boot] loaded', state.assigned.length, 'records, maxRound', state.maxRound);
  try { await store.snapshot(state); } catch (e) { /* non-fatal */ }
}

// ---------- auth helpers ----------
function sign(val) {
  return crypto.createHmac('sha256', SESSION_SECRET).update(val).digest('base64url');
}
function makeToken() {
  const payload = Buffer.from(JSON.stringify({ u: ADMIN_USER, t: Date.now() })).toString('base64url');
  return payload + '.' + sign(payload);
}
function verifyToken(tok) {
  if (!tok || tok.indexOf('.') < 0) return false;
  const [payload, sig] = tok.split('.');
  if (sign(payload) !== sig) return false;
  try {
    const p = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    if (Date.now() - p.t > 1000 * 60 * 60 * 24 * 30) return false; // 30-day expiry
    return true;
  } catch (e) { return false; }
}
function parseCookies(req) {
  const out = {};
  const h = req.headers.cookie;
  if (!h) return out;
  h.split(';').forEach((c) => { const i = c.indexOf('='); if (i > 0) out[c.slice(0, i).trim()] = decodeURIComponent(c.slice(i + 1).trim()); });
  return out;
}
function isAuthed(req) { return verifyToken(parseCookies(req).sess); }
function requireAuth(req, res, next) {
  if (isAuthed(req)) return next();
  if (req.path.startsWith('/api/')) return res.status(401).json({ error: 'unauthorized' });
  return res.redirect('/login');
}

const app = express();
app.disable('x-powered-by');
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false, limit: '10mb' }));

// ---------- CORS for endpoints the browser script posts to (from the Evolution origin) ----------
const corsForScript = (req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-ingest-key');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
};
app.use('/api/ingest', corsForScript);
app.use('/api/token', corsForScript);

// ---------- auth routes ----------
app.get('/login', (req, res) => {
  if (isAuthed(req)) return res.redirect('/');
  res.sendFile(path.join(__dirname, 'login.html'));
});
app.post('/login', (req, res) => {
  const { username, password } = req.body || {};
  const okUser = crypto.timingSafeEqual(Buffer.from(String(username || '')), Buffer.from(ADMIN_USER)) ;
  const okPass = ADMIN_PASS && String(password || '').length === ADMIN_PASS.length &&
    crypto.timingSafeEqual(Buffer.from(String(password || '')), Buffer.from(ADMIN_PASS));
  if (okUser && okPass) {
    res.setHeader('Set-Cookie', `sess=${makeToken()}; HttpOnly; Path=/; Max-Age=${60 * 60 * 24 * 30}; SameSite=Lax; Secure`);
    return res.redirect('/');
  }
  res.status(401).sendFile(path.join(__dirname, 'login.html'));
});
app.post('/logout', (req, res) => {
  res.setHeader('Set-Cookie', 'sess=; HttpOnly; Path=/; Max-Age=0');
  res.redirect('/login');
});

// ---------- app ----------
app.get('/', requireAuth, (req, res) => res.sendFile(path.join(__dirname, 'app.html')));

app.get('/api/state', requireAuth, (req, res) => {
  res.json({
    total: state.assigned.length,
    maxRound: state.maxRound,
    updatedAt: state.updatedAt,
    newCount: state.assigned.filter((a) => !a.exported).length,
    W: S.listSide(state, 'W'),
    K: S.listSide(state, 'K'),
  });
});

// Push from browser script (auth via INGEST_KEY) OR from the logged-in admin.
app.post('/api/ingest', async (req, res) => {
  const keyOk = INGEST_KEY && req.headers['x-ingest-key'] === INGEST_KEY;
  if (!keyOk && !isAuthed(req)) return res.status(401).json({ error: 'bad key' });
  const customers = (req.body && req.body.customers) || [];
  if (!Array.isArray(customers)) return res.status(400).json({ error: 'customers must be an array' });
  const summary = S.applyNew(state, customers, req.body && req.body.label);
  state = await store.save(state);
  res.json({ ok: true, summary, total: state.assigned.length, W: S.listSide(state, 'W').length, K: S.listSide(state, 'K').length });
});

// Browser script relays the current Evolution access token so the web app can pull on demand.
app.post('/api/token', (req, res) => {
  const keyOk = INGEST_KEY && req.headers['x-ingest-key'] === INGEST_KEY;
  if (!keyOk) return res.status(401).json({ error: 'bad key' });
  const { token, facility } = req.body || {};
  if (token) evo.token = String(token);
  if (facility) evo.facility = String(facility);
  evo.updatedAt = new Date().toISOString();
  res.json({ ok: true, hasToken: !!evo.token, tokenUpdatedAt: evo.updatedAt });
});

// Admin clicks "pull latest": the server fetches from Evolution using the relayed token.
app.post('/api/pull', requireAuth, async (req, res) => {
  if (!evo.token) {
    return res.status(400).json({ error: 'no_token', message: 'ยังไม่ได้เชื่อมกับ Evolution — เปิดหน้าลูกค้าปลีก (ที่ติดตั้งสคริปต์) สักครั้งเพื่อส่ง token เข้ามา แล้วลองอีกครั้ง' });
  }
  try {
    const r = await fetch(EVO_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-access-token': evo.token },
      body: JSON.stringify(evoBody()),
    });
    if (r.status === 401 || r.status === 403) {
      return res.status(400).json({ error: 'token_expired', message: 'token หมดอายุ — เปิดหน้า Evolution ใหม่ (สคริปต์จะส่ง token ใหม่ให้อัตโนมัติ) แล้วกดอีกครั้ง' });
    }
    const j = await r.json();
    const customers = mapItems(j);
    const summary = S.applyNew(state, customers, req.body && req.body.label);
    state = await store.save(state);
    res.json({ ok: true, summary, pulled: customers.length, total: state.assigned.length, tokenAge: evo.updatedAt });
  } catch (e) {
    res.status(502).json({ error: 'pull_failed', message: 'ดึงจาก Evolution ไม่สำเร็จ: ' + String(e) });
  }
});

// tells the UI whether a pull is possible
app.get('/api/evo-status', requireAuth, (req, res) => {
  res.json({ hasToken: !!evo.token, tokenUpdatedAt: evo.updatedAt, facility: evo.facility });
});

// Manual paste/upload from the admin UI
app.post('/api/paste', requireAuth, async (req, res) => {
  const records = S.parseRows((req.body && req.body.text) || '');
  const summary = S.applyNew(state, records, req.body && req.body.label);
  state = await store.save(state);
  res.json({ ok: true, summary, total: state.assigned.length });
});

app.post('/api/reset', requireAuth, async (req, res) => {
  const seed = JSON.parse(fs.readFileSync(path.join(__dirname, 'seed.json'), 'utf8'));
  state = S.buildSeed(seed);
  state = await store.save(state);
  res.json({ ok: true, total: state.assigned.length });
});

// ---------- exports ----------
function csvFor(list) {
  const esc = (s) => { s = String(s == null ? '' : s); return /[",\r\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };
  const head = 'ลำดับ,รหัสสมาชิก,ชื่อ-นามสกุล,เบอร์โทรศัพท์,รอบที่ดึง,วันที่แบ่ง';
  return '﻿' + head + '\n' + list.map((r, i) => [i + 1, esc(r.code), esc(r.name), esc(r.phone), esc(S.roundName(r.round)), esc(r.date)].join(',')).join('\n');
}
app.get('/export/csv', requireAuth, (req, res) => {
  const side = req.query.side === 'K' ? 'K' : 'W';
  const list = S.listSide(state, side);
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="Sales_${side}_${list.length}.csv"`);
  res.send(csvFor(list));
});
app.get('/export/xlsx', requireAuth, (req, res) => {
  const W = S.listSide(state, 'W'), K = S.listSide(state, 'K');
  const mk = (list) => [['ลำดับ', 'รหัสสมาชิก', 'ชื่อ-นามสกุล', 'เบอร์โทรศัพท์', 'รอบที่ดึง', 'วันที่แบ่ง'],
    ...list.map((r, i) => [i + 1, r.code, r.name, r.phone, S.roundName(r.round), r.date])];
  const all = [['ลำดับ', 'รหัสสมาชิก', 'ชื่อ-นามสกุล', 'เบอร์โทรศัพท์', 'เซลล์', 'รอบที่ดึง', 'วันที่แบ่ง'],
    ...state.assigned.map((r, i) => [i + 1, r.code, r.name, r.phone, r.sales, S.roundName(r.round), r.date])];
  const wb = XLSX.utils.book_new();
  const wsW = XLSX.utils.aoa_to_sheet(mk(W)), wsK = XLSX.utils.aoa_to_sheet(mk(K)), wsA = XLSX.utils.aoa_to_sheet(all);
  wsW['!cols'] = wsK['!cols'] = [{ wch: 7 }, { wch: 15 }, { wch: 32 }, { wch: 16 }, { wch: 12 }, { wch: 14 }];
  wsA['!cols'] = [{ wch: 7 }, { wch: 15 }, { wch: 32 }, { wch: 16 }, { wch: 8 }, { wch: 12 }, { wch: 14 }];
  XLSX.utils.book_append_sheet(wb, wsW, 'Sales(W)');
  XLSX.utils.book_append_sheet(wb, wsK, 'Sales(K)');
  XLSX.utils.book_append_sheet(wb, wsA, 'ทั้งหมด');
  const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', 'attachment; filename="customers_W_K.xlsx"');
  res.send(buf);
});

// Download ONLY names not yet exported, then mark them as sent (so they won't be handed out again).
app.post('/export/new-xlsx', requireAuth, async (req, res) => {
  const fresh = state.assigned.filter((a) => !a.exported);
  if (!fresh.length) return res.status(200).json({ ok: false, empty: true, message: 'ไม่มีรายใหม่ที่ยังไม่เคยส่ง' });
  const W = fresh.filter((a) => a.sales === 'W'), K = fresh.filter((a) => a.sales === 'K');
  const mk = (list) => [['ลำดับ', 'รหัสสมาชิก', 'ชื่อ-นามสกุล', 'เบอร์โทรศัพท์', 'รอบที่ดึง', 'วันที่แบ่ง'],
    ...list.map((r, i) => [i + 1, r.code, r.name, r.phone, S.roundName(r.round), r.date])];
  const wb = XLSX.utils.book_new();
  const wsW = XLSX.utils.aoa_to_sheet(mk(W)), wsK = XLSX.utils.aoa_to_sheet(mk(K));
  wsW['!cols'] = wsK['!cols'] = [{ wch: 7 }, { wch: 15 }, { wch: 32 }, { wch: 16 }, { wch: 12 }, { wch: 14 }];
  XLSX.utils.book_append_sheet(wb, wsW, 'Sales(W)-ใหม่');
  XLSX.utils.book_append_sheet(wb, wsK, 'Sales(K)-ใหม่');
  const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
  // mark as sent
  fresh.forEach((a) => { a.exported = true; });
  state = await store.save(state);
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename="customers_new_${fresh.length}.xlsx"`);
  res.setHeader('X-New-Count', String(fresh.length));
  res.setHeader('X-New-W', String(W.length));
  res.setHeader('X-New-K', String(K.length));
  res.send(buf);
});

// Download ONLY the not-yet-sent names of ONE side as CSV, then mark just those as sent.
app.post('/export/new-csv', requireAuth, async (req, res) => {
  const side = req.query.side === 'K' ? 'K' : 'W';
  const fresh = state.assigned.filter((a) => !a.exported && a.sales === side);
  if (!fresh.length) return res.status(200).json({ ok: false, empty: true, message: 'ไม่มีรายใหม่ที่ยังไม่เคยส่งของฝั่ง ' + side });
  const csv = csvFor(fresh);
  fresh.forEach((a) => { a.exported = true; });
  state = await store.save(state);
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="Sales_${side}_new_${fresh.length}.csv"`);
  res.setHeader('X-New-Count', String(fresh.length));
  res.send(csv);
});

// Clear all "sent" marks (so the next "download new" gives everyone again).
app.post('/api/reset-exported', requireAuth, async (req, res) => {
  state.assigned.forEach((a) => { a.exported = false; });
  state = await store.save(state);
  res.json({ ok: true, newCount: state.assigned.length });
});

// ---------- backup / restore ----------
// Turn any loosely-shaped object (uploaded file, snapshot, or bare array) into a valid state.
function sanitizeState(obj) {
  const src = obj && Array.isArray(obj.assigned) ? obj.assigned : (Array.isArray(obj) ? obj : null);
  if (!src) return null;
  const assigned = [];
  let maxRound = 1;
  for (const r of src) {
    if (!r || typeof r !== 'object') continue;
    const round = Number(r.round) > 0 ? Number(r.round) : 1;
    if (round > maxRound) maxRound = round;
    assigned.push({
      code: String(r.code == null ? '' : r.code).trim(),
      name: String(r.name == null ? '' : r.name).trim(),
      phone: S.cleanPhone(r.phone),
      sales: r.sales === 'K' ? 'K' : 'W',
      round,
      date: r.date ? String(r.date) : '',
      exported: !!r.exported,
    });
  }
  const declared = obj && Number(obj.maxRound) > 0 ? Number(obj.maxRound) : 0;
  return { assigned, maxRound: Math.max(declared, maxRound) };
}

// Download a full backup of the current data (a single restorable JSON file).
app.get('/export/backup', requireAuth, (req, res) => {
  const p = (n) => String(n).padStart(2, '0');
  const d = new Date();
  const stamp = d.getFullYear() + p(d.getMonth() + 1) + p(d.getDate()) + '-' + p(d.getHours()) + p(d.getMinutes());
  const payload = { kind: 'evo-split-backup', version: 1, savedAt: new Date().toISOString(), maxRound: state.maxRound, count: state.assigned.length, assigned: state.assigned };
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="evo-backup-${stamp}.json"`);
  res.send(JSON.stringify(payload, null, 2));
});

// Restore from an uploaded backup file (replaces the current data).
app.post('/api/restore', requireAuth, async (req, res) => {
  const clean = sanitizeState(req.body && (req.body.backup || req.body));
  if (!clean || !clean.assigned.length) return res.status(400).json({ error: 'invalid_backup', message: 'ไฟล์สำรองไม่ถูกต้อง หรือไม่มีรายชื่อ' });
  state = await store.save({ assigned: clean.assigned, maxRound: clean.maxRound });
  res.json({ ok: true, total: state.assigned.length, W: S.listSide(state, 'W').length, K: S.listSide(state, 'K').length });
});

// List automatic daily backups.
app.get('/api/backups', requireAuth, async (req, res) => {
  res.json({ backups: await store.listBackups() });
});

// Restore a specific automatic daily backup.
app.post('/api/restore-backup', requireAuth, async (req, res) => {
  const day = req.body && req.body.day ? String(req.body.day) : '';
  const clean = sanitizeState(day ? await store.loadBackup(day) : null);
  if (!clean || !clean.assigned.length) return res.status(400).json({ error: 'not_found', message: 'ไม่พบไฟล์สำรองของวันนั้น หรือว่างเปล่า' });
  state = await store.save({ assigned: clean.assigned, maxRound: clean.maxRound });
  res.json({ ok: true, day, total: state.assigned.length, W: S.listSide(state, 'W').length, K: S.listSide(state, 'K').length });
});

app.get('/healthz', (req, res) => res.json({ ok: true, total: state.assigned.length }));

boot().then(() => {
  app.listen(PORT, () => console.log('[server] listening on', PORT));
}).catch((e) => { console.error('boot failed', e); process.exit(1); });
