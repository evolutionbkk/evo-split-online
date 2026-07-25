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
// Per-salesperson logins (passwords set in Railway Variables; empty pass = login disabled)
const SALES = {
  W: { user: process.env.SALES_W_USER || 'salesW', pass: process.env.SALES_W_PASS || '' },
  K: { user: process.env.SALES_K_USER || 'salesK', pass: process.env.SALES_K_PASS || '' },
};

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
  // backfill receivedAt (staleness clock) for leads that predate this field
  let bf = false;
  for (const rec of state.assigned) { if (!rec.receivedAt) { rec.receivedAt = rec.updatedAt || new Date().toISOString(); bf = true; } }
  if (bf) state = await store.save(state);
  console.log('[boot] loaded', state.assigned.length, 'records, maxRound', state.maxRound);
  try { await store.snapshot(state); } catch (e) { /* non-fatal */ }
}

// ---------- auth helpers ----------
function sign(val) {
  return crypto.createHmac('sha256', SESSION_SECRET).update(val).digest('base64url');
}
function safeEq(a, b) {
  a = String(a == null ? '' : a); b = String(b == null ? '' : b);
  if (a.length !== b.length) return false;
  try { return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b)); } catch (e) { return false; }
}
function makeToken(u, role, side) {
  const payload = Buffer.from(JSON.stringify({ u, r: role, s: side || '', t: Date.now() })).toString('base64url');
  return payload + '.' + sign(payload);
}
function readSession(req) {
  const tok = parseCookies(req).sess;
  if (!tok || tok.indexOf('.') < 0) return null;
  const [payload, sig] = tok.split('.');
  if (sign(payload) !== sig) return null;
  try {
    const p = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    if (Date.now() - p.t > 1000 * 60 * 60 * 24 * 30) return null; // 30-day expiry
    return { u: p.u, role: p.r || 'admin', side: p.s || '' }; // pre-role tokens => admin
  } catch (e) { return null; }
}
function parseCookies(req) {
  const out = {};
  const h = req.headers.cookie;
  if (!h) return out;
  h.split(';').forEach((c) => { const i = c.indexOf('='); if (i > 0) out[c.slice(0, i).trim()] = decodeURIComponent(c.slice(i + 1).trim()); });
  return out;
}
function isAuthed(req) { return !!readSession(req); }
function apiPath(req) { return req.path.startsWith('/api/') || req.path.startsWith('/export/'); }
// requireAuth = ADMIN ONLY (name kept so existing admin routes stay admin-only)
function requireAuth(req, res, next) {
  const s = readSession(req);
  if (!s) return apiPath(req) ? res.status(401).json({ error: 'unauthorized' }) : res.redirect('/login');
  req.session = s;
  if (s.role !== 'admin') return apiPath(req) ? res.status(403).json({ error: 'forbidden' }) : res.redirect('/sales');
  next();
}
// requireLogin = any logged-in user (admin or salesperson)
function requireLogin(req, res, next) {
  const s = readSession(req);
  if (!s) return apiPath(req) ? res.status(401).json({ error: 'unauthorized' }) : res.redirect('/login');
  req.session = s; next();
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
  let role = null, side = '', user = null;
  if (ADMIN_PASS && safeEq(username, ADMIN_USER) && safeEq(password, ADMIN_PASS)) { role = 'admin'; user = ADMIN_USER; }
  else if (SALES.W.pass && safeEq(username, SALES.W.user) && safeEq(password, SALES.W.pass)) { role = 'sales'; side = 'W'; user = SALES.W.user; }
  else if (SALES.K.pass && safeEq(username, SALES.K.user) && safeEq(password, SALES.K.pass)) { role = 'sales'; side = 'K'; user = SALES.K.user; }
  if (role) {
    res.setHeader('Set-Cookie', `sess=${makeToken(user, role, side)}; HttpOnly; Path=/; Max-Age=${60 * 60 * 24 * 30}; SameSite=Lax; Secure`);
    return res.redirect(role === 'admin' ? '/' : '/sales');
  }
  res.status(401).sendFile(path.join(__dirname, 'login.html'));
});
app.post('/logout', (req, res) => {
  res.setHeader('Set-Cookie', 'sess=; HttpOnly; Path=/; Max-Age=0');
  res.redirect('/login');
});

