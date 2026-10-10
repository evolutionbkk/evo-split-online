// Connectors: Pancake POS (FB Page closes), OneCall (call recordings), BigSeller (marketplace export),
// and a one-time import from the old evo-split-online database.
// Every connector turns outside data into core actions, so the same rules apply as when a person types it.
'use strict';
const H = require('./public/core.js');

const SYSTEM = { id: 'system', role: 'system' };

// ------------------------------------------------------------------ Pancake POS
const PANCAKE_HOST = process.env.PANCAKE_HOST || 'https://pos.pancake.vn/api/v1';
const PANCAKE_API_KEY = process.env.PANCAKE_API_KEY || '';
const PANCAKE_SHOP_ID = process.env.PANCAKE_SHOP_ID || '1328953496';
// Not a closed sale: 0 new, 5 returned, 6 canceled, 7 returning, 11 deleted
const SKIP = new Set(String(process.env.PANCAKE_SKIP_STATUS || '0,5,6,7,11').split(',').map((s) => s.trim()));

function pcAddress(o) {
  const a = o.shipping_address || {};
  const full = a.new_full_address || a.full_address;
  if (full) return String(full).trim();
  return [a.address, a.commune_name, a.district_name, a.province_name, a.post_code].filter(Boolean).join(' ');
}
function pcItems(o) {
  return (o.items || []).map((it) => {
    const vi = it.variation_info || {};
    return { name: String(vi.name || it.name || '').trim(), qty: Number(it.quantity) || 1, price: (Number(vi.retail_price) || 0) / 100 };
  }).filter((i) => i.name && !/^up$/i.test(i.name) && i.name !== '0');   // "UP" = upsell marker with price 0
}
function pcTime(s) { if (!s) return new Date().toISOString(); return /Z|[+-]\d\d:?\d\d$/.test(s) ? new Date(s).toISOString() : new Date(s + 'Z').toISOString(); }
function pancakeToClose(o) {
  const nm = (x) => (x && typeof x === 'object' ? String(x.name || '').trim() : '');
  return {
    extId: 'pc:' + (o.id || o.system_id),
    name: String(o.bill_full_name || (o.customer && o.customer.name) || '').trim() || 'ลูกค้า Pancake',
    phone: String(o.bill_phone_number || (o.customer && (o.customer.phone_numbers || [])[0]) || ''),
    address: pcAddress(o),
    page: (o.page && o.page.name) || o.order_sources_name || '',
    items: pcItems(o),
    total: (Number(o.total_price_after_sub_discount || o.total_price) || 0) / 100,
    date: pcTime(o.inserted_at),
    closerName: nm(o.assigning_seller) || nm(o.creator) || nm(o.marketer) || 'Pancake',
    source: 'pancake',
  };
}
// Pancake order status → shipping state shown to telesales
const PC_SHIP = { 0: ['new', 'ออเดอร์ใหม่'], 17: ['new', 'รอยืนยัน'], 11: ['wait', 'รอสินค้าเข้า'], 12: ['pack', 'รอพิมพ์ใบปะหน้า'], 13: ['pack', 'พิมพ์ใบปะหน้าแล้ว'], 20: ['new', 'สั่งซื้อแล้ว'], 1: ['new', 'ยืนยันแล้ว'], 8: ['pack', 'กำลังแพ็ค'], 9: ['pack', 'รอขนส่งเข้ารับ'], 2: ['ship', 'กำลังจัดส่ง'], 3: ['done', 'ส่งถึงลูกค้าแล้ว'], 16: ['done', 'ส่งถึงแล้ว : เก็บเงินแล้ว'], 4: ['back', 'กำลังตีกลับ'], 15: ['back', 'คืนบางส่วน'], 5: ['back', 'ตีกลับแล้ว'], 6: ['cancel', 'ยกเลิก'], 7: ['cancel', 'ลบแล้ว'] };
function pcShip(o) {
  const st = PC_SHIP[o.status] || ['new', String(o.status_name || o.status || '')];
  const pt = o.partner || {};
  const hist = (o.status_history || []).filter((h) => h.status === o.status).pop();
  return { code: st[0], label: st[1], tracking: String(pt.extend_code || '').trim(), carrier: String(pt.partner_name || '').trim(), link: o.tracking_link || '', sentAt: o.time_send_partner ? pcTime(o.time_send_partner) : '', at: hist && hist.updated_at ? pcTime(hist.updated_at) : pcTime(o.updated_at || o.inserted_at) };
}
// copy shipping state onto the matching hub orders (orders created from Pancake carry extId pc:<id>)
function applyShipping(state, raws) {
  const idx = new Map();
  for (const c of state.customers) for (const o of c.orders || []) if (o.extId && o.extId.startsWith('pc:')) idx.set(o.extId, o);
  let n = 0;
  for (const r of raws) {
    const o = idx.get('pc:' + (r.id || r.system_id)); if (!o) continue;
    const sh = pcShip(r), old = o.ship || {};
    if (old.code !== sh.code || old.tracking !== sh.tracking || old.label !== sh.label) { o.ship = sh; n++; }
  }
  return n;
}
// Pancake orders as simple rows for the cancel / return report (cached 10 min; reads back until the requested start day)
const QCACHE = { at: 0, oldest: '', rows: [] };
const PC_KIND = { 6: 'cancel', 4: 'back', 5: 'back', 15: 'back', 3: 'done', 16: 'done', 2: 'ship' };
async function pancakeQualityRows(fromDay) {
  if (!PANCAKE_API_KEY) throw new Error('ยังไม่ได้ตั้งค่า PANCAKE_API_KEY');
  if (QCACHE.at > Date.now() - 10 * 60000 && QCACHE.oldest && QCACHE.oldest <= fromDay) return QCACHE.rows;
  const rows = []; let oldest = '9999';
  for (let p = 1; p <= 60; p++) {
    const j = await pancakeFetch(p, 100);
    for (const o of j.data) {
      if (String(o.status) === '7') continue;                       // deleted in Pancake
      const at = pcTime(o.inserted_at), d = H.dayKey(at); if (d < oldest) oldest = d;
      const nm = (x) => (x && typeof x === 'object' ? String(x.name || '').trim() : '');
      rows.push({ at, admin: nm(o.assigning_seller) || nm(o.creator) || 'ไม่ระบุ', page: (o.page && o.page.name) || o.order_sources_name || 'ไม่ระบุเพจ', kind: PC_KIND[o.status] || 'open',
        total: (Number(o.total_price_after_sub_discount || o.total_price) || 0) / 100, reason: o.returned_reason_name || '' });
    }
    if (oldest < fromDay || j.data.length < 100 || p >= (j.total_pages || 1)) { if (j.data.length < 100 || p >= (j.total_pages || 1)) oldest = '0000'; break; }
  }
  Object.assign(QCACHE, { at: Date.now(), oldest, rows });
  return rows;
}
async function pancakeShipSync(state, pages) {
  if (!PANCAKE_API_KEY) return { updated: 0 };
  const raws = [];
  for (let p = 1; p <= (pages || 10); p++) { const j = await pancakeFetch(p, 100); raws.push(...j.data); if (j.data.length < 100 || p >= (j.total_pages || 1)) break; }
  const updated = applyShipping(state, raws);
  { const keys = []; for (const c of state.customers) for (const o of c.orders || []) if (o.extId && o.extId.startsWith('pc:')) keys.push(o.extId);
    console.log('[ship] hub pancake orders', keys.length, 'sample', keys.slice(-3).join(','), '| pancake ids', raws.slice(0, 3).map((r) => r.id + '/' + r.system_id).join(',')); }
  state.sync.pancake = { ...(state.sync.pancake || {}), shipRun: new Date().toISOString(), shipUpdated: updated };
  return { updated, scanned: raws.length };
}
async function pancakeFetch(page, size) {
  const url = PANCAKE_HOST + '/shops/' + PANCAKE_SHOP_ID + '/orders?api_key=' + encodeURIComponent(PANCAKE_API_KEY) + '&page_number=' + page + '&page_size=' + (size || 100);
  const r = await fetch(url);
  const j = await r.json().catch(() => null);
  if (!j || j.success !== true || !Array.isArray(j.data)) throw new Error('Pancake ตอบกลับไม่ถูกต้อง (HTTP ' + r.status + ')');
  return j;
}
// opts.backfillDays: also import older orders as history (not sent to telesales again)
async function pancakePull(state, opts) {
  opts = opts || {};
  const sync = state.sync.pancake = state.sync.pancake || {};
  if (!PANCAKE_API_KEY) { sync.lastError = 'ยังไม่ได้ตั้งค่า PANCAKE_API_KEY'; return { added: 0 }; }
  if (!sync.startedAt) sync.startedAt = new Date().toISOString();
  const baseline = Date.parse(sync.startedAt);
  const backfillFrom = opts.backfillDays ? Date.now() - opts.backfillDays * 86400000 : null;
  let added = 0, history = 0, scanned = 0, shipped = 0;
  const raws = [];
  try {
    const pages = opts.backfillDays ? 30 : 3;
    let stopNew = false;
    for (let p = 1; p <= pages; p++) {
      const j = await pancakeFetch(p, 100);
      raws.push(...j.data);
      if (stopNew) { if (j.data.length < 100 || p >= (j.total_pages || 1)) break; continue; }
      const orders = j.data.slice().sort((a, b) => Date.parse(pcTime(a.inserted_at)) - Date.parse(pcTime(b.inserted_at)));
      let older = false;
      for (const o of orders) {
        scanned++;
        if (SKIP.has(String(o.status))) continue;
        const t = Date.parse(pcTime(o.inserted_at));
        const close = pancakeToClose(o);
        if (H.normPhone(close.phone).length < 9) continue;
        if (t >= baseline) {
          const r = H.apply(state, 'createClose', close, SYSTEM);
          if (!r.duplicate) added++;
        } else if (backfillFrom && t >= backfillFrom) {
          const r = H.apply(state, 'createClose', close, SYSTEM);
          if (!r.duplicate) {
            const ap = state.approvals.find((a) => a.id === r.id);
            if (ap && ap.status === 'pending') ap.status = 'history';   // old sale: record revenue only
            history++;
          }
        } else older = true;
      }
      if (j.data.length < 100 || p >= (j.total_pages || 1)) break;
      if (older) stopNew = true;   // keep reading a few pages only to refresh shipping status
    }
    shipped = applyShipping(state, raws);
    Object.assign(sync, { lastRun: new Date().toISOString(), lastAdded: added, lastHistory: history, lastScanned: scanned, lastShip: shipped, lastError: null });
  } catch (e) {
    Object.assign(sync, { lastRun: new Date().toISOString(), lastError: String(e.message || e) });
  }
  return { added, history, scanned, error: sync.lastError };
}

