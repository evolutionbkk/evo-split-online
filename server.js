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
// Admin Sales (Lyla): distributes FB-chat leads to Telesales; does NOT see the team's CRM/KPI.
const ADMINSALES = { user: process.env.ADMINSALES_USER || 'adminsales', pass: process.env.ADMINSALES_PASS || '' };

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
  // Seed ONLY when there is no saved state at all (brand-new DB). An intentionally
  // emptied state (assigned:[]) is respected so "start from zero" survives restarts.
  if (!s || !Array.isArray(s.assigned)) {
    const seed = JSON.parse(fs.readFileSync(path.join(__dirname, 'seed.json'), 'utf8'));
    s = S.buildSeed(seed);
    s = await store.save(s);
    console.log('[boot] seeded base:', s.assigned.length, 'records');
  }
  state = s;
  // backfill receivedAt (staleness clock) for leads that predate this field
  let bf = false;
  for (const rec of state.assigned) { if (!rec.receivedAt) { rec.receivedAt = rec.updatedAt || new Date().toISOString(); bf = true; } }
  if (!Array.isArray(state.onecall)) state.onecall = [];
  if (!Array.isArray(state.pulls)) state.pulls = [];
  // Pancake baseline: set once, so we only forward orders CLOSED from now on (no 1,375 backfill).
  if (!state.pancake) { state.pancake = { startedAt: new Date().toISOString(), seen: [], lastRun: null, lastAdded: 0, lastError: null }; bf = true; }
  if (bf) state = await store.save(state);
  console.log('[boot] loaded', state.assigned.length, 'records, maxRound', state.maxRound, '· onecall', state.onecall.length);
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
// requireDistributor = Teamlead (admin) OR Admin Sales (adminsales) — can distribute leads
function requireDistributor(req, res, next) {
  const s = readSession(req);
  if (!s) return apiPath(req) ? res.status(401).json({ error: 'unauthorized' }) : res.redirect('/login');
  req.session = s;
  if (s.role !== 'admin' && s.role !== 'adminsales') return apiPath(req) ? res.status(403).json({ error: 'forbidden' }) : res.redirect('/sales');
  next();
}
// requireCrm = Teamlead (admin) OR Telesales (sales) — the lead CRM. Admin Sales (adminsales) is BLOCKED
// so a distributor never sees the team's customer statuses/notes.
function requireCrm(req, res, next) {
  const s = readSession(req);
  if (!s) return apiPath(req) ? res.status(401).json({ error: 'unauthorized' }) : res.redirect('/login');
  req.session = s;
  if (s.role !== 'admin' && s.role !== 'sales') return apiPath(req) ? res.status(403).json({ error: 'forbidden' }) : res.redirect('/distribute');
  next();
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
app.use('/api/onecall/ingest', corsForScript);
app.use('/api/onecall/token', corsForScript);

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
  else if (ADMINSALES.pass && safeEq(username, ADMINSALES.user) && safeEq(password, ADMINSALES.pass)) { role = 'adminsales'; user = ADMINSALES.user; }
  if (role) {
    res.setHeader('Set-Cookie', `sess=${makeToken(user, role, side)}; HttpOnly; Path=/; Max-Age=${60 * 60 * 24 * 30}; SameSite=Lax; Secure`);
    const dest = role === 'admin' ? '/' : (role === 'adminsales' ? '/distribute' : '/sales');
    return res.redirect(dest);
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
app.get('/distribute', requireDistributor, (req, res) => res.sendFile(path.join(__dirname, 'distribute.html')));

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
// Sale line items captured when a lead is Won: [{name, price}]
function sanitizeSaleItems(v) {
  if (!Array.isArray(v)) return [];
  const out = [];
  for (const it of v) {
    if (!it || typeof it !== 'object') continue;
    const name = String(it.name == null ? '' : it.name).trim().slice(0, 120);
    let price = Number(it.price); if (!isFinite(price) || price < 0) price = 0;
    if (!name && !price) continue;
    out.push({ name, price: Math.round(price * 100) / 100 });
    if (out.length >= 50) break;
  }
  return out;
}
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
// Append an activity event to the lead's timeline (kept to the last 100).
function pushHist(rec, k, v, by) {
  rec.history = rec.history || [];
  rec.history.push({ at: new Date().toISOString(), by: by || '', k, v: v == null ? '' : String(v).slice(0, 120) });
  if (rec.history.length > 100) rec.history = rec.history.slice(-100);
}
function leadView(r, ocMap) {
  const oc = ocMap ? ocMap.get(r.sales + '|' + digitsOnly(r.phone)) : null;
  return {
    key: S.keyOf(r), code: r.code, name: r.name, phone: r.phone, sales: r.sales, round: r.round, date: r.date,
    realCalls: oc ? oc.calls : 0, realTalkCalls: oc ? oc.talk : 0, realLastCallAt: oc ? oc.lastAt : null,
    exported: !!r.exported,
    callCount: r.callCount || 0, calls: r.calls || [], lastCallAt: lastCallOf(r),
    contact: r.contact || '', unreachableReason: r.unreachableReason || '',
    reachStatus: r.reachStatus || '', line: r.line || '', nextAppt: r.nextAppt || '', note: r.note || '', address: r.address || '',
    leadStatus: recStatus(r), callResult: r.callResult || '', interest: r.interest || '',
    nextAction: r.nextAction || '', lostReason: r.lostReason || '', saleItems: r.saleItems || [],
    source: r.source || 'evolution', step: r.step || '', product: r.product || '',
    orderAmount: r.orderAmount || 0, page: r.page || '', closer: r.closer || '', lastOrderAt: r.lastOrderAt || null,
    history: (r.history || []).slice(-40),
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
function advanceStage(rec, by) {
  const stage = rec.stage || 0;
  if (stage === 0) {
    const from = rec.sales, to = rec.sales === 'W' ? 'K' : 'W';
    rec.sales = to; rec.stage = 1;
    rec.handoffs = rec.handoffs || []; rec.handoffs.push({ from, to, at: new Date().toISOString() });
    // fresh start for the receiving salesperson (keep note + line as context)
    rec.callCount = 0; rec.calls = []; rec.contact = ''; rec.reachStatus = ''; rec.unreachableReason = ''; rec.nextAppt = '';
    rec.leadStatus = 'new'; rec.callResult = ''; rec.interest = ''; rec.nextAction = ''; rec.lostReason = ''; rec.lastCallAt = ''; rec.saleItems = [];
    rec.receivedAt = new Date().toISOString();
    pushHist(rec, 'transfer', to, by || 'ระบบ');
    return { action: 'transferred', from, to };
  }
  rec.archived = true; rec.archiveReason = 'recycled_out'; rec.archivedAt = new Date().toISOString();
  pushHist(rec, 'recycle', '', by || 'ระบบ');
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

app.get('/api/leads', requireCrm, async (req, res) => {
  await runSweep();
  const side = req.session.role === 'sales' ? req.session.side : (req.query.side === 'K' ? 'K' : (req.query.side === 'W' ? 'W' : null));
  let list = state.assigned;
  if (side) list = list.filter((r) => r.sales === side);
  const ocMap = onecallStatsMap();
  res.json({
    role: req.session.role, side: side || null,
    active: list.filter((r) => !r.archived).map((r) => leadView(r, ocMap)),
    archived: list.filter((r) => r.archived).map((r) => leadView(r, ocMap)),
  });
});

app.post('/api/lead/call', requireCrm, async (req, res) => {
  const rec = leadFor(req, req.body && req.body.key);
  if (!rec) return res.status(404).json({ error: 'not_found' });
  const nowIso = new Date().toISOString();
  rec.calls = rec.calls || []; rec.calls.push({ at: nowIso, by: whoami(req) });
  rec.callCount = (rec.callCount || 0) + 1;
  rec.lastCallAt = nowIso;
  rec.updatedAt = nowIso; rec.updatedBy = whoami(req);
  pushHist(rec, 'call', '', whoami(req));
  const advanced = maybeRecycle(rec);
  state = await store.save(state);
  res.json({ ok: true, lead: leadView(rec), advanced });
});

app.post('/api/lead/update', requireCrm, async (req, res) => {
  const rec = leadFor(req, req.body && req.body.key);
  if (!rec) return res.status(404).json({ error: 'not_found' });
  const p = (req.body && req.body.patch) || {};
  const by = whoami(req);
  // snapshot for the activity timeline
  const b0 = { leadStatus: recStatus(rec), callResult: rec.callResult || '', interest: rec.interest || '', nextAction: rec.nextAction || '', lostReason: rec.lostReason || '', nextAppt: rec.nextAppt || '', note: rec.note || '', name: rec.name || '', address: rec.address || '', callCount: rec.callCount || 0, saleN: (rec.saleItems || []).length };
  // new CRM taxonomy
  if ('leadStatus' in p) rec.leadStatus = LEAD_STATUS_KEYS.includes(p.leadStatus) ? p.leadStatus : rec.leadStatus;
  if ('callResult' in p) rec.callResult = (p.callResult === '' || CALL_RESULT_KEYS.includes(p.callResult)) ? p.callResult : rec.callResult;
  if ('interest' in p) rec.interest = (p.interest === '' || INTEREST_KEYS.includes(p.interest)) ? p.interest : rec.interest;
  if ('nextAction' in p) rec.nextAction = (p.nextAction === '' || NEXT_ACTION_KEYS.includes(p.nextAction)) ? p.nextAction : rec.nextAction;
  if ('lostReason' in p) rec.lostReason = (p.lostReason === '' || LOST_REASONS.includes(p.lostReason)) ? p.lostReason : rec.lostReason;
  if ('saleItems' in p) rec.saleItems = sanitizeSaleItems(p.saleItems);
  // shared / legacy fields
  if ('contact' in p) rec.contact = ['reached', 'unreachable', ''].includes(p.contact) ? p.contact : rec.contact;
  if ('unreachableReason' in p) rec.unreachableReason = UNREACH_REASONS.includes(p.unreachableReason) ? p.unreachableReason : '';
  if ('reachStatus' in p) rec.reachStatus = REACH_STATUS.includes(p.reachStatus) ? p.reachStatus : '';
  if ('line' in p) rec.line = ['added', 'not_added', ''].includes(p.line) ? p.line : rec.line;
  if ('nextAppt' in p) rec.nextAppt = String(p.nextAppt || '').slice(0, 40);
  if ('name' in p) rec.name = String(p.name || '').trim().slice(0, 200);
  if ('note' in p) rec.note = String(p.note || '').slice(0, 2000);
  if ('address' in p) rec.address = String(p.address || '').slice(0, 500);
  if ('callCount' in p) rec.callCount = Math.max(0, Math.min(99, parseInt(p.callCount, 10) || 0));
  rec.updatedAt = new Date().toISOString(); rec.updatedBy = by;
  // log each meaningful change to the timeline
  if (recStatus(rec) !== b0.leadStatus) pushHist(rec, 'status', rec.leadStatus, by);
  if ((rec.callResult || '') !== b0.callResult) pushHist(rec, 'result', rec.callResult, by);
  if ((rec.interest || '') !== b0.interest) pushHist(rec, 'interest', rec.interest, by);
  if ((rec.nextAction || '') !== b0.nextAction) pushHist(rec, 'action', rec.nextAction, by);
  if ((rec.lostReason || '') !== b0.lostReason) pushHist(rec, 'lost', rec.lostReason, by);
  if ((rec.nextAppt || '') !== b0.nextAppt) pushHist(rec, 'followup', rec.nextAppt, by);
  if ((rec.note || '') !== b0.note) pushHist(rec, 'note', '', by);
  if ((rec.name || '') !== b0.name) pushHist(rec, 'name', rec.name, by);
  if ((rec.address || '') !== b0.address) pushHist(rec, 'address', '', by);
  if ((rec.callCount || 0) !== b0.callCount) pushHist(rec, 'calls', rec.callCount, by);
  if ((rec.saleItems || []).length !== b0.saleN) pushHist(rec, 'sale', (rec.saleItems || []).length, by);
  // Note: field edits do NOT auto-recycle — only real call logs (/api/lead/call) and the stale sweep do.
  state = await store.save(state);
  res.json({ ok: true, lead: leadView(rec), advanced: null });
});

app.post('/api/lead/archive', requireCrm, async (req, res) => {
  const rec = leadFor(req, req.body && req.body.key);
  if (!rec) return res.status(404).json({ error: 'not_found' });
  rec.archived = true;
  rec.archiveReason = ARCH_REASONS.includes(req.body && req.body.reason) ? req.body.reason : 'bad_data';
  rec.archivedAt = new Date().toISOString(); rec.updatedAt = rec.archivedAt; rec.updatedBy = whoami(req);
  pushHist(rec, 'archive', rec.archiveReason, whoami(req));
  state = await store.save(state);
  res.json({ ok: true });
});

app.post('/api/lead/restore', requireCrm, async (req, res) => {
  const rec = leadFor(req, req.body && req.body.key);
  if (!rec) return res.status(404).json({ error: 'not_found' });
  rec.archived = false; rec.archiveReason = ''; rec.archivedAt = null;
  rec.updatedAt = new Date().toISOString(); rec.updatedBy = whoami(req);
  pushHist(rec, 'restore', '', whoami(req));
  state = await store.save(state);
  res.json({ ok: true });
});

// Manual hand-off: force-advance one stage now (skip the 3-round wait).
app.post('/api/lead/advance', requireCrm, async (req, res) => {
  const rec = leadFor(req, req.body && req.body.key);
  if (!rec) return res.status(404).json({ error: 'not_found' });
  if (rec.archived) return res.status(400).json({ error: 'already_removed' });
  const advanced = advanceStage(rec, whoami(req));
  rec.updatedBy = whoami(req);
  state = await store.save(state);
  res.json({ ok: true, advanced, lead: leadView(rec) });
});

// Record a salesperson's lead pull (Evolution intake) into the daily log (one row per side per Thai-day).
function recordPull(side, n) {
  if (!n || (side !== 'W' && side !== 'K')) return;
  if (!Array.isArray(state.pulls)) state.pulls = [];
  const day = S.thaiDay();
  const e = state.pulls.find((p) => p.side === side && p.day === day);
  if (e) { e.count += n; e.at = new Date().toISOString(); }
  else state.pulls.push({ side, day, count: n, at: new Date().toISOString() });
  if (state.pulls.length > 3000) state.pulls = state.pulls.slice(-3000);
}
// Teamlead: the salespeople's pull log (date · Namwhan · Khem · total).
app.get('/api/pulls', requireAuth, (req, res) => {
  const byDay = {};
  for (const p of (state.pulls || [])) {
    if (!byDay[p.day]) byDay[p.day] = { day: p.day, W: 0, K: 0, at: p.at };
    byDay[p.day][p.side] += p.count;
    if (p.at > byDay[p.day].at) byDay[p.day].at = p.at;
  }
  const days = Object.values(byDay).sort((a, b) => b.day.localeCompare(a.day)).slice(0, 90)
    .map((d) => ({ day: d.day, W: d.W, K: d.K, total: d.W + d.K, at: d.at }));
  res.json({ names: SALES_NAMES, days });
});

// Push from browser script (auth via INGEST_KEY) OR from the logged-in admin.
app.post('/api/ingest', async (req, res) => {
  const keyOk = INGEST_KEY && req.headers['x-ingest-key'] === INGEST_KEY;
  const adminOk = (readSession(req) || {}).role === 'admin';
  if (!keyOk && !adminOk) return res.status(401).json({ error: 'bad key' });
  const customers = (req.body && req.body.customers) || [];
  if (!Array.isArray(customers)) return res.status(400).json({ error: 'customers must be an array' });
  const summary = S.applyNew(state, customers, req.body && req.body.label, { dailyCapPerSide: EVO_DAILY_PER_SIDE });
  recordPull('W', summary.addW); recordPull('K', summary.addK);
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

// ---------- OneCall (DTAC voice recordings) → real talk-time KPI ----------
// The Telesales lines. Calls longer than 7s count as "talked to the customer".
const ONECALL_LINES = { '66948880324': 'W', '66948880326': 'K' };
const ONECALL_MIN_TALK = 7;   // seconds; > this counts toward KPI
const ONECALL_MAX = 60000;    // cap stored call records
// Daily call targets per Telesales (adjustable via Railway Variables)
const KPI_TARGET_EVO = Number(process.env.KPI_EVO_TARGET) || 50;     // Evolution database calls / day
const KPI_TARGET_MANUAL = Number(process.env.KPI_MANUAL_TARGET) || 15; // FB + Follow-up calls/day (T1+T2+T3 = 5+5+5, counted per call)
const KPI_TARGET_REV = Number(process.env.KPI_REV_TARGET) || 0;        // sales revenue target for the selected range (0 = no target bar)
// Evolution pull quota: new leads handed to EACH Telesales per day (100/day total = 50 each)
const EVO_DAILY_PER_SIDE = Number(process.env.EVO_DAILY_PER_SIDE) || 50;
// ---------- Pancake POS: pull CLOSED-SALE orders → hand to the telesales team ----------
const PANCAKE_API_KEY = process.env.PANCAKE_API_KEY || '';
const PANCAKE_SHOP_ID = process.env.PANCAKE_SHOP_ID || '1328953496';
const PANCAKE_HOST = 'https://pos.pancake.vn/api/v1';
// Statuses that are NOT a "closed sale" (skip): 0 new/unconfirmed, 6 returning, 7 returned, 11 canceled.
const PANCAKE_SKIP_STATUS = new Set(String(process.env.PANCAKE_SKIP_STATUS || '0,6,7,11').split(',').map((s) => s.trim()).filter(Boolean));
// Auto-refill: keep the sales refill queue topped up to REFILL_QUEUE_MAX open leads,
// picking repeat customers whose last order was REFILL_AUTO_MIN..REFILL_AUTO_MAX days ago.
const REFILL_QUEUE_MAX = Number(process.env.REFILL_QUEUE_MAX) || 40;
const REFILL_AUTO_MIN = Number(process.env.REFILL_AUTO_MIN) || 25;
const REFILL_AUTO_MAX = Number(process.env.REFILL_AUTO_MAX) || 90;
function pancakeItems(o) {
  const items = (o && o.items) || [];
  const parts = [];
  for (const it of items) {
    const vi = it.variation_info || {};
    const nm = vi.name || vi.detail || it.name || it.product_name || (it.product_display_id ? ('#' + it.product_display_id) : '');
    if (nm) parts.push(String(nm) + ((it.quantity || 1) > 1 ? (' x' + it.quantity) : ''));
  }
  return parts.join(', ').slice(0, 200);
}
// Pick a readable Thai address from a Pancake address object.
function pickPancakeAddr(obj) {
  if (!obj || typeof obj !== 'object') return '';
  const full = obj.new_full_address || obj.full_address || obj.address_full || obj.full_name_address || '';
  if (full && String(full).trim()) return String(full).trim();
  const parts = [obj.address, obj.commune_name || obj.commnue_name || obj.ward_name || obj.commune, obj.district_name || obj.district, obj.province_name || obj.province, obj.post_code || obj.zip_code]
    .map((x) => (x == null ? '' : String(x).trim())).filter(Boolean);
  return parts.join(' ');
}
// Build a full Thai address string from a Pancake ORDER.
function pancakeAddress(o) {
  if (!o) return '';
  let addr = pickPancakeAddr(o.shipping_address);
  if (!addr) {
    const list = (o.customer && (o.customer.shop_customer_addresses || o.customer.shipping_addresses || o.customer.addresses)) || o.shop_customer_addresses || o.shipping_addresses || [];
    if (Array.isArray(list) && list.length) addr = pickPancakeAddr(list[0]);
  }
  if (!addr) addr = String(o.bill_full_address || o.full_address || '').trim();
  return addr.slice(0, 500);
}
// Build a full Thai address string from a Pancake CUSTOMER (customers API).
function pancakeCustomerAddress(c) {
  if (!c) return '';
  const list = c.shop_customer_addresses || c.shipping_addresses || c.addresses || [];
  let addr = '';
  if (Array.isArray(list) && list.length) { for (const a of list) { addr = pickPancakeAddr(a); if (addr) break; } }
  if (!addr) addr = pickPancakeAddr(c.shipping_address);
  return String(addr || '').slice(0, 500);
}
function pancakeOrderToRow(o) {
  const phone = String((o.bill_phone_number || '') || ((o.customer && o.customer.phone_numbers && o.customer.phone_numbers[0]) || '')).trim();
  const name = String((o.bill_full_name || '') || ((o.customer && o.customer.name) || '')).trim();
  const page = String((o.page && o.page.name) || o.order_sources_name || '').slice(0, 120);
  // Pancake stores money in the smallest unit (satang) → divide by 100 for THB.
  const amount = (Math.round(Number(o.total_price_after_sub_discount || o.total_price || 0)) || 0) / 100;
  return { code: 'PC' + (o.system_id || o.id), name, phone, product: pancakeItems(o), amount, page, address: pancakeAddress(o) };
}
async function pancakePull() {
  if (!PANCAKE_API_KEY) { return { added: 0, err: 'no_api_key' }; }
  if (!state.pancake) state.pancake = { startedAt: new Date().toISOString(), seen: [], lastRun: null, lastAdded: 0, lastError: null };
  const seen = new Set(state.pancake.seen || []);
  const startedAt = Date.parse(state.pancake.startedAt) || Date.now();
  let added = 0, scanned = 0, err = null;
  try {
    const url = PANCAKE_HOST + '/shops/' + PANCAKE_SHOP_ID + '/orders?api_key=' + encodeURIComponent(PANCAKE_API_KEY) + '&page_number=1&page_size=100';
    const r = await fetch(url);
    const j = await r.json().catch(() => null);
    if (!j || j.success !== true || !Array.isArray(j.data)) throw new Error('bad_response_status_' + r.status);
    // oldest-first so multiple new closes this cycle keep a stable order
    const orders = j.data.slice().sort((a, b) => Date.parse(a.updated_at || a.inserted_at || 0) - Date.parse(b.updated_at || b.inserted_at || 0));
    const rows = [];
    for (const o of orders) {
      scanned++;
      const id = String(o.id || o.system_id);
      if (seen.has(id)) continue;
      if (PANCAKE_SKIP_STATUS.has(String(o.status))) continue; // not a closed sale (may close later)
      const upd = Date.parse(o.updated_at || o.inserted_at || 0);
      if (isFinite(upd) && upd < startedAt) continue;           // pre-existing history — don't backfill
      rows.push(pancakeOrderToRow(o));
      seen.add(id);
    }
    if (rows.length) {
      const sum = S.applyManual(state, rows, { source: 'pancake', by: 'Pancake', step: 'T1' });
      added = sum.added;
    }
    state.pancake.seen = Array.from(seen).slice(-8000);
    state.pancake.lastRun = new Date().toISOString();
    state.pancake.lastAdded = added;
    state.pancake.lastScanned = scanned;
    state.pancake.lastError = null;
    state = await store.save(state);
  } catch (e) {
    err = String(e);
    state.pancake.lastError = err;
    state.pancake.lastRun = new Date().toISOString();
    try { state = await store.save(state); } catch (_) {}
  }
  return { added, err };
}
function digitsOnly(p) { return String(p == null ? '' : p).replace(/\D/g, ''); }
function normLine(p) { let d = digitsOnly(p); if (d.length === 10 && d[0] === '0') d = '66' + d.slice(1); return d; }
function onecallSide(localParty) { return ONECALL_LINES[normLine(localParty)] || null; }
function normPhoneTH(p) { let d = digitsOnly(p); if (d.startsWith('66')) d = '0' + d.slice(2); return d; }
// Aggregate OneCall calls per (side|phone): total calls + talks(>7s) + last call time.
// Used to auto-mark leads as "called" and to compute per-lead KPI coverage.
function onecallStatsMap() {
  const m = new Map();
  for (const c of (state.onecall || [])) {
    const key = c.side + '|' + digitsOnly(c.phone);
    let s = m.get(key); if (!s) { s = { calls: 0, talk: 0, lastAt: null }; m.set(key, s); }
    s.calls++; if ((c.dur || 0) > ONECALL_MIN_TALK) s.talk++;
    if (!s.lastAt || String(c.at) > s.lastAt) s.lastAt = c.at;
  }
  return m;
}
function onecallAt(ts) {
  if (typeof ts === 'number') return new Date(ts < 1e12 ? ts * 1000 : ts).toISOString();
  if (ts) {
    let s = String(ts).trim();
    // OneCall sends "YYYY-MM-DD HH:MM:SS" in UTC without a zone marker → force UTC (server-TZ independent)
    if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(s)) s = s.replace(' ', 'T') + 'Z';
    const t = Date.parse(s); if (!isNaN(t)) return new Date(t).toISOString();
  }
  return null;
}
// Normalize + dedupe a batch of OneCall recordings into state.onecall (shared by the userscript
// push endpoint and the server-side auto-pull). Does NOT save — caller persists.
function applyOnecallRecords(records) {
  if (!Array.isArray(state.onecall)) state.onecall = [];
  const seen = new Set(state.onecall.map((r) => r.id));
  let added = 0, dup = 0, skipped = 0;
  for (const rec of (records || [])) {
    const id = String((rec && rec.id) != null ? rec.id : '').trim();
    if (!id) { skipped++; continue; }
    if (seen.has(id)) { dup++; continue; }
    const side = onecallSide(rec.localParty);
    if (!side) { skipped++; continue; } // other lines (e.g. ...325) are not W/K
    let dur = parseInt(rec.duration, 10); if (!isFinite(dur) || dur < 0) dur = 0;
    const at = onecallAt(rec.timestamp) || new Date().toISOString();
    seen.add(id);
    state.onecall.push({ id, side, phone: normPhoneTH(rec.remoteParty), dur, at, dir: String(rec.direction || '').slice(0, 12) });
    added++;
  }
  if (state.onecall.length > ONECALL_MAX) state.onecall = state.onecall.slice(-ONECALL_MAX);
  state.onecallUpdatedAt = new Date().toISOString();
  return { added, dup, skipped };
}

// Userscript on the OneCall page relays recordings here (auth via INGEST_KEY or admin session).
app.post('/api/onecall/ingest', async (req, res) => {
  const keyOk = INGEST_KEY && req.headers['x-ingest-key'] === INGEST_KEY;
  const adminOk = (readSession(req) || {}).role === 'admin';
  if (!keyOk && !adminOk) return res.status(401).json({ error: 'bad key' });
  const records = (req.body && req.body.records) || [];
  if (!Array.isArray(records)) return res.status(400).json({ error: 'records must be an array' });
  const sum = applyOnecallRecords(records);
  state = await store.save(state);
  res.json({ ok: true, added: sum.added, dup: sum.dup, skipped: sum.skipped, total: state.onecall.length });
});

// ----- server-side auto-pull: hold a relayed token, keep it alive, pull on a schedule -----
// (so the OneCall page does NOT need to stay open — only re-opened when the token finally expires)
const ONECALL_HOST = 'https://onecallvoicerecord.dtac.co.th';
let onecallAuth = { token: null, updatedAt: null, alive: false, lastPullAt: null, lastAdded: 0, lastError: null };
function onecallHeaders() { return { 'Authorization': onecallAuth.token, 'Accept': 'application/json', 'Content-Type': 'application/json' }; }
function ocStartDate(days) {
  const d = new Date(); d.setDate(d.getDate() - (days - 1)); d.setHours(0, 0, 0, 0);
  const p = (n) => String(n).padStart(2, '0');
  return d.getFullYear() + p(d.getMonth() + 1) + p(d.getDate()) + '_000000';
}
async function onecallKeepalive() {
  if (!onecallAuth.token) return false;
  try {
    const r = await fetch(ONECALL_HOST + '/orktrack/rest/keepalive', { headers: onecallHeaders() });
    if (r.status === 401 || r.status === 403) { onecallAuth.alive = false; onecallAuth.lastError = 'token_expired'; return false; }
    if (r.ok) { onecallAuth.alive = true; }
    return r.ok;
  } catch (e) { onecallAuth.lastError = 'keepalive_failed'; return false; }
}
async function onecallPull() {
  if (!onecallAuth.token) return;
  try {
    const sd = ocStartDate(2);
    let page = 1; const all = [];
    while (page <= 80) {
      const url = ONECALL_HOST + '/orktrack/rest/recordings?range=custom&startdate=' + sd +
        '&sort=&page=' + page + '&pagesize=500&maxresults=-1&includetags=true&includemetadata=true&includeprograms=true';
      const r = await fetch(url, { headers: onecallHeaders() });
      if (r.status === 401 || r.status === 403) { onecallAuth.alive = false; onecallAuth.lastError = 'token_expired'; return; }
      if (!r.ok) { onecallAuth.lastError = 'pull_http_' + r.status; return; }
      const j = await r.json();
      const objs = (j && j.objects) || [];
      for (const o of objs) all.push({ id: o.id, timestamp: o.timestamp, duration: o.duration, localParty: o.localParty, remoteParty: o.remoteParty, direction: o.direction });
      if (objs.length < 500 || (j && j.limitReached)) break;
      page++;
    }
    const sum = applyOnecallRecords(all);
    state = await store.save(state);
    onecallAuth.alive = true; onecallAuth.lastPullAt = new Date().toISOString(); onecallAuth.lastAdded = sum.added; onecallAuth.lastError = null;
    console.log('[onecall] auto-pull', all.length, 'records · added', sum.added);
  } catch (e) { onecallAuth.lastError = 'pull_failed'; console.warn('[onecall] pull failed:', String(e)); }
}
// Userscript relays the current OneCall token so the server can pull unattended.
app.post('/api/onecall/token', (req, res) => {
  const keyOk = INGEST_KEY && req.headers['x-ingest-key'] === INGEST_KEY;
  const adminOk = (readSession(req) || {}).role === 'admin';
  if (!keyOk && !adminOk) return res.status(401).json({ error: 'bad key' });
  const t = req.body && req.body.token;
  if (!t || String(t).length < 10) return res.status(400).json({ error: 'no_token' });
  onecallAuth.token = String(t); onecallAuth.updatedAt = new Date().toISOString(); onecallAuth.alive = true; onecallAuth.lastError = null;
  onecallPull().catch(() => {}); // kick an immediate pull with the fresh token
  res.json({ ok: true, updatedAt: onecallAuth.updatedAt });
});
app.get('/api/onecall/status', requireAuth, (req, res) => {
  res.json({
    hasToken: !!onecallAuth.token, tokenUpdatedAt: onecallAuth.updatedAt, alive: onecallAuth.alive,
    lastPullAt: onecallAuth.lastPullAt, lastAdded: onecallAuth.lastAdded, lastError: onecallAuth.lastError,
    total: (state.onecall || []).length,
  });
});
app.post('/api/onecall/pull', requireAuth, async (req, res) => {
  if (!onecallAuth.token) return res.status(400).json({ error: 'no_token', message: 'ยังไม่มี token — เปิดหน้า OneCall (ที่ติดตั้ง userscript) สักครั้งเพื่อส่ง token เข้ามาก่อน' });
  await onecallKeepalive(); await onecallPull();
  res.json({ ok: true, lastAdded: onecallAuth.lastAdded, lastError: onecallAuth.lastError, alive: onecallAuth.alive, total: (state.onecall || []).length });
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
    const summary = S.applyNew(state, customers, req.body && req.body.label, { dailyCapPerSide: EVO_DAILY_PER_SIDE });
    recordPull('W', summary.addW); recordPull('K', summary.addK);
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

// Admin distributes leads: paste from the order Google Sheet, preview-split, assign to W/K.
// Body: { rows:[{name,phone,address,product,amount,page,closer,side}], step:'T1'|'T2'|'T3', label }
const STEP_KEYS = ['T1', 'T2', 'T3'];
app.post('/api/admin/import', requireDistributor, async (req, res) => {
  const rows = (req.body && req.body.rows) || [];
  if (!Array.isArray(rows)) return res.status(400).json({ error: 'rows must be an array' });
  if (rows.length > 3000) return res.status(400).json({ error: 'too_many', message: 'ครั้งละไม่เกิน 3000 รายชื่อ' });
  const step = STEP_KEYS.includes(req.body && req.body.step) ? req.body.step : 'T1';
  const who = req.session.u || 'admin';
  const summary = S.applyManual(state, rows, { step, label: req.body && req.body.label, by: who, distributedBy: who });
  state = await store.save(state);
  res.json({ ok: true, summary, total: state.assigned.length, W: S.listSide(state, 'W').length, K: S.listSide(state, 'K').length });
});

// Admin Sales sees ONLY the leads they distributed (name/phone/side/product/amount/date) — NOT the team's CRM.
app.get('/api/mysent', requireDistributor, (req, res) => {
  const me = req.session.u;
  const list = state.assigned
    .filter((r) => r.source === 'manual' && r.distributedBy === me)
    .map((r) => ({ name: r.name, phone: r.phone, sales: r.sales, product: r.product || '', orderAmount: r.orderAmount || 0, step: r.step || '', date: r.date || '', at: r.receivedAt || null, archived: !!r.archived }))
    .sort((a, b) => String(b.at || '').localeCompare(String(a.at || '')));
  res.json({ count: list.length, addW: list.filter((x) => x.sales === 'W').length, addK: list.filter((x) => x.sales === 'K').length, list });
});

// KPI dashboard aggregates for the team lead (pipeline snapshot + range metrics + per-person).
// Query: from, to (ISO). Real >7s talk time is filled by the OneCall integration (Phase 4).
const SALES_NAMES = { W: 'Namwhan (น้ำหวาน)', K: 'Khem (เขม)' };
function saleRev(r) { return (r.saleItems || []).reduce((s, i) => s + (Number(i.price) || 0), 0); }
app.get('/api/admin/kpi', requireAuth, async (req, res) => {
  await runSweep();
  const now = Date.now();
  let to = req.query.to ? Date.parse(req.query.to) : now;
  let from = req.query.from ? Date.parse(req.query.from) : (now - 6 * 86400000);
  if (isNaN(to)) to = now;
  if (isNaN(from)) from = to - 6 * 86400000;
  // "Today" boundaries in Thailand time (UTC+7, no DST) so the KPI day matches the sales team's day
  const TZ = 7 * 3600000;
  const nowTh = new Date(now + TZ);
  const y = nowTh.getUTCFullYear(), mo = nowTh.getUTCMonth(), da = nowTh.getUTCDate();
  const tStart = Date.UTC(y, mo, da, 0, 0, 0) - TZ;
  const tEnd = Date.UTC(y, mo, da, 23, 59, 59, 999) - TZ;
  const blank = () => ({
    status: { new: 0, contacting: 0, interested: 0, followup: 0, won: 0, lost: 0 },
    total: 0, notCalled: 0, called: 0, pending: 0, hand2: 0,
    callsRange: 0, wonRange: 0, newRange: 0, lostRange: 0, revRange: 0,
    callsToday: 0, wonToday: 0, rev: 0, talk7Range: 0, talk7Today: 0,
    talk7EvoRange: 0, talk7ManualRange: 0, talk7OtherRange: 0,
    talk7EvoToday: 0, talk7ManualToday: 0, talk7OtherToday: 0,
    calledEvoRange: 0, calledManualRange: 0, calledEvoToday: 0, calledManualToday: 0,
    callsManualRange: 0, callsManualToday: 0,
    archived: 0, recycled: 0,
  });
  const sides = { W: blank(), K: blank() };
  for (const r of state.assigned) {
    const side = r.sales === 'K' ? 'K' : 'W'; const A = sides[side];
    if (r.archived) { A.archived++; if (r.archiveReason === 'recycled_out') A.recycled++; continue; }
    A.total++;
    const st = recStatus(r);
    if (A.status[st] != null) A.status[st]++;
    if ((r.callCount || 0) > 0) A.called++; else A.notCalled++;
    if ((r.stage || 0) > 0) A.hand2++;
    if (st === 'won') A.rev += saleRev(r);
    // pending / overdue (not won/lost, past appointment or stale > 3d)
    if (st !== 'won' && st !== 'lost') {
      let overdue = false;
      if (st === 'followup' && r.nextAppt) { const t = Date.parse(r.nextAppt); if (!isNaN(t) && t < now) overdue = true; }
      if (!overdue) { const la = lastActivityMs(r); if (la != null && (now - la) >= 3 * 86400000) overdue = true; }
      if (overdue) A.pending++;
    }
    // calls in range / today (self-logged taps; real talk time comes from OneCall)
    for (const c of (r.calls || [])) { const t = Date.parse(c.at); if (isNaN(t)) continue; if (t >= from && t <= to) A.callsRange++; if (t >= tStart && t <= tEnd) A.callsToday++; }
    // won / lost events inside the range (one per lead)
    let wonThis = false, wonTod = false, lostThis = false;
    for (const h of (r.history || [])) {
      if (h.k !== 'status') continue; const t = Date.parse(h.at); if (isNaN(t)) continue;
      if (h.v === 'won') { if (t >= from && t <= to) wonThis = true; if (t >= tStart && t <= tEnd) wonTod = true; }
      if (h.v === 'lost' && t >= from && t <= to) lostThis = true;
    }
    if (wonThis) { A.wonRange++; A.revRange += saleRev(r); }
    if (wonTod) A.wonToday++;
    if (lostThis) A.lostRange++;
    if (r.receivedAt) { const t = Date.parse(r.receivedAt); if (!isNaN(t) && t >= from && t <= to) A.newRange++; }
  }
  // Match each OneCall to a lead by side|phone → attribute to Evolution vs Admin-Sales(manual)
  const leadSrc = new Map();
  for (const r of state.assigned) { if (r.archived) continue; const p = digitsOnly(r.phone); if (p) leadSrc.set(r.sales + '|' + p, (r.source === 'manual' || r.source === 'pancake' || r.source === 'refill') ? 'manual' : 'evolution'); }
  const mkSets = () => ({ evo: new Set(), manual: new Set() });
  const calledR = { W: mkSets(), K: mkSets() }, calledT = { W: mkSets(), K: mkSets() };
  for (const c of (state.onecall || [])) {
    const A = sides[c.side]; if (!A) continue;
    const t = Date.parse(c.at); if (isNaN(t)) continue;
    const key = c.side + '|' + digitsOnly(c.phone), src = leadSrc.get(key); // matched lead on this side?
    const inR = t >= from && t <= to, inT = t >= tStart && t <= tEnd;
    // "โทรแล้ว" = unique matched leads that got ≥1 call (any duration) — per lead
    if (src) {
      const b = src === 'manual' ? 'manual' : 'evo';
      if (inR) { calledR[c.side][b].add(key); if (b === 'manual') A.callsManualRange++; }
      if (inT) { calledT[c.side][b].add(key); if (b === 'manual') A.callsManualToday++; }
    }
    // KPI = per-call talks >7s, bucketed by source (or 'Other' if not a lead on this side)
    if ((c.dur || 0) > ONECALL_MIN_TALK) {
      const b = src === 'manual' ? 'Manual' : (src === 'evolution' ? 'Evo' : 'Other');
      if (inR) { A.talk7Range++; A['talk7' + b + 'Range']++; }
      if (inT) { A.talk7Today++; A['talk7' + b + 'Today']++; }
    }
  }
  for (const sd of ['W', 'K']) {
    const A = sides[sd];
    A.calledEvoRange = calledR[sd].evo.size; A.calledManualRange = calledR[sd].manual.size;
    A.calledEvoToday = calledT[sd].evo.size; A.calledManualToday = calledT[sd].manual.size;
  }
  res.json({
    from: new Date(from).toISOString(), to: new Date(to).toISOString(), now: new Date(now).toISOString(),
    names: SALES_NAMES, W: sides.W, K: sides.K,
    onecall: (state.onecall || []).length > 0, onecallUpdatedAt: state.onecallUpdatedAt || null,
    targets: { evo: KPI_TARGET_EVO, manual: KPI_TARGET_MANUAL, rev: KPI_TARGET_REV },
  });
});

// OneCall call analytics for the dashboard charts: per-side totals, avg talk seconds,
// >7s / <=7s split, plus per-day and per-hour (Thai time) series for W vs K.
app.get('/api/admin/callstats', requireAuth, (req, res) => {
  const now = Date.now();
  let to = req.query.to ? Date.parse(req.query.to) : now;
  let from = req.query.from ? Date.parse(req.query.from) : (now - 6 * 86400000);
  if (isNaN(to)) to = now;
  if (isNaN(from)) from = to - 6 * 86400000;
  const TZ = 7 * 3600000;
  const acc = { W: { calls: 0, talk: 0, over7: 0, under7: 0 }, K: { calls: 0, talk: 0, over7: 0, under7: 0 } };
  const dayMap = {};
  const hourMap = {};
  for (let h = 0; h < 24; h++) hourMap[h] = { W: 0, K: 0 };
  for (const c of (state.onecall || [])) {
    const sd = c.side; if (sd !== 'W' && sd !== 'K') continue;
    const t = Date.parse(c.at); if (isNaN(t)) continue;
    if (t < from || t > to) continue;
    const dur = Number(c.dur) || 0;
    const A = acc[sd]; A.calls++; A.talk += dur;
    if (dur > ONECALL_MIN_TALK) A.over7++; else A.under7++;
    const day = S.thaiDay(c.at);
    if (!dayMap[day]) dayMap[day] = { W: 0, K: 0 };
    dayMap[day][sd]++;
    const hr = new Date(t + TZ).getUTCHours();
    hourMap[hr][sd]++;
  }
  // full day list across the range (so zero-call days still show)
  const daily = [];
  let d = Date.parse(S.thaiDay(new Date(from).toISOString()) + 'T00:00:00Z');
  const endD = Date.parse(S.thaiDay(new Date(to).toISOString()) + 'T00:00:00Z');
  let guard = 0;
  while (d <= endD && guard++ < 400) {
    const key = new Date(d).toISOString().slice(0, 10);
    daily.push({ day: key, W: (dayMap[key] || {}).W || 0, K: (dayMap[key] || {}).K || 0 });
    d += 86400000;
  }
  const hourly = [];
  for (let h = 0; h < 24; h++) hourly.push({ hour: h, W: hourMap[h].W, K: hourMap[h].K });
  const mk = (A) => ({
    calls: A.calls, over7: A.over7, under7: A.under7,
    avgSec: A.calls ? Math.round(A.talk / A.calls * 10) / 10 : 0,
    pct: A.calls ? Math.round(A.over7 / A.calls * 100) : 0,
  });
  const W = mk(acc.W), K = mk(acc.K);
  const teamCalls = W.calls + K.calls, teamOver = W.over7 + K.over7, teamTalk = acc.W.talk + acc.K.talk;
  const team = {
    calls: teamCalls, over7: teamOver, under7: W.under7 + K.under7,
    avgSec: teamCalls ? Math.round(teamTalk / teamCalls * 10) / 10 : 0,
    pct: teamCalls ? Math.round(teamOver / teamCalls * 100) : 0,
  };
  res.json({
    from: new Date(from).toISOString(), to: new Date(to).toISOString(),
    names: SALES_NAMES, hasOnecall: (state.onecall || []).length > 0,
    minTalk: ONECALL_MIN_TALK, summary: { W, K, team }, daily, hourly,
  });
});

// Per-call history for the Teamlead: individual OneCall records in a range, filtered by
// salesperson, with the matched customer name. The client does live search/sort/repeat-count.
app.get('/api/admin/calllog', requireAuth, (req, res) => {
  const now = Date.now();
  let to = req.query.to ? Date.parse(req.query.to) : now;
  let from = req.query.from ? Date.parse(req.query.from) : (now - 6 * 86400000);
  if (isNaN(to)) to = now;
  if (isNaN(from)) from = to - 6 * 86400000;
  const sideF = (req.query.side === 'W' || req.query.side === 'K') ? req.query.side : null;
  // phone -> customer name (from active leads) so the log shows who was called
  const nameMap = new Map();
  for (const a of state.assigned) {
    if (a.archived) continue;
    const p = digitsOnly(a.phone);
    if (p && !nameMap.has(p)) nameMap.set(p, a.name || '');
  }
  const calls = [];
  for (const c of (state.onecall || [])) {
    const sd = c.side; if (sd !== 'W' && sd !== 'K') continue;
    if (sideF && sd !== sideF) continue;
    const t = Date.parse(c.at); if (isNaN(t)) continue;
    if (t < from || t > to) continue;
    calls.push({ id: c.id, side: sd, phone: c.phone, name: nameMap.get(digitsOnly(c.phone)) || '', dur: Number(c.dur) || 0, at: c.at, dir: c.dir || '' });
  }
  calls.sort((a, b) => Date.parse(b.at) - Date.parse(a.at));
  res.json({
    names: SALES_NAMES, minTalk: ONECALL_MIN_TALK,
    total: calls.length, capped: calls.length > 3000, calls: calls.slice(0, 3000),
  });
});

// Stream a OneCall recording's audio through our server (token stays server-side, admin-only).
// The recording id is the same id we already store in state.onecall.
app.get('/api/onecall/audio/:id', requireAuth, async (req, res) => {
  const id = String(req.params.id || '').replace(/\D/g, '');
  if (!id) return res.status(400).json({ error: 'bad_id' });
  if (!onecallAuth.token) return res.status(400).json({ error: 'no_token', message: 'ยังไม่มี token OneCall — เปิดหน้า OneCall (ที่ติดตั้ง userscript) สักครั้ง' });
  const usage = req.query.dl ? 'download' : 'play';
  const url = ONECALL_HOST + '/orktrack/rest/mediastream/' + id + '?at=' + encodeURIComponent(onecallAuth.token) + '&usage=' + usage;
  try {
    const headers = { 'Authorization': onecallAuth.token, 'Accept': '*/*' };
    if (req.headers.range) headers.Range = req.headers.range;
    const r = await fetch(url, { headers });
    if (r.status === 401 || r.status === 403) return res.status(400).json({ error: 'token_expired', message: 'token OneCall หมดอายุ — เปิดหน้า OneCall อีกครั้ง' });
    if (!r.ok && r.status !== 206) return res.status(502).json({ error: 'audio_unavailable', status: r.status });
    res.status(r.status);
    const pass = ['content-type', 'content-length', 'content-range', 'accept-ranges'];
    for (const h of pass) { const v = r.headers.get(h); if (v) res.setHeader(h, v); }
    if (!r.headers.get('content-type')) res.setHeader('Content-Type', 'audio/wav');
    if (usage === 'download') res.setHeader('Content-Disposition', 'attachment; filename="call-' + id + '.wav"');
    if (r.body && typeof require('stream').Readable.fromWeb === 'function') {
      require('stream').Readable.fromWeb(r.body).pipe(res);
    } else {
      res.end(Buffer.from(await r.arrayBuffer()));
    }
  } catch (e) {
    res.status(502).json({ error: 'audio_failed', message: String(e) });
  }
});

// Pancake refill: customers who bought a while ago (serum used up) and are due to re-order.
let _refillCache = { at: 0, data: null, min: 0, max: 0 };
async function pancakeRefill(daysMin, daysMax) {
  if (!PANCAKE_API_KEY) return { error: 'no_api_key', candidates: [] };
  const now = Date.now();
  const maxTs = now - daysMin * 86400000; // ordered at least daysMin ago
  const minTs = now - daysMax * 86400000; // but not older than daysMax
  const seenActive = new Set(state.assigned.filter((a) => !a.archived).map((a) => digitsOnly(a.phone)).filter(Boolean));
  const out = [];
  let page = 1, scanned = 0;
  const MAX_PAGES = 16;
  try {
    while (page <= MAX_PAGES) {
      const url = PANCAKE_HOST + '/shops/' + PANCAKE_SHOP_ID + '/customers?api_key=' + encodeURIComponent(PANCAKE_API_KEY) + '&page_number=' + page + '&page_size=100';
      const r = await fetch(url);
      const j = await r.json().catch(() => null);
      if (!j || j.success !== true || !Array.isArray(j.data) || !j.data.length) break;
      for (const c of j.data) {
        scanned++;
        if (Number(c.succeed_order_count || 0) < 1) continue;
        const loRaw = String(c.last_order_at || '').replace(' ', 'T');
        const lo = Date.parse(loRaw);
        if (isNaN(lo) || lo < minTs || lo > maxTs) continue;
        const phone = normPhoneTH((c.phone_numbers && c.phone_numbers[0]) || '');
        if (!phone) continue;
        out.push({
          name: c.name || '', phone,
          lastOrderAt: c.last_order_at, daysSince: Math.floor((now - lo) / 86400000),
          orderCount: Number(c.order_count || 0), succeedOrders: Number(c.succeed_order_count || 0),
          spent: Math.round(Number(c.purchased_amount || 0)) / 100,
          address: pancakeCustomerAddress(c),
          inQueue: seenActive.has(digitsOnly(phone)),
        });
      }
      if (j.data.length < 100) break;
      page++;
    }
    out.sort((a, b) => b.daysSince - a.daysSince);
    return { candidates: out, scanned };
  } catch (e) { return { error: String(e), candidates: out, scanned }; }
}
app.get('/api/pancake/refill', requireAuth, async (req, res) => {
  if (!PANCAKE_API_KEY) return res.status(400).json({ error: 'no_api_key', message: 'ยังไม่ได้ตั้ง PANCAKE_API_KEY' });
  const dmin = Math.max(1, Number(req.query.min) || 25), dmax = Math.min(180, Number(req.query.max) || 60);
  const stale = (Date.now() - _refillCache.at > 30 * 60 * 1000) || _refillCache.min !== dmin || _refillCache.max !== dmax;
  if (req.query.refresh || stale || !_refillCache.data) {
    _refillCache = { at: Date.now(), data: await pancakeRefill(dmin, dmax), min: dmin, max: dmax };
  }
  const d = _refillCache.data || { candidates: [] };
  res.json({ candidates: d.candidates || [], scanned: d.scanned || 0, error: d.error || null, cachedAt: new Date(_refillCache.at).toISOString(), min: dmin, max: dmax, names: SALES_NAMES });
});
app.post('/api/pancake/refill/import', requireAuth, async (req, res) => {
  const phones = (req.body && Array.isArray(req.body.phones)) ? req.body.phones : null;
  const d = _refillCache.data || { candidates: [] };
  let cands = d.candidates || [];
  if (phones) { const set = new Set(phones.map(digitsOnly)); cands = cands.filter((c) => set.has(digitsOnly(c.phone))); }
  const rows = cands.filter((c) => !c.inQueue).map((c) => ({ code: 'RF' + digitsOnly(c.phone).slice(-6), name: c.name, phone: c.phone, product: 'ซื้อซ้ำ (refill) · เคยซื้อ ' + c.succeedOrders + ' ครั้ง · ล่าสุด ' + c.daysSince + ' วันก่อน', amount: 0, page: 'Refill', lastOrderAt: c.lastOrderAt || null, address: c.address || '' }));
  const sum = S.applyManual(state, rows, { source: 'refill', by: 'Refill', step: 'T1' });
  state = await store.save(state);
  res.json({ ok: true, added: sum.added, addW: sum.addW, addK: sum.addK, dup: sum.dup });
});

// Auto-refill: top up the sales refill queue automatically (no Teamlead button press),
// so overdue repeat customers keep flowing to the team even if the Teamlead is off.
// Self-regulating: only tops up while the active (un-won/lost) refill queue is below the cap.
async function pancakeRefillAuto() {
  if (!PANCAKE_API_KEY) return { skipped: 'no_api_key' };
  try {
    // count refill leads still open (not won/lost/archived) — the working queue
    const openRefill = state.assigned.filter((a) => !a.archived && a.source === 'refill'
      && a.leadStatus !== 'won' && a.leadStatus !== 'lost').length;
    if (openRefill >= REFILL_QUEUE_MAX) {
      state.refillAuto = { lastRun: new Date().toISOString(), added: 0, open: openRefill, note: 'queue_full' };
      await store.save(state); return { added: 0, open: openRefill, note: 'queue_full' };
    }
    const want = REFILL_QUEUE_MAX - openRefill;              // how many more to enqueue
    const data = await pancakeRefill(REFILL_AUTO_MIN, REFILL_AUTO_MAX);
    const cands = (data.candidates || []).filter((c) => !c.inQueue); // most-overdue first (pancakeRefill sorts desc)
    const pick = cands.slice(0, want);
    if (!pick.length) {
      state.refillAuto = { lastRun: new Date().toISOString(), added: 0, open: openRefill, scanned: data.scanned || 0, note: 'no_candidates' };
      await store.save(state); return { added: 0, open: openRefill };
    }
    const rows = pick.map((c) => ({ code: 'RF' + digitsOnly(c.phone).slice(-6), name: c.name, phone: c.phone, product: 'ซื้อซ้ำ (refill) · เคยซื้อ ' + c.succeedOrders + ' ครั้ง · ล่าสุด ' + c.daysSince + ' วันก่อน', amount: 0, page: 'Refill', lastOrderAt: c.lastOrderAt || null, address: c.address || '' }));
    const sum = S.applyManual(state, rows, { source: 'refill', by: 'Auto-Refill', step: 'T1' });
    state.refillAuto = { lastRun: new Date().toISOString(), added: sum.added, addW: sum.addW, addK: sum.addK, open: openRefill + sum.added, scanned: data.scanned || 0 };
    state = await store.save(state);
    return { added: sum.added, addW: sum.addW, addK: sum.addK, open: openRefill + sum.added };
  } catch (e) {
    state.refillAuto = { lastRun: new Date().toISOString(), added: 0, error: String(e) };
    try { await store.save(state); } catch (_) {}
    return { error: String(e) };
  }
}

// Pancake: manual "sync now" + status for the Teamlead dashboard.
app.post('/api/pancake/pull', requireAuth, async (req, res) => {
  if (!PANCAKE_API_KEY) return res.status(400).json({ error: 'no_api_key', message: 'ยังไม่ได้ตั้ง PANCAKE_API_KEY ใน Railway' });
  const out = await pancakePull();
  res.json({ ok: !out.err, added: out.added, error: out.err || null });
});
// One-time bounded backfill: import closed-sale orders from the last N hours (default 6, max 48),
// then reset the baseline to now so the regular poll continues forward-only.
app.post('/api/pancake/backfill', requireAuth, async (req, res) => {
  if (!PANCAKE_API_KEY) return res.status(400).json({ error: 'no_api_key', message: 'ยังไม่ได้ตั้ง PANCAKE_API_KEY' });
  const hours = Math.min(48, Math.max(1, Number(req.query.hours) || 6));
  if (!state.pancake) state.pancake = { startedAt: new Date().toISOString(), seen: [], lastRun: null, lastAdded: 0, lastError: null };
  // ?reset=1 : drop previously-imported Pancake leads first, then re-import fresh (fixes bad data).
  if (req.query.reset) {
    const before = state.assigned.length;
    state.assigned = state.assigned.filter((r) => r.source !== 'pancake');
    state.pancake.seen = [];
    console.log('[pancake] reset removed', before - state.assigned.length, 'pancake leads');
  }
  state.pancake.startedAt = new Date(Date.now() - hours * 3600000).toISOString();
  const out = await pancakePull();
  state.pancake.startedAt = new Date().toISOString(); // forward-only from here on
  try { state = await store.save(state); } catch (_) {}
  res.json({ ok: !out.err, added: out.added, hours, error: out.err || null });
});
// One-time backfill: fill the address on existing leads that are missing one,
// matching by phone against Pancake orders (recent) + customers (repeat buyers).
app.post('/api/pancake/fill-address', requireAuth, async (req, res) => {
  if (!PANCAKE_API_KEY) return res.status(400).json({ error: 'no_api_key' });
  const map = new Map();
  const put = (phone, addr) => { const p = digitsOnly(phone); if (p && addr && String(addr).trim() && !map.has(p)) map.set(p, String(addr).trim()); };
  let fromOrders = 0, fromCustomers = 0;
  try {
    // Pancake ORDERS (recent) — up to 10 pages
    for (let page = 1; page <= 10; page++) {
      const url = PANCAKE_HOST + '/shops/' + PANCAKE_SHOP_ID + '/orders?api_key=' + encodeURIComponent(PANCAKE_API_KEY) + '&page_number=' + page + '&page_size=100';
      const j = await (await fetch(url)).json().catch(() => null);
      if (!j || j.success !== true || !Array.isArray(j.data) || !j.data.length) break;
      for (const o of j.data) { const a = pancakeAddress(o); if (a) { const before = map.size; put(o.bill_phone_number || (o.shipping_address && o.shipping_address.phone_number) || (o.customer && o.customer.phone_numbers && o.customer.phone_numbers[0]), a); if (map.size > before) fromOrders++; } }
      if (j.data.length < 100) break;
    }
    // Pancake CUSTOMERS (repeat buyers) — up to 16 pages
    for (let page = 1; page <= 16; page++) {
      const url = PANCAKE_HOST + '/shops/' + PANCAKE_SHOP_ID + '/customers?api_key=' + encodeURIComponent(PANCAKE_API_KEY) + '&page_number=' + page + '&page_size=100';
      const j = await (await fetch(url)).json().catch(() => null);
      if (!j || j.success !== true || !Array.isArray(j.data) || !j.data.length) break;
      for (const c of j.data) { const a = pancakeCustomerAddress(c); if (a) { const before = map.size; put((c.phone_numbers && c.phone_numbers[0]) || '', a); if (map.size > before) fromCustomers++; } }
      if (j.data.length < 100) break;
    }
  } catch (e) { return res.status(500).json({ error: String(e), mapSize: map.size }); }
  let filled = 0;
  for (const r of state.assigned) {
    if (r.archived) continue;
    if (r.address && String(r.address).trim()) continue;
    const a = map.get(digitsOnly(r.phone));
    if (a) { r.address = a; pushHist(r, 'address', 'auto-fill from Pancake', 'system'); filled++; }
  }
  if (filled) state = await store.save(state);
  res.json({ ok: true, filled, mapSize: map.size, fromOrders, fromCustomers });
});
app.get('/api/pancake/status', requireAuth, (req, res) => {
  const p = state.pancake || {};
  res.json({
    configured: !!PANCAKE_API_KEY, shopId: PANCAKE_SHOP_ID,
    startedAt: p.startedAt || null, lastRun: p.lastRun || null,
    lastAdded: p.lastAdded || 0, lastError: p.lastError || null,
    imported: (state.assigned || []).filter((r) => r.source === 'pancake').length,
  });
});

app.post('/api/reset', requireAuth, async (req, res) => {
  const seed = JSON.parse(fs.readFileSync(path.join(__dirname, 'seed.json'), 'utf8'));
  state = S.buildSeed(seed);
  state = await store.save(state);
  res.json({ ok: true, total: state.assigned.length });
});

// Start from zero: wipe all lead assignments and the pull log. (Call recordings/onecall
// are kept.) The daily auto-backup already snapshots the previous data for recovery.
app.post('/api/clear', requireAuth, async (req, res) => {
  const before = state.assigned.length;
  state = { assigned: [], maxRound: 0, onecall: state.onecall || [], pulls: [] };
  state = await store.save(state);
  console.log('[clear] wiped', before, 'leads → 0 (start from zero)');
  res.json({ ok: true, cleared: before, total: 0 });
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
  setInterval(() => { onecallKeepalive().catch(() => {}); }, 4 * 60 * 1000);  // keep OneCall token alive
  setInterval(() => { onecallPull().catch(() => {}); }, 12 * 60 * 1000);       // auto-pull OneCall recordings
  if (PANCAKE_API_KEY) {
    setTimeout(() => { pancakePull().catch(() => {}); }, 20 * 1000);           // first Pancake sync shortly after boot
    setInterval(() => { pancakePull().catch(() => {}); }, 10 * 60 * 1000);     // pull closed-sale orders every 10 min
    setTimeout(() => { pancakeRefillAuto().catch(() => {}); }, 90 * 1000);     // first auto-refill top-up ~1.5 min after boot
    setInterval(() => { pancakeRefillAuto().catch(() => {}); }, 6 * 60 * 60 * 1000); // top up refill queue every 6h (works even if Teamlead is off)
  }
}).catch((e) => { console.error('boot failed', e); process.exit(1); });