// ---------- read-only per-salesperson share links (no login; secret token per side) ----------
function viewToken(side) {
  return crypto.createHmac('sha256', SESSION_SECRET).update('view:' + side).digest('hex').slice(0, 24);
}
function checkView(side, t) {
  const s = side === 'K' ? 'K' : (side === 'W' ? 'W' : null);
  return (s && t && t === viewToken(s)) ? s : null;
}
app.get('/view/:side', (req, res) => {
  if (!checkView(req.params.side, req.query.t)) return res.status(403).send('ลิงก์ไม่ถูกต้องหรือถูกยกเลิกแล้ว');
  res.sendFile(path.join(__dirname, 'view.html'));
});
app.get('/api/view-data', (req, res) => {
  const side = checkView(req.query.side, req.query.t);
  if (!side) return res.status(403).json({ error: 'forbidden' });
  const list = S.listSide(state, side).map((r) => ({ code: r.code, name: r.name, phone: r.phone, round: r.round, date: r.date }));
  res.json({ side, updatedAt: state.updatedAt, count: list.length, list });
});
app.get('/view-csv/:side', (req, res) => {
  const side = checkView(req.params.side, req.query.t);
  if (!side) return res.status(403).send('forbidden');
  const list = S.listSide(state, side);
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="Sales_${side}_${list.length}.csv"`);
  res.send(csvFor(list));
});
app.get('/api/share-links', requireAuth, (req, res) => {
  const base = (req.headers['x-forwarded-proto'] || req.protocol) + '://' + req.headers.host;
  res.json({ W: base + '/view/W?t=' + viewToken('W'), K: base + '/view/K?t=' + viewToken('K') });
});

// ---------- app ----------
app.get('/', requireAuth, (req, res) => res.sendFile(path.join(__dirname, 'app.html')));
app.get('/sales', requireLogin, (req, res) => res.sendFile(path.join(__dirname, 'sales.html')));

app.get('/api/state', requireAuth, async (req, res) => {
  await runSweep();
  res.json({
    total: state.assigned.length,
    maxRound: state.maxRound,
    updatedAt: state.updatedAt,
    newCount: state.assigned.filter((a) => !a.exported && !a.archived).length,
    W: S.listSide(state, 'W'),
    K: S.listSide(state, 'K'),
    archivedCount: state.assigned.filter((a) => a.archived).length,
  });
});

// ---------- lead CRM (per-salesperson status tracking) ----------
const UNREACH_REASONS = ['ไม่สะดวกคุย', 'ไม่รับสาย', 'ปิดเครื่อง', 'พบช่องทางอื่นที่ถูกกว่า', 'สะดวกสั่งซื้อช่องทางอื่น'];
const REACH_STATUS = ['not_ready', 'appointment', 'closed'];
const ARCH_REASONS = ['unreachable', 'bad_data'];
// New CRM taxonomy (replaces the old reachStatus/contact model in the UI; legacy fields kept for back-compat)
const LEAD_STATUS_KEYS = ['new', 'contacting', 'interested', 'followup', 'won', 'lost'];
const CALL_RESULT_KEYS = ['no_answer', 'connected', 'hung_up', 'wrong_number'];
const INTEREST_KEYS = ['hot', 'warm', 'cold'];
const NEXT_ACTION_KEYS = ['callback', 'send_info', 'meeting'];
const LOST_REASONS = ['ราคาแพง', 'ซื้อที่อื่น', 'ไม่มีงบ', 'ติดต่อไม่ได้', 'ไม่สนใจ', 'อื่นๆ'];
// Derive a Lead Status for records that predate this field (maps the old model onto the new one).
function recStatus(rec) {
  if (rec.leadStatus && LEAD_STATUS_KEYS.includes(rec.leadStatus)) return rec.leadStatus;
  if (rec.reachStatus === 'closed') return 'won';
  if (rec.reachStatus === 'appointment') return 'followup';
  if (rec.reachStatus === 'not_ready') return 'interested';
  if (rec.contact === 'reached') return 'contacting';
  if (rec.contact === 'unreachable') return 'contacting';
  return 'new';
}
function lastCallOf(rec) {
  if (rec.lastCallAt) return rec.lastCallAt;
  const c = rec.calls || [];
  return c.length ? (c[c.length - 1].at || '') : '';
}
function leadView(r) {
  return {
    key: S.keyOf(r), code: r.code, name: r.name, phone: r.phone, sales: r.sales, round: r.round, date: r.date,
    exported: !!r.exported,
    callCount: r.callCount || 0, calls: r.calls || [], lastCallAt: lastCallOf(r),
    contact: r.contact || '', unreachableReason: r.unreachableReason || '',
    reachStatus: r.reachStatus || '', line: r.line || '', nextAppt: r.nextAppt || '', note: r.note || '',
    leadStatus: recStatus(r), callResult: r.callResult || '', interest: r.interest || '',
    nextAction: r.nextAction || '', lostReason: r.lostReason || '',
    archived: !!r.archived, archiveReason: r.archiveReason || '', archivedAt: r.archivedAt || null,
    stage: r.stage || 0, handoffCount: (r.handoffs || []).length,
    updatedAt: r.updatedAt || null, updatedBy: r.updatedBy || '',
    lastActivity: r.updatedAt || r.receivedAt || null,
  };
}
// Lead recycling: after 3 calls without closing (and not an active appointment),
// hand off to the other salesperson once; if it fails again, move to the "คัดออกถาวร" bin.
const FOLLOW_ROUNDS = 3; // calls before advancing
const STALE_DAYS = 7;    // no-activity days before auto hand-off
// Move a lead one stage: 1st hand -> transfer to the other side; 2nd hand -> คัดออกถาวร bin.
function advanceStage(rec) {
  const stage = rec.stage || 0;
  if (stage === 0) {
    const from = rec.sales, to = rec.sales === 'W' ? 'K' : 'W';
    rec.sales = to; rec.stage = 1;
    rec.handoffs = rec.handoffs || []; rec.handoffs.push({ from, to, at: new Date().toISOString() });
    // fresh start for the receiving salesperson (keep note + line as context)
    rec.callCount = 0; rec.calls = []; rec.contact = ''; rec.reachStatus = ''; rec.unreachableReason = ''; rec.nextAppt = '';
    rec.leadStatus = 'new'; rec.callResult = ''; rec.interest = ''; rec.nextAction = ''; rec.lostReason = ''; rec.lastCallAt = '';
    rec.receivedAt = new Date().toISOString();
    return { action: 'transferred', from, to };
  }
  rec.archived = true; rec.archiveReason = 'recycled_out'; rec.archivedAt = new Date().toISOString();
  return { action: 'recycled_out' };
}
// Auto rule: after 3 calls without closing (won) and not an active follow-up.
function maybeRecycle(rec) {
  if (rec.archived) return null;
  const st = recStatus(rec);
  if (st === 'won') return null;       // closed the sale — stop
  if (st === 'followup') return null;  // has a scheduled follow-up — hold (stale sweep covers overdue ones)
  if ((rec.callCount || 0) < FOLLOW_ROUNDS) return null;
  return advanceStage(rec);
}
function lastActivityMs(rec) {
  const la = rec.updatedAt || rec.receivedAt; if (!la) return null;
  const t = Date.parse(la); return isNaN(t) ? null : t;
}
// Safety net: auto-advance leads untouched for STALE_DAYS (skip closed & future appointments).
async function runSweep() {
  const now = Date.now(); let changed = false;
  for (const rec of state.assigned) {
    if (rec.archived) continue;
    const st = recStatus(rec);
    if (st === 'won') continue;
    if (st === 'followup' && rec.nextAppt) { const t = Date.parse(rec.nextAppt); if (!isNaN(t) && t > now) continue; }
    const la = lastActivityMs(rec); if (la == null) continue;
    if (now - la > STALE_DAYS * 86400000) { advanceStage(rec); changed = true; }
  }
  if (changed) state = await store.save(state);
  return changed;
}
function leadFor(req, key) {
  const rec = state.assigned.find((r) => S.keyOf(r) === key);
  if (!rec) return null;
  if (req.session.role === 'sales' && rec.sales !== req.session.side) return null; // scope
  return rec;
}
function whoami(req) { return req.session.role === 'admin' ? 'admin' : req.session.side; }

app.get('/api/me', requireLogin, (req, res) => res.json({ role: req.session.role, side: req.session.side || null, user: req.session.u }));

app.get('/api/leads', requireLogin, async (req, res) => {
  await runSweep();
  const side = req.session.role === 'sales' ? req.session.side : (req.query.side === 'K' ? 'K' : (req.query.side === 'W' ? 'W' : null));
  let list = state.assigned;
  if (side) list = list.filter((r) => r.sales === side);
  res.json({
    role: req.session.role, side: side || null,
    active: list.filter((r) => !r.archived).map(leadView),
    archived: list.filter((r) => r.archived).map(leadView),
  });
});

app.post('/api/lead/call', requireLogin, async (req, res) => {
  const rec = leadFor(req, req.body && req.body.key);
  if (!rec) return res.status(404).json({ error: 'not_found' });
  const nowIso = new Date().toISOString();
  rec.calls = rec.calls || []; rec.calls.push({ at: nowIso, by: whoami(req) });
  rec.callCount = (rec.callCount || 0) + 1;
  rec.lastCallAt = nowIso;
  rec.updatedAt = nowIso; rec.updatedBy = whoami(req);
  const advanced = maybeRecycle(rec);
  state = await store.save(state);
  res.json({ ok: true, lead: leadView(rec), advanced });
});

app.post('/api/lead/update', requireLogin, async (req, res) => {
  const rec = leadFor(req, req.body && req.body.key);
  if (!rec) return res.status(404).json({ error: 'not_found' });
  const p = (req.body && req.body.patch) || {};
  // new CRM taxonomy
  if ('leadStatus' in p) rec.leadStatus = LEAD_STATUS_KEYS.includes(p.leadStatus) ? p.leadStatus : rec.leadStatus;
  if ('callResult' in p) rec.callResult = (p.callResult === '' || CALL_RESULT_KEYS.includes(p.callResult)) ? p.callResult : rec.callResult;
  if ('interest' in p) rec.interest = (p.interest === '' || INTEREST_KEYS.includes(p.interest)) ? p.interest : rec.interest;
  if ('nextAction' in p) rec.nextAction = (p.nextAction === '' || NEXT_ACTION_KEYS.includes(p.nextAction)) ? p.nextAction : rec.nextAction;
  if ('lostReason' in p) rec.lostReason = (p.lostReason === '' || LOST_REASONS.includes(p.lostReason)) ? p.lostReason : rec.lostReason;
  // shared / legacy fields
  if ('contact' in p) rec.contact = ['reached', 'unreachable', ''].includes(p.contact) ? p.contact : rec.contact;
  if ('unreachableReason' in p) rec.unreachableReason = UNREACH_REASONS.includes(p.unreachableReason) ? p.unreachableReason : '';
  if ('reachStatus' in p) rec.reachStatus = REACH_STATUS.includes(p.reachStatus) ? p.reachStatus : '';
  if ('line' in p) rec.line = ['added', 'not_added', ''].includes(p.line) ? p.line : rec.line;
  if ('nextAppt' in p) rec.nextAppt = String(p.nextAppt || '').slice(0, 40);
  if ('note' in p) rec.note = String(p.note || '').slice(0, 2000);
  if ('callCount' in p) rec.callCount = Math.max(0, Math.min(99, parseInt(p.callCount, 10) || 0));
  rec.updatedAt = new Date().toISOString(); rec.updatedBy = whoami(req);
  // Note: field edits do NOT auto-recycle — only real call logs (/api/lead/call) and the stale sweep do.
  state = await store.save(state);
  res.json({ ok: true, lead: leadView(rec), advanced: null });
});

app.post('/api/lead/archive', requireLogin, async (req, res) => {
  const rec = leadFor(req, req.body && req.body.key);
  if (!rec) return res.status(404).json({ error: 'not_found' });
  rec.archived = true;
  rec.archiveReason = ARCH_REASONS.includes(req.body && req.body.reason) ? req.body.reason : 'bad_data';
  rec.archivedAt = new Date().toISOString(); rec.updatedAt = rec.archivedAt; rec.updatedBy = whoami(req);
  state = await store.save(state);
  res.json({ ok: true });
});

app.post('/api/lead/restore', requireLogin, async (req, res) => {
  const rec = leadFor(req, req.body && req.body.key);
  if (!rec) return res.status(404).json({ error: 'not_found' });
  rec.archived = false; rec.archiveReason = ''; rec.archivedAt = null;
  rec.updatedAt = new Date().toISOString(); rec.updatedBy = whoami(req);
  state = await store.save(state);
  res.json({ ok: true });
});

// Manual hand-off: force-advance one stage now (skip the 3-round wait).
app.post('/api/lead/advance', requireLogin, async (req, res) => {
  const rec = leadFor(req, req.body && req.body.key);
  if (!rec) return res.status(404).json({ error: 'not_found' });
  if (rec.archived) return res.status(400).json({ error: 'already_removed' });
  const advanced = advanceStage(rec);
  rec.updatedBy = whoami(req);
  state = await store.save(state);
  res.json({ ok: true, advanced, lead: leadView(rec) });
});

// Push from browser script (auth via INGEST_KEY) OR from the logged-in admin.
app.post('/api/ingest', async (req, res) => {
  const keyOk = INGEST_KEY && req.headers['x-ingest-key'] === INGEST_KEY;
  const adminOk = (readSession(req) || {}).role === 'admin';
  if (!keyOk && !adminOk) return res.status(401).json({ error: 'bad key' });
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
    ...state.assigned.filter((a) => !a.archived).map((r, i) => [i + 1, r.code, r.name, r.phone, r.sales, S.roundName(r.round), r.date])];
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
  const fresh = state.assigned.filter((a) => !a.exported && !a.archived);
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
  const fresh = state.assigned.filter((a) => !a.exported && !a.archived && a.sales === side);
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
  setInterval(() => { runSweep().catch(() => {}); }, 60 * 60 * 1000); // hourly stale sweep
}).catch((e) => { console.error('boot failed', e); process.exit(1); });