// ------------------------------------------------------------------ OneCall (dtac OrkTrack)
const OC_HOST = 'https://onecallvoicerecord.dtac.co.th';
const OC_USER = process.env.ONECALL_USER || '';
const OC_PASS = process.env.ONECALL_PASS || '';
const oc = { token: process.env.ONECALL_TOKEN || null };
function ocToken(text, headers) {
  for (const h of ['authorization', 'x-auth-token', 'token', 'x-session-token']) { const v = headers.get(h); if (v && v.length >= 20) return v.replace(/^Bearer\s+/i, '').trim(); }
  try { const j = JSON.parse(text); for (const k of ['token', 'sessionToken', 'authToken', 'session', 'sessionId', 'id', 'accessToken']) { if (j && typeof j[k] === 'string' && j[k].length >= 20) return j[k]; if (j && j.data && typeof j.data[k] === 'string' && j.data[k].length >= 20) return j.data[k]; } }
  catch (_) { const t = String(text || '').trim(); if (/^[0-9a-fA-F-]{20,64}$/.test(t)) return t; }
  return null;
}
async function onecallLogin(state) {
  if (!OC_USER || !OC_PASS) return false;
  const basic = 'Basic ' + Buffer.from(OC_USER + ':' + OC_PASS).toString('base64');
  for (const [method, mode] of [['PUT', 'basic'], ['PUT', 'json'], ['PATCH', 'basic'], ['GET', 'basic']]) {
    try {
      const headers = { Accept: 'application/json', 'Content-Type': 'application/json' };
      if (mode === 'basic') headers.Authorization = basic;
      const r = await fetch(OC_HOST + '/orktrack/rest/users/sessions', { method, headers, body: mode === 'json' ? JSON.stringify({ username: OC_USER, password: OC_PASS }) : undefined, redirect: 'manual' });
      const tok = ocToken(await r.text().catch(() => ''), r.headers);
      if (tok) { oc.token = tok; state.sync.onecall.token = tok; return true; }
    } catch (_) { /* try next */ }
  }
  return false;
}
async function onecallPull(state, days) {
  const sync = state.sync.onecall = state.sync.onecall || {};
  if (!oc.token && sync.token) oc.token = sync.token;
  if (!oc.token && !(await onecallLogin(state))) { sync.lastError = OC_USER ? 'เข้าสู่ระบบ OneCall ไม่สำเร็จ' : 'ยังไม่ได้ตั้งค่า ONECALL_USER / ONECALL_PASS'; return { added: 0 }; }
  const d = new Date(Date.now() + 7 * 3600000 - ((days || 2) - 1) * 86400000).toISOString().slice(0, 10).replace(/-/g, '') + '_000000';
  const all = [];
  try {
    for (let page = 1, retried = false; page <= 40; page++) {
      const r = await fetch(OC_HOST + '/orktrack/rest/recordings?range=custom&startdate=' + d + '&page=' + page + '&pagesize=500&maxresults=-1', { headers: { Authorization: oc.token, Accept: 'application/json' } });
      if ((r.status === 401 || r.status === 403) && !retried) { retried = true; oc.token = null; if (await onecallLogin(state)) { page--; continue; } }
      if (!r.ok) throw new Error('OneCall HTTP ' + r.status);
      const j = await r.json();
      const objs = (j && j.objects) || [];
      for (const o of objs) all.push({ id: o.id, timestamp: o.timestamp, duration: o.duration, localParty: o.localParty, remoteParty: o.remoteParty, direction: o.direction });
      if (objs.length < 500) break;
    }
    const res = H.apply(state, 'ingestOnecall', { records: all }, SYSTEM);
    sync.lastError = null;
    return res;
  } catch (e) { sync.lastError = String(e.message || e); return { added: 0 }; }
}

