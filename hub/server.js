// Evolution Hub Commerce — back office for Telesales, Admin Sales and executives.
'use strict';
const express = require('express');
const crypto = require('crypto');
const path = require('path');
const H = require('./public/core.js');
const store = require('./store');
const I = require('./integrations');

const PORT = process.env.PORT || 3000;
const SECRET = process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex');
const INGEST_KEY = process.env.INGEST_KEY || '';
const PANCAKE_EVERY_MIN = Number(process.env.PANCAKE_EVERY_MIN) || 3;
const ONECALL_EVERY_MIN = Number(process.env.ONECALL_EVERY_MIN) || 10;

// ---------- passwords: PASS_<ID> per person, or USERS_JSON, or DEFAULT_PASS for everyone ----------
const passwords = {};
try { for (const u of JSON.parse(process.env.USERS_JSON || '[]')) if (u.id && u.pass) passwords[u.id] = String(u.pass); } catch (_) { console.warn('[auth] USERS_JSON is not valid JSON'); }
for (const u of H.DEFAULT_USERS) { const v = process.env['PASS_' + u.id.toUpperCase()]; if (v) passwords[u.id] = v; }
const generated = {};
for (const u of H.DEFAULT_USERS) if (!passwords[u.id]) {
  if (process.env.DEFAULT_PASS) passwords[u.id] = process.env.DEFAULT_PASS;
  else { passwords[u.id] = generated[u.id] = crypto.randomBytes(4).toString('hex'); }
}
if (Object.keys(generated).length) console.warn('[auth] No password set for', Object.keys(generated).join(', '), '— temporary passwords:', JSON.stringify(generated), '(set PASS_<ID> in Railway Variables)');

const safeEq = (a, b) => { const x = Buffer.from(String(a)), y = Buffer.from(String(b)); return x.length === y.length && crypto.timingSafeEqual(x, y); };
const sign = (v) => crypto.createHmac('sha256', SECRET).update(v).digest('base64url');
function makeToken(id) { const v = Buffer.from(JSON.stringify({ id, exp: Date.now() + 14 * 86400000 })).toString('base64url'); return v + '.' + sign(v); }
function readToken(req) {
  const m = /(?:^|;\s*)hub=([^;]+)/.exec(req.headers.cookie || ''); if (!m) return null;
  const [v, s] = m[1].split('.'); if (!v || !s || !safeEq(sign(v), s)) return null;
  try { const p = JSON.parse(Buffer.from(v, 'base64url').toString()); return p.exp > Date.now() ? p : null; } catch (_) { return null; }
}

// ---------- state ----------
let state = null;
let chain = Promise.resolve();           // serialize writes
function mutate(fn) {
  const run = chain.then(async () => { const r = await fn(state); state = await store.save(state); return r; });
  chain = run.catch(() => {});
  return run;
}
function actorOf(req) {
  const t = readToken(req); if (!t) return null;
  const u = H.userById(state, t.id); return u && !u.disabled ? u : null;
}
function auth(req, res, next) { const a = actorOf(req); if (!a) return res.status(401).json({ error: 'กรุณาเข้าสู่ระบบ' }); req.actor = a; next(); }
const keyOk = (req) => INGEST_KEY && safeEq(req.headers['x-ingest-key'] || '', INGEST_KEY);

const app = express();
app.disable('x-powered-by');
app.use(express.json({ limit: '15mb' }));
app.use((req, res, next) => {    // CORS only for browser helper scripts that push data with the ingest key
  if (req.path.startsWith('/api/ingest') || /^\/api\/(bigseller|onecall)\/ingest/.test(req.path)) {
    res.set('Access-Control-Allow-Origin', '*'); res.set('Access-Control-Allow-Headers', 'content-type,x-ingest-key'); res.set('Access-Control-Allow-Methods', 'POST,OPTIONS');
    if (req.method === 'OPTIONS') return res.sendStatus(204);
  }
  next();
});
app.use(express.static(path.join(__dirname, 'public'), { index: false, maxAge: '5m' }));
const BUILD = Date.now().toString(36);
const INDEX_HTML = require('fs').readFileSync(path.join(__dirname, 'public', 'index.html'), 'utf8').replace(/(href|src)="\/(app\.css|core\.js|demo-seed\.js|app\.js)"/g, '$1="/$2?v=' + BUILD + '"');
app.get('/', (req, res) => { res.set('Cache-Control', 'no-cache'); res.type('html').send(INDEX_HTML); });
app.get('/healthz', (req, res) => res.json({ ok: true, customers: state ? state.customers.length : 0 }));

