// Core logic: filter Thai phone, dedupe by member code, alternate-fill W/K, stamp round/date.
'use strict';

const BASE_DATE = '25/07/2569'; // วันที่ดึงข้อมูลตั้งต้น

const cleanPhone = (s) => String(s == null ? '' : s).replace(/\D/g, '');
const isValid = (p) => /^0[2689]\d{8}$/.test(cleanPhone(p)); // 10 หลัก ขึ้นต้น 02/06/08/09
const keyOf = (r) => {
  const c = (r.code && String(r.code).trim()) ? String(r.code).trim() : '';
  return c ? 'C:' + c : 'NP:' + String(r.name || '').trim() + '|' + cleanPhone(r.phone);
};
const roundName = (n) => (n === 1 ? 'ตั้งต้น' : 'รอบ ' + n);

function todayTH() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  return p(d.getDate()) + '/' + p(d.getMonth() + 1) + '/' + (d.getFullYear() + 543);
}
// Thailand-calendar day key (UTC+7) for a timestamp (or now) — used for the per-day pull quota.
function thaiDay(ts) {
  const t = ts ? Date.parse(ts) : Date.now();
  if (isNaN(t)) return '';
  return new Date(t + 7 * 3600000).toISOString().slice(0, 10);
}

const otherSide = (s) => (s === 'W' ? 'K' : 'W');
// If `side` is on leave today and the other side is working, return the other side; else null.
function offRedirect(off, side) {
  off = off || {};
  return (off[side] && !off[otherSide(side)]) ? otherSide(side) : null;
}
function nextSide(assigned, off) {
  off = off || {};
  if (off.W && !off.K) return 'K';   // Namwhan on leave → everything to Khem
  if (off.K && !off.W) return 'W';   // Khem on leave → everything to Namwhan
  let w = 0, k = 0;
  for (const a of assigned) { if (a.archived) continue; if (a.sales === 'W') w++; else k++; }
  return w <= k ? 'W' : 'K';
}

// Build a fresh state from a list of raw records (used for seeding). Deterministic alternate split.
function buildSeed(records) {
  const assigned = [];
  const seen = new Set();
  for (const r of records) {
    if (!isValid(r.phone)) continue;
    const rec = { code: (r.code || '').trim(), name: (r.name || '').trim(), phone: cleanPhone(r.phone) };
    const k = keyOf(rec);
    if (seen.has(k)) continue;
    seen.add(k);
    rec.sales = nextSide(assigned);
    rec.round = 1;
    rec.date = BASE_DATE;
    rec.exported = false; // ยังไม่เคยดาวน์โหลด/ส่งให้เซลล์
    rec.receivedAt = new Date().toISOString();
    assigned.push(rec);
  }
  return { assigned, maxRound: 1 };
}