// ------------------------------------------------------------------ old system import
const LEGACY_STATUS = { new: 'new', contacting: 'followup', interested: 'warm', followup: 'followup', awaiting_payment: 'awaiting_payment', won: 'won', lost: 'lost' };
const LEGACY_SRC = { pancake: ['fb', 'pancake'], manual: ['fb', 'manual'], refill: ['fb', 'manual'], bigseller: ['ecom', 'evolution'], lazada: ['ecom', 'lazada'], shopee: ['ecom', 'shopee'], tiktok: ['ecom', 'tiktok'], evolution: ['ecom', 'evolution'], marketplace: ['ecom', 'evolution'] };
// which marketplace a record belongs to: explicit fields first, then any single mention in the record; unknown → 'evolution'
function detectPlatform(a) {
  const hit = (t) => { t = String(t || '').toLowerCase(); const f = [['shopee', /shopee|ช้อปปี้/], ['tiktok', /tiktok|tik tok|ติ๊กต็อก/], ['lazada', /lazada|ลาซาด้า/]].filter(([, re]) => re.test(t)).map(([k]) => k); return f.length === 1 ? f[0] : ''; };
  return hit([a.platform, a.shop, a.store, a.marketplace, a.channel, a.shopName, a.storeName].filter(Boolean).join(' ')) || hit(JSON.stringify(a)) || 'evolution';
}
// one-time fix: old-system BigSeller/marketplace customers were all tagged Lazada
function fixPlatforms(state, old) {
  let fixed = 0;
  for (const a of (old && old.assigned) || []) {
    if (!['bigseller', 'marketplace'].includes(String(a.source || '').toLowerCase())) continue;
    const c = H.byPhone(state, H.normPhone(a.phone));
    if (!c || c.channel !== 'ecom' || c.platform !== 'lazada') continue;
    const p = detectPlatform(a); if (p !== c.platform) { c.platform = p; fixed++; }
  }
  return fixed;
}
function importLegacy(state, old) {
  if (!old || !Array.isArray(old.assigned)) return { customers: 0 };
  const sideToUser = { W: 'wan', K: 'khem' };
  let customers = 0, orders = 0, appts = 0, calls = 0;
  for (const a of old.assigned) {
    if (a.archived && !(a.orders || []).length) continue;
    const phone = H.normPhone(a.phone);
    if (phone.length < 9 || H.byPhone(state, phone)) continue;
    let [channel, platform] = LEGACY_SRC[String(a.source || '').toLowerCase()] || ['fb', 'manual'];
    if (platform === 'evolution') platform = detectPlatform(a);
    const c = {
      id: H.uid('c'), name: String(a.name || '').trim(), phone, address: String(a.address || ''), channel, platform,
      page: a.page || '', owner: sideToUser[a.sales] || null, status: LEGACY_STATUS[a.leadStatus] || 'new',
      round: channel === 'fb' ? (['T1', 'T2', 'T3'].includes(String(a.step || '').toUpperCase()) ? String(a.step).toUpperCase() : 'T1') : '',
      tags: a.archived ? ['เก็บถาวรในระบบเดิม'] : [], orders: [], notes: [], closerName: a.closer || '',
      createdAt: a.receivedAt || new Date().toISOString(), assignedAt: a.receivedAt || null, updatedAt: a.updatedAt || a.receivedAt || null,
      lastContactAt: null, nextApptAt: null, callCount: a.callCount || 0, legacyCode: a.code || '',
    };
    for (const o of (a.orders || [])) {
      const t = Date.parse(o.date); if (isNaN(t)) continue;
      c.orders.push({ id: H.uid('o'), date: new Date(t).toISOString(), items: (o.items || []).map((i) => ({ name: String(i.name || ''), qty: Number(i.qty) || 1, price: Number(i.price) || 0 })), total: Number(o.amount) || 0,
        status: /ยกเลิก|cancel/i.test(o.status || '') ? 'cancelled' : 'paid', source: o.src === 'pancake' ? 'pancake' : 'legacy', extId: o.id ? 'legacy:' + o.id : '', note: o.status || '' });
      orders++;
    }
    if (!c.orders.length && (a.product || a.orderAmount)) {
      c.orders.push({ id: H.uid('o'), date: a.lastOrderAt || a.receivedAt || new Date().toISOString(), items: a.product ? [{ name: String(a.product).slice(0, 120), qty: 1, price: Number(a.orderAmount) || 0 }] : [], total: Number(a.orderAmount) || 0, status: 'paid', source: 'legacy' });
      orders++;
    }
    c.orders.sort((x, y) => Date.parse(y.date) - Date.parse(x.date));
    for (const h of (a.history || []).slice(-60).reverse()) {
      if (!h || !h.at) continue;
      c.notes.push({ id: H.uid('n'), at: h.at, by: h.by || 'ระบบเดิม', kind: h.k === 'call' ? 'call' : 'note', text: [h.k, h.v].filter(Boolean).join(' : ').slice(0, 300) });
    }
    if (a.note) c.notes.unshift({ id: H.uid('n'), at: a.updatedAt || a.receivedAt || new Date().toISOString(), by: 'ระบบเดิม', kind: 'note', text: String(a.note).slice(0, 500) });
    for (const call of (a.calls || [])) { if (call && call.at) { c.lastContactAt = !c.lastContactAt || call.at > c.lastContactAt ? call.at : c.lastContactAt; calls++; } }
    const t = Date.parse(a.nextAppt);
    if (!isNaN(t) && c.owner) {
      state.appointments.push({ id: H.uid('a'), customerId: c.id, owner: c.owner, at: new Date(t).toISOString(), purpose: 'นัดจากระบบเดิม', round: c.round, done: false, createdAt: new Date().toISOString(), by: 'legacy' });
      c.nextApptAt = new Date(t).toISOString(); appts++;
    }
    state.customers.push(c); customers++;
  }
  // OneCall history (side W/K → user)
  if (Array.isArray(old.onecall)) {
    const seen = new Set(state.onecall.map((r) => r.id));
    for (const r of old.onecall) {
      const user = sideToUser[r.side]; if (!user || seen.has(String(r.id))) continue;
      state.onecall.push({ id: String(r.id), user, phone: H.normPhone(r.phone), dur: r.dur || 0, at: r.at, dir: r.dir || '' });
    }
  }
  state.sync.legacy = { importedAt: new Date().toISOString(), customers, orders, appts, calls };
  return state.sync.legacy;
}