// login: pick a person + password
app.get('/api/people', (req, res) => res.json(state.users.filter((u) => !u.disabled).map((u) => ({ id: u.id, name: u.name, role: u.role, title: u.title, initial: u.initial }))));
// Landing page before login: team names, announcement titles and appointment counts only (no customer data)
app.get('/api/public', (req, res) => {
  const t = H.today(), cnt = {};
  for (const a of state.appointments) { if (a.done) continue; const d = H.dayKey(a.at); if (d >= t) cnt[d] = (cnt[d] || 0) + 1; }
  res.json({
    people: state.users.filter((u) => !u.disabled).map((u) => ({ id: u.id, name: u.name, role: u.role, initial: u.initial })),
    announcements: state.announcements.slice(0, 3).map((a) => ({ title: a.title, at: a.at })),
    upcoming: Object.keys(cnt).sort().slice(0, 3).map((day) => ({ day, count: cnt[day] })),
  });
});
const tries = new Map();
app.post('/api/login', (req, res) => {
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '';
  const t = tries.get(ip) || { n: 0, at: 0 };
  if (t.n >= 8 && Date.now() - t.at < 10 * 60000) return res.status(429).json({ error: 'ลองรหัสผิดหลายครั้ง รอ 10 นาทีแล้วลองใหม่' });
  const { id, password } = req.body || {};
  const u = H.userById(state, id);
  if (!u || !passwords[id] || !safeEq(password || '', passwords[id])) { tries.set(ip, { n: t.n + 1, at: Date.now() }); return res.status(401).json({ error: 'รหัสผ่านไม่ถูกต้อง' }); }
  tries.delete(ip);
  res.set('Set-Cookie', 'hub=' + makeToken(u.id) + '; Path=/; HttpOnly; SameSite=Lax; Max-Age=' + 14 * 86400 + (req.secure || req.headers['x-forwarded-proto'] === 'https' ? '; Secure' : ''));
  res.json({ ok: true });
});
app.post('/api/logout', (req, res) => { res.set('Set-Cookie', 'hub=; Path=/; HttpOnly; Max-Age=0'); res.json({ ok: true }); });

// the whole (role-filtered) state; clients poll with ?since= to skip unchanged payloads
app.get('/api/state', auth, (req, res) => {
  if (req.query.since && req.query.since === state.updatedAt) return res.json({ unchanged: true, updatedAt: state.updatedAt });
  const v = H.visibleState(state, req.actor);
  const cutoff = Date.now() - 45 * 86400000;
  res.json({ me: req.actor, state: { ...v, onecall: (v.onecall || []).filter((o) => Date.parse(o.at) > cutoff), sync: { ...state.sync, onecall: { ...state.sync.onecall, token: undefined } } }, integrations: I.status(), updatedAt: state.updatedAt });
});
app.post('/api/action', auth, async (req, res) => {
  const { type, payload } = req.body || {};
  if (type === 'resetDemo') return res.status(400).json({ error: 'ใช้ได้เฉพาะโหมดตัวอย่าง' });
  try { const result = await mutate((st) => H.apply(st, type, payload, req.actor)); res.json({ ok: true, result, updatedAt: state.updatedAt }); }
  catch (e) { res.status(e.code && e.code < 600 ? e.code : 500).json({ error: e.message || String(e) }); }
});