// Append only new valid records to an existing state. Existing assignments never change.
// Returns summary {added, addW, addK, dup, cut, round, date}
// opts.dailyCapPerSide (e.g. 50): cap Evolution intake to N new leads per side PER Thai-day,
// split evenly W/K. Leftover fresh records are left un-added (they reappear on the next pull/day).
function applyNew(state, records, label, opts) {
  opts = opts || {};
  const cap = Number(opts.dailyCapPerSide) > 0 ? Number(opts.dailyCapPerSide) : 0;
  const seen = new Set(state.assigned.map(keyOf));
  // cross-source guard: never add a phone that is already an ACTIVE lead from any source
  const activePhones = new Set(state.assigned.filter((a) => !a.archived).map((a) => cleanPhone(a.phone)).filter(Boolean));
  const fresh = [];
  let dup = 0, cut = 0;
  for (const r of records) {
    const rec = { code: (r.code || '').trim(), name: (r.name || '').trim(), phone: cleanPhone(r.phone) };
    if (!(rec.code || rec.name || rec.phone)) continue;
    if (!isValid(rec.phone)) { cut++; continue; }
    const k = keyOf(rec);
    if (seen.has(k) || activePhones.has(rec.phone)) { dup++; continue; }
    seen.add(k); activePhones.add(rec.phone);
    fresh.push(rec);
  }
  let round = state.maxRound, date = '';
  let addW = 0, addK = 0, capped = 0;
  if (fresh.length) {
    const firstEver = state.assigned.length === 0;
    round = firstEver ? 1 : state.maxRound + 1;
    state.maxRound = Math.max(state.maxRound, round);
    date = (label && String(label).trim()) ? String(label).trim() : todayTH();
    // remaining daily quota per side (Evolution/auto leads only; manual distribution is separate)
    let capW = Infinity, capK = Infinity;
    if (cap) {
      const today = thaiDay();
      let tW = 0, tK = 0;
      for (const a of state.assigned) {
        if (a.archived || a.source === 'manual') continue;
        if (thaiDay(a.receivedAt) !== today) continue;
        if (a.sales === 'K') tK++; else tW++;
      }
      capW = Math.max(0, cap - tW); capK = Math.max(0, cap - tK);
    }
    const forcedSide = (opts.off && opts.off.W && !opts.off.K) ? 'K' : ((opts.off && opts.off.K && !opts.off.W) ? 'W' : null);
    for (const rec of fresh) {
      let side;
      if (forcedSide) {
        side = forcedSide; // a salesperson is on leave → the working one takes every new lead
      } else if (cap) {
        if (capW <= 0 && capK <= 0) break; // daily quota full
        if (capW <= 0) side = 'K'; else if (capK <= 0) side = 'W'; else side = capW >= capK ? 'W' : 'K';
      } else {
        side = nextSide(state.assigned, opts.off);
      }
      rec.sales = side;
      rec.round = round;
      rec.date = date;
      rec.exported = false; // รายใหม่ ยังไม่เคยส่ง
      rec.receivedAt = new Date().toISOString();
      state.assigned.push(rec);
      if (side === 'W') { addW++; capW--; } else { addK++; capK--; }
    }
    capped = fresh.length - (addW + addK); // fresh leads held back by the quota
  }
  return { added: addW + addK, addW, addK, dup, cut, capped, round, date };
}

// Parse pasted text (copied from the Evolution table, or code,name,phone lines).
const ACTION_WORDS = ['ดูข้อมูล', 'แก้ไข', 'เปลี่ยนประเภท', 'ลบ'];
function parseRows(text) {
  const out = [];
  const lines = String(text || '').split(/\r?\n/);
  for (const raw of lines) {
    if (!raw.trim()) continue;
    let parts = raw.includes('\t') ? raw.split('\t') : (raw.includes(',') ? raw.split(',') : raw.split(/\s{2,}/));
    parts = parts.map((p) => p.trim()).filter((p) => p !== '' && !ACTION_WORDS.includes(p));
    if (!parts.length) continue;
    if (/รหัส|เบอร์|ชื่อ/.test(raw) && !/\d{6,}/.test(raw)) continue;
    if (/^(code|member|name|phone|tel)\b/i.test(parts[0]) && !/\d{6,}/.test(raw)) continue;
    let phoneIdx = -1;
    for (let i = parts.length - 1; i >= 0; i--) { if (cleanPhone(parts[i]).length >= 9) { phoneIdx = i; break; } }
    let code = '', name = '', phone = '';
    if (phoneIdx >= 0) {
      phone = parts[phoneIdx];
      const rest = parts.slice(0, phoneIdx);
      if (rest.length >= 2) { code = rest[0]; name = rest.slice(1).join(' '); }
      else if (rest.length === 1) { if (/^[A-Za-z]{2,}\d/.test(rest[0]) || /^\d{5,}$/.test(rest[0])) code = rest[0]; else name = rest[0]; }
    } else { code = parts[0] || ''; name = parts.slice(1).join(' '); }
    out.push({ code, name, phone });
  }
  return out;
}