// ------------------------------------------------------------------ E-Commerce (Evolution / BigSeller customers)
// The Evolution web app only works with a session token. The old system already receives that token (browser script)
// and keeps it in its database, so we read it from there and pull the newest customers every few minutes.
const EVO_API = 'https://app.evolutionecommerce.co.th:8443/api/person/getPersons/CUSTOMER/find';
const codeNum = (x) => { const n = parseInt(String(x || '').replace(/\D/g, ''), 10); return isNaN(n) ? 0 : n; };
async function evoPull(state, getLegacy) {
  const sync = state.sync.bigseller = state.sync.bigseller || {};
  let token = process.env.EVO_TOKEN || null, facility = 'WebStoreWarehouse';
  try { const old = getLegacy ? await getLegacy() : null; if (old && old.evo && old.evo.token) { token = old.evo.token; facility = old.evo.facility || facility; } } catch (e) { sync.lastError = 'อ่าน token จากระบบเดิมไม่ได้'; }
  if (!token) { sync.lastError = 'ยังไม่มี token ของ Evolution (เปิดหน้า Evolution ที่ติดตั้งสคริปต์ไว้ 1 ครั้ง)'; return { added: 0 }; }
  const body = { filter: { FACILITY_ID: facility }, paginator: { page: 1, pageSize: 500, total: 0, pageSizes: [] }, sorting: { column: 'PARTY_ID', direction: 'desc' }, searchTerm: '', grouping: { selectedRowIds: {}, itemIds: [], selectAll: false } };
  const r = await fetch(EVO_API, { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-access-token': token }, body: JSON.stringify(body) });
  if (r.status === 401 || r.status === 403) { sync.lastError = 'token ของ Evolution หมดอายุ : เปิดหน้า Evolution 1 ครั้งเพื่อต่ออายุ'; return { added: 0 }; }
  if (!r.ok) { sync.lastError = 'Evolution HTTP ' + r.status; return { added: 0 }; }
  const j = await r.json();
  const list = (j.items || []).map((it) => { const p = it.person || {}; return { code: it.PARTY_ID, name: [p.FIRST_NAME, p.MIDDLE_NAME, p.LAST_NAME].filter((x) => x && String(x).trim()).join(' ').trim(), phone: (it.telecomNumber && it.telecomNumber.CONTACT_NUMBER) || '' }; });
  const top = Math.max(0, ...list.map((c) => codeNum(c.code)));
  if (sync.lastCode == null) {   // first run: start after the newest customer we already have, never back-fill the whole history
    const known = Math.max(0, ...state.customers.map((c) => codeNum(c.legacyCode)));
    sync.lastCode = known || top;
  }
  const fresh = list.filter((c) => codeNum(c.code) > sync.lastCode).sort((a, b) => codeNum(a.code) - codeNum(b.code)).slice(0, 300);
  const res = fresh.length ? H.apply(state, 'ingestEcom', { rows: fresh.map((c) => ({ name: c.name, phone: c.phone, code: c.code, platform: 'evolution' })) }, SYSTEM) : { added: 0 };
  if (fresh.length) sync.lastCode = Math.max(sync.lastCode, ...fresh.map((c) => codeNum(c.code)));
  sync.lastRun = new Date().toISOString(); sync.lastError = null; sync.lastPulled = list.length; sync.lastAdded = res.added || 0;
  return res;
}

module.exports = { pancakeQualityRows, pancakeShipSync, detectPlatform, fixPlatforms, evoPull, pancakePull, pancakeToClose, onecallPull, importLegacy, status: () => ({ pancake: !!PANCAKE_API_KEY, onecall: !!(OC_USER && OC_PASS) || !!oc.token }) };
