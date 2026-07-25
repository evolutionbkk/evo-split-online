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

function nextSide(assigned) {
  let w = 0, k = 0;
  for (const a of assigned) { if (a.sales === 'W') w++; else k++; }
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
    assigned.push(rec);
  }
  return { assigned, maxRound: 1 };
}

// Append only new valid records to an existing state. Existing assignments never change.
// Returns summary {added, addW, addK, dup, cut, round, date}
function applyNew(state, records, label) {
  const seen = new Set(state.assigned.map(keyOf));
  const fresh = [];
  let dup = 0, cut = 0;
  for (const r of records) {
    const rec = { code: (r.code || '').trim(), name: (r.name || '').trim(), phone: cleanPhone(r.phone) };
    if (!(rec.code || rec.name || rec.phone)) continue;
    if (!isValid(rec.phone)) { cut++; continue; }
    const k = keyOf(rec);
    if (seen.has(k)) { dup++; continue; }
    seen.add(k);
    fresh.push(rec);
  }
  let round = state.maxRound, date = '';
  let addW = 0, addK = 0;
  if (fresh.length) {
    const firstEver = state.assigned.length === 0;
    round = firstEver ? 1 : state.maxRound + 1;
    state.maxRound = Math.max(state.maxRound, round);
    date = (label && String(label).trim()) ? String(label).trim() : todayTH();
    for (const rec of fresh) {
      const side = nextSide(state.assigned);
      rec.sales = side;
      rec.round = round;
      rec.date = date;
      rec.exported = false; // รายใหม่ ยังไม่เคยส่ง
      state.assigned.push(rec);
      if (side === 'W') addW++; else addK++;
    }
  }
  return { added: fresh.length, addW, addK, dup, cut, round, date };
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

function listSide(state, side) { return state.assigned.filter((a) => a.sales === side); }

module.exports = { BASE_DATE, cleanPhone, isValid, roundName, buildSeed, applyNew, parseRows, listSide };