// Import manually-assigned leads (admin pastes rows from the order Google Sheet).
// Each row may carry an explicit side (from the "Telesale" column) plus order context
// (address / product / amount / page / closer). Dedupe by phone against active leads.
// opts: { step:'T1'|'T2'|'T3', label, by }
function applyManual(state, rows, opts) {
  opts = opts || {};
  const step = ['T1', 'T2', 'T3'].includes(opts.step) ? opts.step : 'T1';
  const activePhones = new Set(state.assigned.filter((a) => !a.archived).map((a) => cleanPhone(a.phone)).filter(Boolean));
  const parsed = [];
  let dup = 0, cut = 0;
  for (const r of (rows || [])) {
    const rec = {
      code: String((r && r.code) || '').trim(),
      name: String((r && r.name) || '').trim(),
      phone: cleanPhone(r && r.phone),
    };
    if (!(rec.name || rec.phone)) continue;
    if (!isValid(rec.phone)) { cut++; continue; }
    if (activePhones.has(rec.phone)) { dup++; continue; }
    activePhones.add(rec.phone);
    let amt = Number(String((r && r.amount) != null ? r.amount : '').replace(/[^0-9.]/g, ''));
    if (!isFinite(amt) || amt < 0) amt = 0;
    parsed.push({
      code: rec.code, name: rec.name, phone: rec.phone,
      side: (r && r.side) === 'K' ? 'K' : ((r && r.side) === 'W' ? 'W' : null),
      address: String((r && r.address) || '').slice(0, 500),
      product: String((r && r.product) || '').slice(0, 200),
      orderAmount: Math.round(amt * 100) / 100,
      page: String((r && r.page) || '').slice(0, 120),
      closer: String((r && r.closer) || '').slice(0, 120),
      lastOrderAt: (r && r.lastOrderAt) || null,
      nextAppt: String((r && r.nextAppt) || '').slice(0, 40),
      leadStatus: (r && r.leadStatus) || 'new',
      ltv: (r && typeof r.ltv === 'number') ? r.ltv : null,
      succeedOrders: (r && typeof r.succeedOrders === 'number') ? r.succeedOrders : null,
    });
  }
  let round = state.maxRound, date = '', addW = 0, addK = 0;
  if (parsed.length) {
    const firstEver = state.assigned.length === 0;
    round = firstEver ? 1 : state.maxRound + 1;
    state.maxRound = Math.max(state.maxRound, round);
    date = (opts.label && String(opts.label).trim()) ? String(opts.label).trim() : todayTH();
    for (const p of parsed) {
      let side = p.side || nextSide(state.assigned, opts.off);
      const redir = offRedirect(opts.off, side); if (redir) side = redir; // on-leave side → other
      const nowIso = new Date().toISOString();
      state.assigned.push({
        code: p.code, name: p.name, phone: p.phone,
        sales: side, round, date, exported: true, receivedAt: nowIso,
        source: opts.source || 'manual', step, stepManual: !!opts.stepManual, distributedBy: opts.distributedBy || opts.by || '',
        ...(opts.fromExcel ? { fromExcel: true } : {}),
        address: p.address, product: p.product, orderAmount: p.orderAmount,
        page: p.page, closer: p.closer, lastOrderAt: p.lastOrderAt || null,
        nextAppt: p.nextAppt || '',
        ...(p.ltv != null ? { ltv: p.ltv } : {}), ...(p.succeedOrders != null ? { succeedOrders: p.succeedOrders } : {}),
        leadStatus: ['new','contacting','interested','followup','awaiting_payment','won','lost'].includes(p.leadStatus) ? p.leadStatus : 'new', callCount: 0, calls: [],
        history: [{ at: nowIso, by: opts.by || 'admin', k: 'import', v: step }],
      });
      if (side === 'W') addW++; else addK++;
    }
  }
  return { added: parsed.length, addW, addK, dup, cut, round, date };
}

// ===== Teamlead manual distribution: holding pool → distribute by source/mode =====
const isFbSource = (s) => (s === 'pancake' || s === 'manual' || s === 'refill');

// Pull new leads into a HOLDING POOL without assigning them to a seller (sales=null, pooled=true).
// Dedupe by member code + against any active/pooled phone. Preserves order context if present.
// opts: { label, source, by }
function applyNewPool(state, records, opts) {
  opts = opts || {};
  const source = opts.source || 'evolution';
  const seen = new Set(state.assigned.map(keyOf));
  const activePhones = new Set(state.assigned.filter((a) => !a.archived).map((a) => cleanPhone(a.phone)).filter(Boolean));
  const nowIso = new Date().toISOString();
  const date = (opts.label && String(opts.label).trim()) ? String(opts.label).trim() : todayTH();
  let added = 0, dup = 0, cut = 0;
  for (const r of (records || [])) {
    const rec = { code: String((r && r.code) || '').trim(), name: String((r && r.name) || '').trim(), phone: cleanPhone(r && r.phone) };
    if (!(rec.code || rec.name || rec.phone)) continue;
    if (!isValid(rec.phone)) { cut++; continue; }
    const k = keyOf(rec);
    if (seen.has(k) || activePhones.has(rec.phone)) { dup++; continue; }
    seen.add(k); activePhones.add(rec.phone);
    let amt = Number(String((r && r.orderAmount != null ? r.orderAmount : (r && r.amount)) || '').toString().replace(/[^0-9.]/g, ''));
    if (!isFinite(amt) || amt < 0) amt = 0;
    state.assigned.push({
      code: rec.code, name: rec.name, phone: rec.phone,
      sales: null, pooled: true, source,
      round: 0, date, exported: false, receivedAt: nowIso,
      address: String((r && r.address) || '').slice(0, 500),
      product: String((r && r.product) || '').slice(0, 200),
      orderAmount: Math.round(amt * 100) / 100,
      page: String((r && r.page) || '').slice(0, 120),
      closer: String((r && r.closer) || '').slice(0, 120),
      lastOrderAt: (r && r.lastOrderAt) || null,
      ...(r && typeof r.ltv === 'number' ? { ltv: r.ltv } : {}),
      ...(r && typeof r.succeedOrders === 'number' ? { succeedOrders: r.succeedOrders } : {}),
      leadStatus: 'new', callCount: 0, calls: [],
      history: [{ at: nowIso, by: opts.by || 'admin', k: 'pool', v: source }],
    });
    added++;
  }
  return { added, dup, cut };
}