// ---------- connectors ----------
app.post('/api/sync/pancake', auth, async (req, res) => {
  if (!H.isBoss(req.actor) && req.actor.role !== 'admin') return res.status(403).json({ error: 'ไม่มีสิทธิ์' });
  const r = await mutate((st) => I.pancakePull(st, { backfillDays: H.isBoss(req.actor) ? Number((req.body || {}).backfillDays) || 0 : 0 }));
  res.json(r);
});
app.post('/api/sync/onecall', auth, async (req, res) => {
  if (!H.isBoss(req.actor)) return res.status(403).json({ error: 'ไม่มีสิทธิ์' });
  res.json(await mutate((st) => I.onecallPull(st, Number((req.body || {}).days) || 2)));
});
app.post('/api/import/legacy', auth, async (req, res) => {
  if (!H.isBoss(req.actor)) return res.status(403).json({ error: 'ไม่มีสิทธิ์' });
  if (!process.env.LEGACY_DATABASE_URL) return res.status(400).json({ error: 'ยังไม่ได้ตั้งค่า LEGACY_DATABASE_URL (ฐานข้อมูลของระบบเดิม evo-split-online)' });
  try { const old = await store.loadLegacy(process.env.LEGACY_DATABASE_URL); res.json(await mutate((st) => I.importLegacy(st, old))); }
  catch (e) { res.status(500).json({ error: 'อ่านฐานข้อมูลระบบเดิมไม่ได้: ' + e.message }); }
});
// Customer base from the team's Excel sheet (layout like "ชีทพี่เขม") → customers, orders, notes, next calls
app.post('/api/upload/contacts', auth, async (req, res) => {
  if (!H.isBoss(req.actor)) return res.status(403).json({ error: 'ไม่มีสิทธิ์' });
  try {
    const XLSX = require('xlsx');
    const b = req.body || {};
    const wb = XLSX.read(Buffer.from(String(b.file || ''), 'base64'), { type: 'buffer', cellDates: true });
    if (b.listSheets) return res.json({ sheets: wb.SheetNames });
    const name = wb.SheetNames.includes(b.sheet) ? b.sheet : wb.SheetNames[0];
    const aoa = XLSX.utils.sheet_to_json(wb.Sheets[name], { header: 1, raw: true, defval: null });
    const rows = H.sheetToContacts(aoa, { owner: b.owner || null });
    if (!rows.length) return res.status(400).json({ error: 'ไม่พบหัวคอลัมน์ "ชื่อลูกค้า" และ "เบอร์" ในชีท ' + name });
    res.json(await mutate((st) => H.apply(st, 'importContacts', { rows, owner: b.owner || null, label: name, importId: 'upload:' + name + ':' + Date.now() }, req.actor)));
  } catch (e) { res.status(400).json({ error: 'อ่านไฟล์ไม่ได้: ' + e.message }); }
});
// Excel / CSV export from BigSeller (base64) → marketplace leads
app.post('/api/upload/ecom', auth, async (req, res) => {
  if (!H.isBoss(req.actor)) return res.status(403).json({ error: 'ไม่มีสิทธิ์' });
  try {
    const XLSX = require('xlsx');
    const wb = XLSX.read(Buffer.from(String((req.body || {}).file || ''), 'base64'), { type: 'buffer' });
    const tsv = XLSX.utils.sheet_to_csv(wb.Sheets[wb.SheetNames[0]], { FS: '\t' });
    const rows = H.parseTable(tsv);
    if ((req.body || {}).platform) rows.forEach((r) => { r.platform = req.body.platform; });
    res.json(await mutate((st) => H.apply(st, 'ingestEcom', { rows }, req.actor)));
  } catch (e) { res.status(400).json({ error: 'อ่านไฟล์ไม่ได้: ' + e.message }); }
});
// Browser helper scripts (same payloads as the old system, so existing userscripts keep working)
async function ingestEcom(req, res) {
  if (!keyOk(req) && !(actorOf(req) && H.isBoss(actorOf(req)))) return res.status(401).json({ error: 'bad key' });
  const rows = (req.body && req.body.rows) || [];
  res.json(await mutate((st) => H.apply(st, 'ingestEcom', { rows }, { id: 'system', role: 'system' })));
}
async function ingestOnecall(req, res) {
  if (!keyOk(req)) return res.status(401).json({ error: 'bad key' });
  const records = (req.body && (req.body.records || req.body.recordings)) || [];
  res.json(await mutate((st) => H.apply(st, 'ingestOnecall', { records }, { id: 'system', role: 'system' })));
}
app.post('/api/ingest/bigseller', ingestEcom);
app.post('/api/bigseller/ingest', ingestEcom);
app.post('/api/ingest/onecall', ingestOnecall);
app.post('/api/onecall/ingest', ingestOnecall);
app.post('/api/ingest/close', async (req, res) => {   // any external tool can push an admin close
  if (!keyOk(req)) return res.status(401).json({ error: 'bad key' });
  try { res.json(await mutate((st) => H.apply(st, 'createClose', req.body || {}, { id: 'system', role: 'system' }))); }
  catch (e) { res.status(400).json({ error: e.message }); }
});
app.get('/api/backups', auth, async (req, res) => { if (!H.isBoss(req.actor)) return res.status(403).end(); res.json(await store.listBackups()); });
app.get('/api/export/customers.csv', auth, (req, res) => {
  if (!H.isBoss(req.actor)) return res.status(403).end();
  const q = (s) => '"' + String(s == null ? '' : s).replace(/"/g, '""') + '"';
  const lines = [['ชื่อ', 'เบอร์', 'ที่อยู่', 'ช่องทาง', 'แพลตฟอร์ม', 'เซลล์', 'สถานะ', 'รอบ', 'ยอดซื้อรวม', 'ออเดอร์ล่าสุด'].map(q).join(',')];
  for (const c of state.customers) lines.push([c.name, H.fmtPhone(c.phone), c.address, c.channel === 'fb' ? 'FB Page' : 'E-Commerce', c.platform, H.userName(state, c.owner), (H.STATUS[c.status] || {}).label, c.round, H.customerTotal(c), (c.orders[0] || {}).date || ''].map(q).join(','));
  res.set('Content-Type', 'text/csv; charset=utf-8'); res.set('Content-Disposition', 'attachment; filename="customers.csv"');
  res.send('﻿' + lines.join('\n'));
});

// ---------- boot ----------
(async () => {
  await store.init();
  state = H.normalize(await store.load());
  if (!state.customers.length && process.env.SEED_DEMO === '1') { state = require('./public/demo-seed.js').build(); console.log('[boot] seeded example data'); }
  if (!state.customers.length && process.env.LEGACY_DATABASE_URL && !state.sync.legacy.importedAt) {
    try { const r = I.importLegacy(state, await store.loadLegacy(process.env.LEGACY_DATABASE_URL)); console.log('[boot] imported old system', r); }
    catch (e) { console.warn('[boot] legacy import failed', e.message); }
  }
  // one-time encrypted imports shipped with the code (imports/*.enc, key in IMPORT_KEY) — the repo only holds ciphertext
  if (process.env.IMPORT_KEY) {
    const fs = require('fs');
    const dir = path.join(__dirname, 'imports');
    state.sync.imports = state.sync.imports || {};
    for (const f of (fs.existsSync(dir) ? fs.readdirSync(dir) : []).filter((x) => x.endsWith('.enc'))) {
      if (state.sync.imports[f]) continue;
      try {
        const box = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
        const d = crypto.createDecipheriv('aes-256-gcm', Buffer.from(process.env.IMPORT_KEY, 'base64'), Buffer.from(box.iv, 'base64'));
        d.setAuthTag(Buffer.from(box.tag, 'base64'));
        const pay = JSON.parse(Buffer.concat([d.update(Buffer.from(box.data, 'base64')), d.final()]).toString('utf8'));
        const r = H.apply(state, 'importContacts', { rows: pay.rows, owner: pay.owner, label: pay.label, importId: f }, { id: 'system', role: 'system' });
        console.log('[import]', f, JSON.stringify(r));
      } catch (e) { console.warn('[import] failed', f, e.message); }
    }
  }
  state = await store.save(state);
  app.listen(PORT, () => console.log('Evolution Hub Commerce on :' + PORT, '· customers', state.customers.length));
  const loop = (fn, min) => setInterval(() => mutate(fn).catch((e) => console.warn(e.message)), min * 60000);
  if (I.status().pancake) { loop((st) => I.pancakePull(st), PANCAKE_EVERY_MIN); setTimeout(() => mutate((st) => I.pancakePull(st)).catch(() => {}), 5000); }
  if (I.status().onecall) loop((st) => I.onecallPull(st, 2), ONECALL_EVERY_MIN);
})().catch((e) => { console.error(e); process.exit(1); });
