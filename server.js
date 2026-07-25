'use strict';
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

// ---------- CORS for the ingest endpoint (browser script pushes from the Evolution origin) ----------
app.use('/api/ingest', (req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-ingest-key');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

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

app.get('/healthz', (req, res) => res.json({ ok: true, total: state.assigned.length }));

boot().then(() => {
  app.listen(PORT, () => console.log('[server] listening on', PORT));
}).catch((e) => { console.error('boot failed', e); process.exit(1); });