// Count leads waiting in the pool, split by channel.
function poolCounts(state) {
  let mp = 0, fb = 0;
  for (const a of state.assigned) {
    if (!a.pooled || a.sales != null || a.archived) continue;
    if (isFbSource(a.source)) fb++; else mp++;
  }
  return { mp, fb, total: mp + fb };
}

// Distribute pooled leads to sellers. opts:
//   source: 'all'|'mp'|'fb'  (which channel to hand out)
//   mode:   '50' (even split W/K) | 'one' (all to opts.side)
//   side:   'W'|'K'  (for mode 'one')
//   count:  number   (how many to hand out; default = all matching)
//   off:    {W,K}    (a seller on leave takes nothing)
//   by:     actor label
function distributePool(state, opts) {
  opts = opts || {};
  const group = ['mp', 'fb', 'all'].includes(opts.source) ? opts.source : 'all';
  const matchSrc = (a) => group === 'all' ? true : (group === 'fb' ? isFbSource(a.source) : !isFbSource(a.source));
  const pool = state.assigned
    .filter((a) => a.pooled && a.sales == null && !a.archived && matchSrc(a))
    .sort((a, b) => String(a.receivedAt || '').localeCompare(String(b.receivedAt || '')));
  let n = Number(opts.count);
  if (!(n > 0)) n = pool.length;
  n = Math.min(n, pool.length);
  const batch = pool.slice(0, n);
  const nowIso = new Date().toISOString();
  const date = todayTH();
  const off = opts.off || {};
  const mode = opts.mode === 'one' ? 'one' : '50';
  let oneSide = opts.side === 'K' ? 'K' : 'W';
  if (mode === 'one') { const redir = offRedirect(off, oneSide); if (redir) oneSide = redir; }
  const forced50 = (off.W && !off.K) ? 'K' : ((off.K && !off.W) ? 'W' : null);
  let round = state.maxRound || 0;
  if (batch.length) { round = (state.maxRound || 0) + 1; state.maxRound = Math.max(state.maxRound || 0, round); }
  let toW = 0, toK = 0;
  for (let i = 0; i < batch.length; i++) {
    const a = batch[i];
    let side;
    if (mode === 'one') side = oneSide;
    else if (forced50) side = forced50;
    else side = (toW <= toK) ? 'W' : 'K'; // keep the running split even
    a.sales = side; a.pooled = false; a.round = round; a.date = date;
    a.exported = false; a.receivedAt = nowIso;
    a.distributedBy = opts.by || 'Teamlead';
    (a.history = a.history || []).push({ at: nowIso, by: opts.by || 'admin', k: 'distribute', v: side });
    if (side === 'W') toW++; else toK++;
  }
  return { distributed: batch.length, toW, toK, round, date, remaining: pool.length - batch.length };
}

// active (non-archived) records for a side
function listSide(state, side) { return state.assigned.filter((a) => a.sales === side && !a.archived); }
// archived ("removed bin") records for a side
function listArchived(state, side) { return state.assigned.filter((a) => a.sales === side && a.archived); }

module.exports = { BASE_DATE, cleanPhone, isValid, roundName, keyOf, thaiDay, buildSeed, applyNew, applyManual, applyNewPool, poolCounts, distributePool, parseRows, listSide, listArchived };
