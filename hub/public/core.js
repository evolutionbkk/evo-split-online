/* Evolution Hub Commerce — shared business logic.
 * Runs in both Node (server.js) and the browser (demo mode), so the rules for
 * lead distribution, KPI and the executive dashboard live in exactly one place.
 * All state is one plain JSON object; every change goes through apply(state, type, payload, actor).
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.HubCore = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  // ---------------------------------------------------------------- constants
  const TZ = 7 * 3600000; // Asia/Bangkok
  const ROLES = {
    exec: { label: 'ผู้บริหาร', en: 'Executive' },
    lead: { label: 'หัวหน้าทีม', en: 'Teamlead' },
    tele: { label: 'Telesales', en: 'Telesales' },
    admin: { label: 'Admin Sales', en: 'Admin Sales' },
  };
  const DEFAULT_USERS = [
    { id: 'at', name: 'คุณอัท', role: 'exec', title: 'ผู้บริหาร', initial: 'อ' },
    { id: 'mo', name: 'คุณโม', role: 'lead', title: 'Teamlead (สิทธิ์ผู้บริหาร)', initial: 'ม' },
    { id: 'khem', name: 'พี่เขม', role: 'tele', title: 'Telesales', initial: 'ข', code: 'K' },
    { id: 'wan', name: 'พี่หวาน', role: 'tele', title: 'Telesales', initial: 'ห', code: 'W' },
    { id: 'laila', name: 'ไลลา', role: 'admin', title: 'Admin Sales', initial: 'ล' },
    { id: 'admin2', name: 'แอดมิน 2', role: 'admin', title: 'Admin Sales (ตั้งชื่อในหน้าตั้งค่า)', initial: '2' },
  ];
  // Call results (from the Telesales KPI spec). talked=false → counts as "ไม่ได้คุย".
  const RESULTS = [
    { id: 'won', label: 'ปิดการขายสำเร็จ', group: 'ปิดได้', tone: 'good', talked: true },
    { id: 'awaiting_payment', label: 'รอชำระเงิน', group: 'ปิดแล้วรอจ่าย', tone: 'good', talked: true },
    { id: 'hot', label: 'สนใจมาก มีโอกาสซื้อสูง', group: 'ลูกค้าร้อน', tone: 'hot', talked: true },
    { id: 'warm', label: 'สนใจ ขอเวลาตัดสินใจ', group: 'ลูกค้าอุ่น', tone: 'warm', talked: true },
    { id: 'info', label: 'ขอรายละเอียดเพิ่ม', group: 'ต้องตามต่อ', tone: 'warm', talked: true },
    { id: 'followup', label: 'นัดติดตาม / นัดวันโทรกลับ', group: 'รอติดตาม', tone: 'info', talked: true },
    { id: 'later', label: 'สนใจ แต่ยังไม่พร้อมซื้อ', group: 'ตามรอบถัดไป', tone: 'info', talked: true },
    { id: 'lost', label: 'ปฏิเสธการซื้อ', group: 'ไม่สำเร็จ', tone: 'bad', talked: true },
    { id: 'no_answer', label: 'ไม่รับสาย / ติดต่อไม่ได้', group: 'ไม่ได้คุย', tone: 'mute', talked: false },
  ];
  const LOST_REASONS = ['ราคาแพง', 'ยังมีของเหลือ', 'ไม่เห็นผล', 'ซื้อช่องทางอื่น', 'ไม่สะดวกคุย', 'อื่น ๆ'];
  const STATUS = {
    new: { label: 'ใหม่', tone: 'info' },
    won: { label: 'ปิดการขาย', tone: 'good' },
    awaiting_payment: { label: 'รอชำระ', tone: 'good' },
    hot: { label: 'ร้อน', tone: 'hot' },
    warm: { label: 'อุ่น', tone: 'warm' },
    info: { label: 'ขอข้อมูล', tone: 'warm' },
    followup: { label: 'นัดติดตาม', tone: 'info' },
    later: { label: 'รอบถัดไป', tone: 'mute' },
    lost: { label: 'ไม่สำเร็จ', tone: 'bad' },
    no_answer: { label: 'ไม่รับสาย', tone: 'mute' },
  };
  const ROUNDS = {
    T1: 'โทรครั้งแรก ต้อนรับ ยืนยันคำสั่งซื้อและการจัดส่ง สร้างความสัมพันธ์',
    T2: 'ถามว่าได้รับของหรือยัง ใช้แล้วเป็นอย่างไร เสนอเพิ่ม/อัปเซล',
    T3: 'เช็กว่าของใกล้หมดหรือยัง ชวนสั่งซ้ำ เสนอโปรซื้อซ้ำ',
  };
  const PLATFORMS = {
    lazada: { label: 'Lazada', channel: 'ecom' },
    shopee: { label: 'Shopee', channel: 'ecom' },
    tiktok: { label: 'TikTok Shop', channel: 'ecom' },
    evolution: { label: 'Evolution', channel: 'ecom' },
    pancake: { label: 'FB Page (Pancake)', channel: 'fb' },
    manual: { label: 'เพิ่มเอง', channel: 'fb' },
  };
  const DEFAULT_PRODUCTS = [
    { code: 'YR1+MC3', name: 'Yanhee Anti-Aging 1 กล่อง', price: 890 },
    { code: 'YR2+YSC1', name: 'Yanhee Anti-Aging 2 กล่อง', price: 1590 },
    { code: 'YR3+YSC1', name: 'Yanhee Anti-Aging 3 กล่อง', price: 2190 },
    { code: 'YPT1+MFN5', name: 'Yanhee Neck Cream 1 หลอด', price: 890 },
    { code: 'YPT2+MFN10', name: 'Yanhee Neck Cream 2 หลอด', price: 1590 },
    { code: 'YPT3+MFN15', name: 'Yanhee Neck Cream 3 หลอด', price: 2190 },
    { code: 'YTZ1+MC5', name: 'เซรั่มปลูกผม Teaser 1 ขวด', price: 990 },
    { code: 'YTZ1+YBO1+DRB1', name: 'เซ็ตบำรุงผม Teaser', price: 1790 },
    { code: 'YES1+MFN5', name: 'Yanhee Eye Serum 1 ขวด', price: 790 },
    { code: 'YES2+MFN10', name: 'Yanhee Eye Serum 2 ขวด', price: 1490 },
    { code: 'YDL1', name: 'Yanhee Daily Vitamin 1 กระปุก', price: 990 },
    { code: 'YDL3', name: 'Yanhee Daily Vitamin 3 กระปุก', price: 2550 },
    { code: 'YF1+6B1', name: 'Yanhee Fozinnia 1 กล่อง', price: 990 },
    { code: 'YF2+YFP1', name: 'Yanhee Fozinnia 2 กล่อง', price: 1800 },
  ];
  const DEFAULT_SETTINGS = {
    targets: {
      fbCalls: 30, t1: 5, t2: 5, t3: 20,   // FB (Pancake) calls / day / person
      mktCalls: 30,                          // Marketplace calls / day / person
      talkMinutes: 90,                       // talk time / day / person
      teleRevenue: 5000,                     // ฿ / day / person
      teamRevenueMonth: 600000,              // ฿ / month whole office (tele + admin + ecom)
    },
    autoApprove: false,         // true = FB leads go straight to the proposed telesales
    staleDays: { fb: 2, ecom: 5 },
    minTalkSec: 7,              // OneCall: longer than this = "ได้คุย"
    onecallLines: { '66948880324': 'wan', '66948880326': 'khem' },
    pancakeAdminMap: {},        // Pancake staff name → admin user id
    products: DEFAULT_PRODUCTS,
    rr: { fb: 0, ecom: 0 },
  };

  // ---------------------------------------------------------------- helpers
  const uid = (p) => (p || 'x') + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  const nowIso = () => new Date(Date.now()).toISOString();
  const dayKey = (iso) => { const t = iso ? Date.parse(iso) : Date.now(); return isNaN(t) ? '' : new Date(t + TZ).toISOString().slice(0, 10); };
  const today = () => dayKey();
  const hourTH = (iso) => new Date(Date.parse(iso) + TZ).getUTCHours();
  const addDays = (day, n) => { const t = Date.parse(day + 'T00:00:00Z') + n * 86400000; return new Date(t).toISOString().slice(0, 10); };
  const daysBetween = (a, b) => Math.round((Date.parse(b + 'T00:00:00Z') - Date.parse(a + 'T00:00:00Z')) / 86400000);
  const TH_MON = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
  const TH_DOW = ['อา.', 'จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.'];
  function thDate(iso, withTime) {
    if (!iso) return '';
    const s = String(iso);
    const t = /^\d{4}-\d{2}-\d{2}$/.test(s) ? Date.parse(s + 'T00:00:00Z') : Date.parse(s) + TZ;
    if (isNaN(t)) return '';
    const d = new Date(t);
    let out = d.getUTCDate() + ' ' + TH_MON[d.getUTCMonth()] + ' ' + (d.getUTCFullYear() + 543);
    if (withTime && !/^\d{4}-\d{2}-\d{2}$/.test(s)) out += ' : ' + String(d.getUTCHours()).padStart(2, '0') + ':' + String(d.getUTCMinutes()).padStart(2, '0') + ' น.';
    return out;
  }
  function thTime(iso) { const d = new Date(Date.parse(iso) + TZ); return String(d.getUTCHours()).padStart(2, '0') + ':' + String(d.getUTCMinutes()).padStart(2, '0'); }
  const baht = (n) => '฿' + (Math.round(Number(n) || 0)).toLocaleString('en-US');
  const num = (n) => (Math.round(Number(n) || 0)).toLocaleString('en-US');
  function dur(sec) { sec = Math.max(0, Math.round(sec || 0)); const h = Math.floor(sec / 3600), m = Math.floor(sec % 3600 / 60), s = sec % 60; return (h ? h + ' ชม. ' : '') + (h || m ? m + ' น. ' : '') + s + ' วิ'; }
  function hms(sec) { sec = Math.max(0, Math.round(sec || 0)); const p = (n) => String(n).padStart(2, '0'); return p(Math.floor(sec / 3600)) + ':' + p(Math.floor(sec % 3600 / 60)) + ':' + p(sec % 60); }
  function normPhone(p) {
    let d = String(p == null ? '' : p).replace(/\D/g, '');
    if (d.startsWith('66') && d.length >= 11) d = '0' + d.slice(2);
    if (d.length === 9 && d[0] !== '0') d = '0' + d;
    return d;
  }
  const fmtPhone = (p) => { const d = normPhone(p); return d.length === 10 ? d.slice(0, 3) + '-' + d.slice(3, 6) + '-' + d.slice(6) : (d || '-'); };
  const clip = (s, n) => String(s == null ? '' : s).trim().slice(0, n || 200);
  const money = (n) => { const v = Number(String(n == null ? '' : n).replace(/[^0-9.\-]/g, '')); return isFinite(v) ? Math.round(v * 100) / 100 : 0; };
  function err(msg, code) { const e = new Error(msg); e.code = code || 400; return e; }

  // ---------------------------------------------------------------- state
  function emptyState() {
    return {
      version: 1,
      users: DEFAULT_USERS.map((u) => ({ ...u })),
      customers: [], appointments: [], kpi: [], approvals: [], announcements: [], onecall: [], activity: [],
      settings: JSON.parse(JSON.stringify(DEFAULT_SETTINGS)),
      sync: { pancake: {}, bigseller: {}, onecall: {}, legacy: {} },
      createdAt: nowIso(),
    };
  }
  function normalize(st) {
    const base = emptyState();
    st = st && typeof st === 'object' ? st : base;
    for (const k of Object.keys(base)) if (st[k] == null) st[k] = base[k];
    st.settings = { ...base.settings, ...st.settings, targets: { ...base.settings.targets, ...(st.settings || {}).targets } };
    if (!Array.isArray(st.settings.products) || !st.settings.products.length) st.settings.products = DEFAULT_PRODUCTS;
    for (const u of base.users) if (!st.users.find((x) => x.id === u.id)) st.users.push({ ...u });
    return st;
  }
  const userById = (st, id) => st.users.find((u) => u.id === id) || null;
  const userName = (st, id) => (userById(st, id) || {}).name || (id ? String(id) : '-');
  const teles = (st) => st.users.filter((u) => u.role === 'tele' && !u.disabled);
  const admins = (st) => st.users.filter((u) => u.role === 'admin' && !u.disabled);
  const isBoss = (u) => !!u && (u.role === 'exec' || u.role === 'lead');
  const findCustomer = (st, id) => st.customers.find((c) => c.id === id) || null;
  const byPhone = (st, phone) => { const p = normPhone(phone); return p ? st.customers.find((c) => normPhone(c.phone) === p) || null : null; };
  function log(st, actor, text) {
    st.activity.unshift({ at: nowIso(), by: actor ? actor.id : 'system', text: clip(text, 240) });
    if (st.activity.length > 300) st.activity.length = 300;
  }
  function customerTotal(c) { return (c.orders || []).reduce((s, o) => s + (o.status === 'cancelled' ? 0 : (Number(o.total) || 0)), 0); }
  function sortOrders(c) { c.orders = (c.orders || []).sort((a, b) => Date.parse(b.date) - Date.parse(a.date)); }
  function lastActivity(c) {
    const ts = [c.createdAt, c.lastContactAt, c.updatedAt].map((x) => Date.parse(x || 0)).filter((x) => !isNaN(x));
    return ts.length ? Math.max(...ts) : 0;
  }
  function isStale(st, c) {
    if (['won', 'lost'].includes(c.status)) return false;
    if (c.nextApptAt && Date.parse(c.nextApptAt) > Date.now()) return false;
    const lim = (st.settings.staleDays || {})[c.channel] || (c.channel === 'fb' ? 2 : 5);
    return Date.now() - lastActivity(c) > lim * 86400000;
  }

  // Balanced 50:50 pick: the telesales with the fewer leads of that channel received today wins,
  // ties broken by a rotating pointer so the split stays exactly even over time.
  function nextTele(st, channel) {
    const list = teles(st).filter((u) => !u.off);
    if (!list.length) return null;
    const d = today();
    const cnt = {};
    for (const u of list) cnt[u.id] = 0;
    for (const c of st.customers) if (c.channel === channel && c.owner in cnt && dayKey(c.assignedAt) === d) cnt[c.owner]++;
    for (const a of st.approvals) if (a.status === 'pending' && a.proposed in cnt && channel === 'fb') cnt[a.proposed]++;
    const min = Math.min(...list.map((u) => cnt[u.id]));
    const tied = list.filter((u) => cnt[u.id] === min);
    st.settings.rr = st.settings.rr || {};
    const i = (st.settings.rr[channel] || 0) % tied.length;
    st.settings.rr[channel] = (st.settings.rr[channel] || 0) + 1;
    return tied[i].id;
  }

  function cleanItems(items, products) {
    const out = [];
    for (const it of (Array.isArray(items) ? items : [])) {
      const name = clip(it && (it.name || it.code), 120);
      if (!name) continue;
      const p = (products || []).find((x) => x.code === name || x.name === name);
      const qty = Math.max(1, Math.round(Number(it.qty) || 1));
      const price = it.price != null && it.price !== '' ? money(it.price) : (p ? p.price : 0);
      out.push({ name: p && name === p.code ? p.name + ' (' + p.code + ')' : name, qty, price });
    }
    return out;
  }
  const itemsTotal = (items) => items.reduce((s, i) => s + i.qty * i.price, 0);

  function upsertCustomer(st, data, actor) {
    const phone = normPhone(data.phone);
    let c = phone ? byPhone(st, phone) : null;
    const isNew = !c;
    if (!c) {
      c = {
        id: uid('c'), name: '', phone, address: '', channel: data.channel || 'fb', platform: data.platform || 'manual',
        page: '', owner: null, status: 'new', round: data.channel === 'ecom' ? '' : 'T1', tags: [],
        orders: [], notes: [], createdAt: nowIso(), updatedAt: nowIso(), assignedAt: null, lastContactAt: null, nextApptAt: null,
      };
      st.customers.unshift(c);
    }
    if (data.name) c.name = clip(data.name, 120);
    if (data.address) c.address = clip(data.address, 500);
    if (data.page) c.page = clip(data.page, 120);
    if (data.platform && isNew) c.platform = data.platform;
    if (data.closerName) c.closerName = clip(data.closerName, 80);
    if (data.closer) c.closer = data.closer;
    c.updatedAt = nowIso();
    return { c, isNew };
  }
  function pushOrder(c, o) {
    if (o.extId && (c.orders || []).some((x) => x.extId === o.extId)) return null;
    const order = { id: uid('o'), date: o.date || nowIso(), items: o.items || [], total: o.total != null ? money(o.total) : itemsTotal(o.items || []),
      status: o.status || 'paid', source: o.source || 'manual', platform: o.platform || '', by: o.by || '', extId: o.extId || '', note: clip(o.note, 200) };
    c.orders = c.orders || [];
    c.orders.push(order); sortOrders(c);
    return order;
  }
  function pushNote(c, n) {
    c.notes = c.notes || [];
    c.notes.unshift({ id: uid('n'), at: nowIso(), ...n });
    if (c.notes.length > 200) c.notes.length = 200;
  }
  function setNextAppt(st, c) {
    const open = st.appointments.filter((a) => a.customerId === c.id && !a.done).sort((a, b) => Date.parse(a.at) - Date.parse(b.at));
    c.nextApptAt = open.length ? open[0].at : null;
  }

  // ---------------------------------------------------------------- permissions
  const PERM = {
    addCustomer: ['exec', 'lead', 'tele', 'admin'],
    updateCustomer: ['exec', 'lead', 'tele'],
    addOrder: ['exec', 'lead', 'tele'],
    logCall: ['exec', 'lead', 'tele'],
    addNote: ['exec', 'lead', 'tele', 'admin'],
    addAppt: ['exec', 'lead', 'tele'],
    updateAppt: ['exec', 'lead', 'tele'],
    deleteAppt: ['exec', 'lead', 'tele'],
    addKpi: ['exec', 'lead', 'tele'],
    deleteKpi: ['exec', 'lead', 'tele'],
    createClose: ['exec', 'lead', 'admin'],
    approve: ['exec', 'lead', 'tele'],
    approveAll: ['exec', 'lead'],
    reject: ['exec', 'lead'],
    ingestEcom: ['exec', 'lead'],
    ingestOnecall: ['exec', 'lead'],
    addAnnouncement: ['exec', 'lead'],
    deleteAnnouncement: ['exec', 'lead'],
    updateSettings: ['exec', 'lead'],
    updateUser: ['exec', 'lead'],
    resetDemo: ['exec', 'lead'],
  };
  function can(actor, type) {
    if (!actor) return false;
    if (actor.role === 'system') return true;
    return (PERM[type] || []).includes(actor.role);
  }
  function ownsOrBoss(actor, c) { return isBoss(actor) || actor.role === 'system' || c.owner === actor.id || (!c.owner && actor.role === 'tele'); }

  // ---------------------------------------------------------------- actions
  const A = {};

  A.addCustomer = (st, p, actor) => {
    const phone = normPhone(p.phone);
    if (!p.name && !phone) throw err('กรอกชื่อหรือเบอร์โทรอย่างน้อย 1 อย่าง');
    if (phone && byPhone(st, phone)) throw err('เบอร์ ' + fmtPhone(phone) + ' มีในระบบแล้ว (' + byPhone(st, phone).name + ')');
    const channel = p.channel === 'ecom' ? 'ecom' : 'fb';
    const { c } = upsertCustomer(st, { ...p, channel, platform: p.platform || (channel === 'ecom' ? 'lazada' : 'manual') }, actor);
    c.owner = p.owner || (actor.role === 'tele' ? actor.id : null);
    if (c.owner) c.assignedAt = nowIso();
    if (p.round) c.round = p.round;
    if (p.note) pushNote(c, { by: actor.id, kind: 'note', text: clip(p.note, 500) });
    log(st, actor, 'เพิ่มลูกค้า ' + (c.name || fmtPhone(c.phone)));
    return { id: c.id };
  };

  A.updateCustomer = (st, p, actor) => {
    const c = findCustomer(st, p.id); if (!c) throw err('ไม่พบลูกค้า', 404);
    if (!ownsOrBoss(actor, c)) throw err('ลูกค้ารายนี้อยู่กับเซลล์คนอื่น', 403);
    const q = p.patch || {};
    if (q.name != null) c.name = clip(q.name, 120);
    if (q.phone != null) {
      const ph = normPhone(q.phone); const o = byPhone(st, ph);
      if (o && o.id !== c.id) throw err('เบอร์นี้เป็นของลูกค้า ' + o.name + ' แล้ว');
      c.phone = ph;
    }
    if (q.address != null) c.address = clip(q.address, 500);
    if (q.status && STATUS[q.status]) c.status = q.status;
    if (q.round != null && ['', 'T1', 'T2', 'T3'].includes(q.round)) c.round = q.round;
    if (q.owner !== undefined && isBoss(actor)) { c.owner = q.owner || null; c.assignedAt = nowIso(); }
    if (q.tags) c.tags = q.tags.map((t) => clip(t, 30)).slice(0, 10);
    c.updatedAt = nowIso();
    return { id: c.id };
  };

  A.addOrder = (st, p, actor) => {
    const c = findCustomer(st, p.customerId); if (!c) throw err('ไม่พบลูกค้า', 404);
    if (!ownsOrBoss(actor, c)) throw err('ลูกค้ารายนี้อยู่กับเซลล์คนอื่น', 403);
    const items = cleanItems(p.items, st.settings.products);
    if (!items.length) throw err('เลือกสินค้าอย่างน้อย 1 รายการ');
    const o = pushOrder(c, { date: p.date ? new Date(p.date).toISOString() : nowIso(), items, total: p.total != null && p.total !== '' ? p.total : null, status: p.status || 'paid', source: actor.role === 'tele' ? 'tele' : 'manual', by: actor.id, note: p.note });
    if (o && o.total == null) o.total = itemsTotal(items);
    c.updatedAt = nowIso();
    log(st, actor, 'เพิ่มออเดอร์ ' + baht(o.total) + ' ให้ ' + c.name);
    return { id: o.id };
  };

  A.addNote = (st, p, actor) => {
    const c = findCustomer(st, p.customerId); if (!c) throw err('ไม่พบลูกค้า', 404);
    if (!clip(p.text)) throw err('พิมพ์โน้ตก่อนบันทึก');
    pushNote(c, { by: actor.id, kind: 'note', text: clip(p.text, 1000) });
    c.updatedAt = nowIso();
    return { ok: true };
  };

  // One call from the customer ticket: writes the call to the ticket, the KPI log, an order (if sold)
  // and the next appointment (if any) in one step, so the telesales never types the same thing twice.
  A.logCall = (st, p, actor) => {
    const c = findCustomer(st, p.customerId); if (!c) throw err('ไม่พบลูกค้า', 404);
    if (!ownsOrBoss(actor, c)) throw err('ลูกค้ารายนี้อยู่กับเซลล์คนอื่น', 403);
    const res = RESULTS.find((r) => r.id === p.result); if (!res) throw err('เลือกผลการโทร');
    if (res.id === 'lost' && !p.lostReason) throw err('เลือกเหตุผลที่ลูกค้าปฏิเสธ');
    const durationSec = Math.max(0, Math.round(Number(p.durationSec) || 0));
    const items = cleanItems(p.items, st.settings.products);
    const amount = p.amount != null && p.amount !== '' ? money(p.amount) : itemsTotal(items);
    const user = actor.role === 'tele' ? actor.id : (c.owner || actor.id);
    if (!c.owner && actor.role === 'tele') { c.owner = actor.id; c.assignedAt = nowIso(); }
    const k = {
      id: uid('k'), user, date: today(), at: nowIso(), mode: 'call', channel: c.channel === 'ecom' ? 'mkt' : 'fb',
      round: c.channel === 'ecom' ? '' : (p.round || c.round || 'T1'), phone: c.phone, name: c.name, customerId: c.id,
      durationSec, result: res.id, talked: res.talked, items, amount: res.id === 'won' || res.id === 'awaiting_payment' ? amount : 0,
      orders: (res.id === 'won' || res.id === 'awaiting_payment') && amount > 0 ? 1 : 0, note: clip(p.note, 500), lostReason: clip(p.lostReason, 60), by: actor.id,
    };
    st.kpi.push(k);
    if (k.orders) {
      const o = pushOrder(c, { items, total: amount, status: res.id === 'won' ? 'paid' : 'awaiting_payment', source: 'tele', by: user, note: 'จากการโทร ' + (k.round || 'Marketplace') });
      k.orderId = o && o.id;
    }
    c.status = res.id; c.lastContactAt = nowIso(); c.updatedAt = nowIso();
    c.callCount = (c.callCount || 0) + 1;
    if (k.round && c.channel !== 'ecom') c.round = k.round;
    pushNote(c, { by: actor.id, kind: 'call', result: res.id, durationSec, round: k.round, amount: k.amount,
      text: [res.label + (k.lostReason ? ' (' + k.lostReason + ')' : ''), k.note].filter(Boolean).join(' · ') });
    if (p.nextAt) A.addAppt(st, { customerId: c.id, at: p.nextAt, purpose: p.nextPurpose || (res.id === 'won' ? 'ติดตามหลังการขาย' : 'โทรติดตาม'), round: p.nextRound || '' }, actor);
    // close today's open appointment for this customer: the call was made
    for (const a of st.appointments) if (a.customerId === c.id && !a.done && dayKey(a.at) <= today() && a.id !== st._lastApptId) { a.done = true; a.doneAt = nowIso(); a.outcome = res.id; }
    setNextAppt(st, c);
    log(st, actor, userName(st, user) + ' โทรหา ' + (c.name || fmtPhone(c.phone)) + ' : ' + res.label + (k.amount ? ' ' + baht(k.amount) : ''));
    return { kpiId: k.id };
  };

  A.addAppt = (st, p, actor) => {
    const c = findCustomer(st, p.customerId); if (!c) throw err('เลือกลูกค้าที่จะนัด');
    const t = Date.parse(p.at); if (isNaN(t)) throw err('ระบุวันและเวลานัด');
    const a = { id: uid('a'), customerId: c.id, owner: p.owner || (actor.role === 'tele' ? actor.id : c.owner || actor.id), at: new Date(t).toISOString(),
      purpose: clip(p.purpose || 'โทรติดตาม', 120), round: clip(p.round, 4), note: clip(p.note, 300), done: false, createdAt: nowIso(), by: actor.id };
    st.appointments.push(a); st._lastApptId = a.id;
    if (p.round && ['T1', 'T2', 'T3'].includes(p.round) && c.channel !== 'ecom') c.round = p.round;
    setNextAppt(st, c);
    pushNote(c, { by: actor.id, kind: 'appt', text: 'นัดโทร ' + thDate(a.at, true) + ' : ' + a.purpose });
    return { id: a.id };
  };
  A.updateAppt = (st, p, actor) => {
    const a = st.appointments.find((x) => x.id === p.id); if (!a) throw err('ไม่พบนัด', 404);
    if (!isBoss(actor) && a.owner !== actor.id) throw err('นัดนี้เป็นของเซลล์คนอื่น', 403);
    const q = p.patch || {};
    if (q.at) { const t = Date.parse(q.at); if (!isNaN(t)) a.at = new Date(t).toISOString(); }
    if (q.purpose != null) a.purpose = clip(q.purpose, 120);
    if (q.done != null) { a.done = !!q.done; a.doneAt = a.done ? nowIso() : null; }
    if (q.note != null) a.note = clip(q.note, 300);
    const c = findCustomer(st, a.customerId); if (c) setNextAppt(st, c);
    return { id: a.id };
  };
  A.deleteAppt = (st, p, actor) => {
    const a = st.appointments.find((x) => x.id === p.id); if (!a) throw err('ไม่พบนัด', 404);
    if (!isBoss(actor) && a.owner !== actor.id) throw err('นัดนี้เป็นของเซลล์คนอื่น', 403);
    st.appointments = st.appointments.filter((x) => x.id !== p.id);
    const c = findCustomer(st, a.customerId); if (c) setNextAppt(st, c);
    return { ok: true };
  };

  // Manual KPI entry. mode 'call' = one call (phone + duration + products + amount),
  // mode 'summary' = whole-day totals typed at once.
  A.addKpi = (st, p, actor) => {
    const user = isBoss(actor) && p.user ? p.user : actor.id;
    if (!userById(st, user) || userById(st, user).role !== 'tele') throw err('เลือก Telesales');
    const date = /^\d{4}-\d{2}-\d{2}$/.test(p.date || '') ? p.date : today();
    const channel = p.channel === 'mkt' ? 'mkt' : 'fb';
    const round = channel === 'fb' ? (['T1', 'T2', 'T3'].includes(p.round) ? p.round : 'T1') : '';
    const items = cleanItems(p.items, st.settings.products);
    const base = { id: uid('k'), user, date, at: nowIso(), channel, round, note: clip(p.note, 500), by: actor.id };
    let k;
    if (p.mode === 'summary') {
      const calls = Math.max(0, Math.round(Number(p.calls) || 0));
      const talkedCount = Math.min(calls, Math.max(0, Math.round(Number(p.talkedCount) || 0)));
      if (!calls) throw err('กรอกจำนวนสายที่โทร');
      k = { ...base, mode: 'summary', calls, talkedCount, durationSec: Math.max(0, Math.round(Number(p.durationSec) || 0)),
        items, amount: p.amount != null && p.amount !== '' ? money(p.amount) : itemsTotal(items), orders: Math.max(0, Math.round(Number(p.orders) || 0)) };
    } else {
      const phone = normPhone(p.phone);
      if (phone.length < 9) throw err('กรอกเบอร์ที่โทรให้ครบ');
      const res = RESULTS.find((r) => r.id === p.result) || RESULTS.find((r) => r.id === (p.talked === false ? 'no_answer' : 'followup'));
      const amount = p.amount != null && p.amount !== '' ? money(p.amount) : itemsTotal(items);
      const c = byPhone(st, phone);
      k = { ...base, mode: 'call', phone, name: clip(p.name || (c && c.name), 120), customerId: c ? c.id : null,
        durationSec: Math.max(0, Math.round(Number(p.durationSec) || 0)), result: res.id, talked: res.talked,
        items, amount, orders: amount > 0 ? 1 : 0 };
      if (c) {
        c.lastContactAt = nowIso(); c.updatedAt = nowIso(); c.status = res.id; c.callCount = (c.callCount || 0) + 1;
        pushNote(c, { by: actor.id, kind: 'call', result: res.id, durationSec: k.durationSec, round, amount, text: res.label + (k.note ? ' · ' + k.note : '') + ' (บันทึกจากหน้า KPI)' });
        if (amount > 0) { const o = pushOrder(c, { items, total: amount, source: 'tele', by: user, note: 'บันทึกจากหน้า KPI' }); k.orderId = o && o.id; }
      }
    }
    st.kpi.push(k);
    log(st, actor, 'บันทึก KPI ' + userName(st, user) + (k.mode === 'summary' ? ' (สรุป ' + k.calls + ' สาย)' : ' ' + fmtPhone(k.phone)));
    return { id: k.id };
  };
  A.deleteKpi = (st, p, actor) => {
    const k = st.kpi.find((x) => x.id === p.id); if (!k) throw err('ไม่พบรายการ', 404);
    if (!isBoss(actor) && k.user !== actor.id) throw err('ลบได้เฉพาะรายการของตัวเอง', 403);
    if (!isBoss(actor) && k.date !== today()) throw err('ลบได้เฉพาะรายการของวันนี้ ติดต่อหัวหน้าทีมเพื่อแก้ย้อนหลัง', 403);
    st.kpi = st.kpi.filter((x) => x.id !== p.id);
    if (k.orderId && k.customerId) { const c = findCustomer(st, k.customerId); if (c) c.orders = c.orders.filter((o) => o.id !== k.orderId); }
    return { ok: true };
  };

  // Admin closed a sale (typed in the hub, or pulled from Pancake). The buyer becomes a FB lead
  // and is proposed to the next telesales (50:50). The lead waits in the approval queue unless autoApprove.
  A.createClose = (st, p, actor) => {
    const phone = normPhone(p.phone);
    if (phone.length < 9) throw err('กรอกเบอร์ลูกค้าให้ครบ 10 หลัก');
    if (!clip(p.name)) throw err('กรอกชื่อลูกค้า');
    const items = cleanItems(p.items, st.settings.products);
    if (!items.length && !money(p.total)) throw err('เลือกสินค้าหรือกรอกยอดขาย');
    if (p.extId && st.approvals.some((a) => a.extId === p.extId)) return { duplicate: true };
    const closer = p.closer || (actor.role === 'admin' ? actor.id : (st.settings.pancakeAdminMap || {})[p.closerName] || null);
    const closerName = p.closerName || userName(st, closer);
    const { c, isNew } = upsertCustomer(st, { name: p.name, phone, address: p.address, page: p.page, channel: 'fb', platform: p.source === 'pancake' ? 'pancake' : 'manual', closer, closerName }, actor);
    const total = money(p.total) || itemsTotal(items);
    const order = pushOrder(c, { date: p.date ? new Date(p.date).toISOString() : nowIso(), items, total, status: p.status || 'paid', source: p.source === 'pancake' ? 'pancake' : 'admin', by: closer || '', extId: p.extId || '', note: p.note });
    if (!order) return { duplicate: true };
    const returning = !isNew && !!c.owner;
    // returning customer keeps the telesales who already owns them; new customers go 50:50
    const proposed = returning ? c.owner : nextTele(st, 'fb');
    const ap = { id: uid('ap'), customerId: c.id, orderId: order.id, extId: p.extId || '', closer, closerName, proposed, returning,
      total, items, page: c.page, status: 'pending', at: nowIso(), source: p.source || 'admin' };
    st.approvals.unshift(ap);
    pushNote(c, { by: closer || actor.id, kind: 'sale', amount: total, text: 'แอดมิน ' + closerName + ' ปิดการขาย ' + baht(total) + (items.length ? ' : ' + items.map((i) => i.name + ' x' + i.qty).join(', ') : '') });
    log(st, actor, closerName + ' ปิดการขาย ' + c.name + ' ' + baht(total) + ' → เสนอให้ ' + userName(st, proposed));
    if (st.settings.autoApprove || returning) A.approve(st, { id: ap.id, auto: true }, { id: 'system', role: 'system' });
    return { id: ap.id, customerId: c.id, proposed };
  };
  A.approve = (st, p, actor) => {
    const ap = st.approvals.find((x) => x.id === p.id); if (!ap) throw err('ไม่พบรายการ', 404);
    if (ap.status !== 'pending') throw err('รายการนี้ดำเนินการไปแล้ว');
    if (actor.role === 'tele' && ap.proposed !== actor.id) throw err('รายการนี้เสนอให้เซลล์คนอื่น', 403);
    const to = isBoss(actor) && p.to ? p.to : ap.proposed;
    const c = findCustomer(st, ap.customerId); if (!c) throw err('ไม่พบลูกค้า', 404);
    const prev = c.owner;
    c.owner = to; c.assignedAt = nowIso(); c.channel = 'fb';
    if (!ap.returning || !prev) { c.round = 'T1'; c.status = 'new'; }
    else { c.round = 'T1'; c.status = 'new'; }
    ap.status = 'approved'; ap.assigned = to; ap.decidedBy = actor.id; ap.decidedAt = nowIso(); ap.auto = !!p.auto;
    pushNote(c, { by: actor.id, kind: 'assign', text: (p.auto ? 'ระบบมอบหมาย' : 'อนุมัติมอบหมาย') + 'ให้ ' + userName(st, to) + ' (T1)' + (ap.returning ? ' · ลูกค้าเก่าซื้อซ้ำ' : '') });
    // T1 call is due today
    if (!st.appointments.some((a) => a.customerId === c.id && !a.done)) {
      const due = new Date(Date.now() + 2 * 3600000).toISOString();
      st.appointments.push({ id: uid('a'), customerId: c.id, owner: to, at: due, purpose: 'T1 ต้อนรับ ยืนยันออเดอร์', round: 'T1', done: false, createdAt: nowIso(), by: 'system' });
      setNextAppt(st, c);
    }
    return { ok: true, to };
  };
  A.approveAll = (st, p, actor) => {
    let n = 0;
    for (const ap of st.approvals.filter((x) => x.status === 'pending')) { A.approve(st, { id: ap.id }, actor); n++; }
    return { approved: n };
  };
  A.reject = (st, p, actor) => {
    const ap = st.approvals.find((x) => x.id === p.id); if (!ap) throw err('ไม่พบรายการ', 404);
    ap.status = 'rejected'; ap.reason = clip(p.reason || 'ไม่ส่งให้ Telesales', 120); ap.decidedBy = actor.id; ap.decidedAt = nowIso();
    return { ok: true };
  };

  // Marketplace orders (Lazada / Shopee / TikTok via BigSeller export, or Evolution).
  // rows: [{orderNo, platform, name, phone, address, items:[{name,qty,price}] | product, total, date}]
  A.ingestEcom = (st, p, actor) => {
    const rows = Array.isArray(p.rows) ? p.rows : [];
    let added = 0, orders = 0, masked = 0, invalid = 0, dup = 0;
    for (const r of rows) {
      const raw = String((r && (r.phone || r.mobile)) || '');
      if (raw.includes('*')) { masked++; continue; }
      const phone = normPhone(raw);
      if (phone.length !== 10) { invalid++; continue; }
      const platform = PLATFORMS[String(r.platform || '').toLowerCase()] ? String(r.platform).toLowerCase() : 'lazada';
      const existing = byPhone(st, phone);
      const { c, isNew } = upsertCustomer(st, { name: r.name, phone, address: r.address, channel: 'ecom', platform }, actor);
      if (isNew) { c.channel = 'ecom'; c.round = ''; c.owner = nextTele(st, 'ecom'); c.assignedAt = nowIso(); added++; }
      else if (!existing.owner) { c.owner = nextTele(st, c.channel); c.assignedAt = nowIso(); }
      let items = cleanItems(r.items, st.settings.products);
      if (!items.length && r.product) items = String(r.product).split(/[,\n]/).map((s) => s.trim()).filter(Boolean).map((s) => ({ name: clip(s, 120), qty: 1, price: 0 }));
      const extId = r.orderNo ? platform + ':' + String(r.orderNo).trim() : '';
      const o = pushOrder(c, { date: r.date && !isNaN(Date.parse(r.date)) ? new Date(r.date).toISOString() : nowIso(), items, total: money(r.total), source: 'ecom', platform, extId });
      if (o) orders++; else dup++;
    }
    st.sync.bigseller = { ...(st.sync.bigseller || {}), lastRun: nowIso(), lastAdded: added, lastOrders: orders, lastMasked: masked };
    log(st, actor, 'นำเข้า E-Commerce ' + rows.length + ' แถว · ลูกค้าใหม่ ' + added + ' · ออเดอร์ ' + orders);
    return { received: rows.length, added, orders, masked, invalid, dup };
  };

  // OneCall recordings: [{id, timestamp, duration, localParty, remoteParty, direction}]
  A.ingestOnecall = (st, p, actor) => {
    const lines = st.settings.onecallLines || {};
    const seen = new Set(st.onecall.map((r) => r.id));
    let added = 0;
    for (const rec of (p.records || [])) {
      const id = String(rec && rec.id != null ? rec.id : ''); if (!id || seen.has(id)) continue;
      let lp = String(rec.localParty || '').replace(/\D/g, ''); if (lp.length === 10 && lp[0] === '0') lp = '66' + lp.slice(1);
      const phone = normPhone(rec.remoteParty);
      let user = lines[lp] || null;
      if (!user) { const c = byPhone(st, phone); user = c && c.owner; }
      if (!user) continue;
      let at = rec.timestamp;
      if (typeof at === 'number') at = new Date(at < 1e12 ? at * 1000 : at).toISOString();
      else { let s = String(at || ''); if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(s)) s = s.replace(' ', 'T') + 'Z'; at = isNaN(Date.parse(s)) ? nowIso() : new Date(s).toISOString(); }
      st.onecall.push({ id, user, phone, dur: Math.max(0, parseInt(rec.duration, 10) || 0), at, dir: clip(rec.direction, 12) });
      seen.add(id); added++;
    }
    if (st.onecall.length > 40000) st.onecall = st.onecall.slice(-40000);
    st.sync.onecall = { ...(st.sync.onecall || {}), lastRun: nowIso(), lastAdded: added };
    return { added };
  };

  A.addAnnouncement = (st, p, actor) => {
    if (!clip(p.title)) throw err('กรอกหัวข้อประกาศ');
    st.announcements.unshift({ id: uid('an'), title: clip(p.title, 140), body: clip(p.body, 600), at: nowIso(), by: actor.id });
    return { ok: true };
  };
  A.deleteAnnouncement = (st, p) => { st.announcements = st.announcements.filter((x) => x.id !== p.id); return { ok: true }; };
  A.updateSettings = (st, p, actor) => {
    const s = st.settings;
    if (p.targets) for (const k of Object.keys(s.targets)) if (p.targets[k] != null && p.targets[k] !== '') s.targets[k] = Math.max(0, Number(p.targets[k]) || 0);
    if (p.autoApprove != null) s.autoApprove = !!p.autoApprove;
    if (p.staleDays) s.staleDays = { fb: Math.max(1, Number(p.staleDays.fb) || 2), ecom: Math.max(1, Number(p.staleDays.ecom) || 5) };
    if (p.onecallLines && typeof p.onecallLines === 'object') s.onecallLines = p.onecallLines;
    if (p.pancakeAdminMap && typeof p.pancakeAdminMap === 'object') s.pancakeAdminMap = p.pancakeAdminMap;
    if (Array.isArray(p.products)) s.products = p.products.filter((x) => x && x.name).map((x) => ({ code: clip(x.code || x.name, 40), name: clip(x.name, 120), price: money(x.price) }));
    log(st, actor, 'แก้ไขการตั้งค่า');
    return { ok: true };
  };
  A.updateUser = (st, p, actor) => {
    const u = userById(st, p.id); if (!u) throw err('ไม่พบผู้ใช้', 404);
    if (p.name) { u.name = clip(p.name, 40); u.initial = u.name.replace(/^(คุณ|พี่|น้อง)/, '').slice(0, 1) || u.initial; }
    if (p.off != null) u.off = !!p.off;          // on leave today → skipped by 50:50
    if (p.pancakeName != null) u.pancakeName = clip(p.pancakeName, 80);
    if (u.pancakeName) { st.settings.pancakeAdminMap = st.settings.pancakeAdminMap || {}; st.settings.pancakeAdminMap[u.pancakeName] = u.id; }
    return { ok: true };
  };

  function apply(st, type, payload, actor) {
    if (!A[type]) throw err('ไม่รู้จักคำสั่ง ' + type);
    if (!can(actor, type)) throw err('สิทธิ์ของคุณใช้คำสั่งนี้ไม่ได้', 403);
    const r = A[type](st, payload || {}, actor);
    delete st._lastApptId;
    return r;
  }

  // ---------------------------------------------------------------- views
  function visibleState(st, actor) {
    if (isBoss(actor)) return st;
    const out = { ...st };
    if (actor.role === 'tele') {
      out.customers = st.customers.filter((c) => c.owner === actor.id);
      out.appointments = st.appointments.filter((a) => a.owner === actor.id);
      out.kpi = st.kpi.filter((k) => k.user === actor.id);
      out.approvals = st.approvals.filter((a) => a.proposed === actor.id || a.assigned === actor.id);
      out.onecall = st.onecall.filter((o) => o.user === actor.id);
    } else if (actor.role === 'admin') {
      const mine = new Set(st.approvals.filter((a) => a.closer === actor.id).map((a) => a.customerId));
      out.customers = st.customers.filter((c) => mine.has(c.id)).map((c) => ({ ...c, notes: [] }));
      out.appointments = []; out.kpi = []; out.onecall = [];
      out.approvals = st.approvals.filter((a) => a.closer === actor.id);
      out.adminBoard = adminBoard(st, today(), today());
      out.nextFb = previewNext(st);
    }
    out.activity = st.activity.filter((x) => x.by === actor.id).slice(0, 50);
    return out;
  }

  // who gets the next FB lead, without moving the rotation pointer
  function previewNext(st) {
    const copy = { ...st, settings: { ...st.settings, rr: { ...(st.settings.rr || {}) } } };
    return nextTele(copy, 'fb');
  }
  function inRange(day, from, to) { return day >= from && day <= to; }

  // KPI of one telesales over [from, to]
  function teleKpi(st, userId, from, to) {
    const t = st.settings.targets;
    const days = daysBetween(from, to) + 1;
    const workDays = days; // targets × days, per spec
    const r = { user: userId, name: userName(st, userId), calls: 0, fbCalls: 0, mktCalls: 0, t1: 0, t2: 0, t3: 0, talked: 0, notTalked: 0, talkSec: 0,
      amount: 0, orders: 0, won: 0, items: {}, entries: 0, oc: { calls: 0, talked: 0, talkSec: 0 }, appts: { due: 0, done: 0, overdue: 0 } };
    for (const k of st.kpi) {
      if (k.user !== userId || !inRange(k.date, from, to)) continue;
      r.entries++;
      const n = k.mode === 'summary' ? k.calls : 1;
      const talked = k.mode === 'summary' ? k.talkedCount : (k.talked ? 1 : 0);
      r.calls += n; r.talked += talked; r.notTalked += n - talked; r.talkSec += k.durationSec || 0;
      if (k.channel === 'mkt') r.mktCalls += n; else { r.fbCalls += n; if (k.round === 'T2') r.t2 += n; else if (k.round === 'T3') r.t3 += n; else r.t1 += n; }
      r.amount += k.amount || 0; r.orders += k.orders || 0;
      if (k.result === 'won') r.won++;
      for (const it of (k.items || [])) r.items[it.name] = (r.items[it.name] || 0) + it.qty;
    }
    const minTalk = st.settings.minTalkSec || 7;
    for (const o of st.onecall) {
      if (o.user !== userId || !inRange(dayKey(o.at), from, to)) continue;
      r.oc.calls++; if (o.dur > minTalk) { r.oc.talked++; r.oc.talkSec += o.dur; }
    }
    const nowT = Date.now();
    for (const a of st.appointments) {
      if (a.owner !== userId) continue;
      const d = dayKey(a.at);
      if (inRange(d, from, to)) { r.appts.due++; if (a.done) r.appts.done++; }
      if (!a.done && Date.parse(a.at) < nowT - 3600000) r.appts.overdue++;
    }
    r.target = { fb: t.fbCalls * workDays, mkt: t.mktCalls * workDays, t1: t.t1 * workDays, t2: t.t2 * workDays, t3: t.t3 * workDays, talkSec: t.talkMinutes * 60 * workDays, revenue: t.teleRevenue * workDays };
    r.checks = [
      { key: 'fb', label: 'โทร FB (Pancake)', value: r.fbCalls, target: r.target.fb, ok: r.fbCalls >= r.target.fb },
      { key: 'mkt', label: 'โทร Marketplace', value: r.mktCalls, target: r.target.mkt, ok: r.mktCalls >= r.target.mkt },
      { key: 'talk', label: 'เวลาคุยรวม', value: r.talkSec, target: r.target.talkSec, ok: r.talkSec >= r.target.talkSec, time: true },
      { key: 'rev', label: 'ยอดขาย', value: r.amount, target: r.target.revenue, ok: r.amount >= r.target.revenue, money: true },
    ];
    r.passed = r.checks.filter((c) => c.ok).length;
    r.callPct = (r.target.fb + r.target.mkt) ? Math.round((r.fbCalls + r.mktCalls) / (r.target.fb + r.target.mkt) * 100) : 0;
    r.complete = r.checks[0].ok && r.checks[1].ok;
    r.contactRate = r.calls ? r.talked / r.calls : 0;
    r.conversion = r.talked ? r.orders / r.talked : 0;
    r.aov = r.orders ? r.amount / r.orders : 0;
    r.perTalk = r.talked ? r.amount / r.talked : 0;
    r.status = r.entries === 0 ? 'none' : (r.complete ? 'done' : (r.callPct >= 60 ? 'close' : 'behind'));
    return r;
  }

  function adminBoard(st, from, to) {
    const map = {};
    for (const ap of st.approvals) {
      if (!inRange(dayKey(ap.at), from, to)) continue;
      const key = ap.closer || ('name:' + ap.closerName);
      const m = map[key] || (map[key] = { key, user: ap.closer, name: ap.closer ? userName(st, ap.closer) : (ap.closerName || 'ไม่ระบุ'), pancakeName: ap.closerName, closes: 0, revenue: 0 });
      m.closes++; m.revenue += ap.total || 0;
    }
    return Object.values(map).sort((a, b) => b.revenue - a.revenue);
  }

  function dashboard(st, from, to) {
    from = from || today(); to = to || from;
    const days = []; for (let d = from; d <= to; d = addDays(d, 1)) { days.push(d); if (days.length > 400) break; }
    const series = {}; for (const d of days) series[d] = { tele: 0, admin: 0, ecom: 0, orders: 0, calls: 0 };
    const rev = { tele: 0, admin: 0, ecom: 0 }, cnt = { tele: 0, admin: 0, ecom: 0 };
    const prod = {}, platform = {}, pages = {};
    const hours = Array.from({ length: 24 }, () => ({ calls: 0, orders: 0 }));
    // Telesales revenue comes from the KPI log (manual = source of truth); admin & ecom from orders.
    for (const k of st.kpi) {
      if (!inRange(k.date, from, to)) continue;
      rev.tele += k.amount || 0; cnt.tele += k.orders || 0;
      if (series[k.date]) { series[k.date].tele += k.amount || 0; series[k.date].calls += k.mode === 'summary' ? k.calls : 1; series[k.date].orders += k.orders || 0; }
      if (k.mode === 'call') hours[hourTH(k.at)].calls++;
      for (const it of (k.items || [])) { const p = prod[it.name] || (prod[it.name] = { name: it.name, qty: 0, revenue: 0, tele: 0, admin: 0, ecom: 0 }); p.qty += it.qty; p.revenue += it.qty * it.price; p.tele += it.qty; }
    }
    for (const c of st.customers) for (const o of (c.orders || [])) {
      const d = dayKey(o.date); if (!inRange(d, from, to) || o.status === 'cancelled') continue;
      let src = null;
      if (o.source === 'admin' || o.source === 'pancake') src = 'admin';
      else if (o.source === 'ecom') src = 'ecom';
      if (!src) continue; // tele orders are already counted from the KPI log
      rev[src] += o.total || 0; cnt[src]++;
      if (series[d]) { series[d][src] += o.total || 0; series[d].orders++; }
      hours[hourTH(o.date)].orders++;
      if (src === 'ecom') { const pl = PLATFORMS[o.platform] ? PLATFORMS[o.platform].label : 'อื่น ๆ'; platform[pl] = (platform[pl] || 0) + (o.total || 0); }
      if (src === 'admin' && c.page) pages[c.page] = (pages[c.page] || 0) + (o.total || 0);
      for (const it of (o.items || [])) { const p = prod[it.name] || (prod[it.name] = { name: it.name, qty: 0, revenue: 0, tele: 0, admin: 0, ecom: 0 }); p.qty += it.qty; p.revenue += it.qty * it.price; p[src] += it.qty; }
    }
    const total = rev.tele + rev.admin + rev.ecom;
    const orders = cnt.tele + cnt.admin + cnt.ecom;
    const team = teles(st).map((u) => teleKpi(st, u.id, from, to));
    const sum = team.reduce((a, r) => { a.calls += r.calls; a.talked += r.talked; a.orders += r.orders; a.amount += r.amount; a.talkSec += r.talkSec; a.ocCalls += r.oc.calls; a.ocTalk += r.oc.talkSec; return a; }, { calls: 0, talked: 0, orders: 0, amount: 0, talkSec: 0, ocCalls: 0, ocTalk: 0 });
    const nowT = Date.now();
    const overdue = st.appointments.filter((a) => !a.done && Date.parse(a.at) < nowT - 3600000);
    const todayAppts = st.appointments.filter((a) => dayKey(a.at) === today());
    const monthFrom = today().slice(0, 8) + '01';
    let monthRev = 0;
    if (from === monthFrom && to === today()) monthRev = total;
    else {
      for (const k of st.kpi) if (inRange(k.date, monthFrom, today())) monthRev += k.amount || 0;
      for (const c of st.customers) for (const o of (c.orders || [])) if ((o.source === 'admin' || o.source === 'pancake' || o.source === 'ecom') && o.status !== 'cancelled' && inRange(dayKey(o.date), monthFrom, today())) monthRev += o.total || 0;
    }
    const funnel = { leads: st.customers.filter((c) => inRange(dayKey(c.assignedAt || c.createdAt), from, to)).length, called: sum.calls, talked: sum.talked, won: sum.orders };
    const stale = st.customers.filter((c) => c.owner && isStale(st, c));
    const statusMix = {}; for (const c of st.customers) if (c.owner) statusMix[c.status] = (statusMix[c.status] || 0) + 1;
    const lostReasons = {}; for (const k of st.kpi) if (k.result === 'lost' && inRange(k.date, from, to)) lostReasons[k.lostReason || 'ไม่ระบุ'] = (lostReasons[k.lostReason || 'ไม่ระบุ'] || 0) + 1;
    return {
      from, to, days, series, rev, cnt, total, orders, aov: orders ? total / orders : 0,
      monthRev, monthTarget: st.settings.targets.teamRevenueMonth,
      team, teamSum: sum, contactRate: sum.calls ? sum.talked / sum.calls : 0, conversion: sum.talked ? sum.orders / sum.talked : 0,
      admins: adminBoard(st, from, to),
      products: Object.values(prod).sort((a, b) => b.revenue - a.revenue || b.qty - a.qty).slice(0, 10),
      platform, pages, hours, funnel, statusMix, lostReasons,
      overdue: overdue.length, todayAppts: todayAppts.length, todayApptsDone: todayAppts.filter((a) => a.done).length,
      pending: st.approvals.filter((a) => a.status === 'pending').length,
      stale: stale.length,
      leads: { fb: st.customers.filter((c) => c.channel === 'fb').length, ecom: st.customers.filter((c) => c.channel === 'ecom').length },
    };
  }

  // ---------------------------------------------------------------- parsing
  // Paste from BigSeller / Excel: detects the header row and maps Thai/English column names.
  function parseTable(text) {
    const lines = String(text || '').replace(/\r/g, '').split('\n').filter((l) => l.trim());
    if (!lines.length) return [];
    const sep = lines[0].includes('\t') ? '\t' : ',';
    const split = (l) => { if (sep === '\t') return l.split('\t'); const out = []; let cur = '', q = false; for (const ch of l) { if (ch === '"') q = !q; else if (ch === ',' && !q) { out.push(cur); cur = ''; } else cur += ch; } out.push(cur); return out; };
    const head = split(lines[0]).map((h) => h.trim().toLowerCase());
    const find = (...keys) => head.findIndex((h) => keys.some((k) => h.includes(k)));
    const col = {
      orderNo: find('order no', 'order number', 'order id', 'เลขที่คำสั่งซื้อ', 'หมายเลขคำสั่งซื้อ', 'เลขออเดอร์'),
      platform: find('platform', 'แพลตฟอร์ม', 'ช่องทาง', 'store', 'ร้าน'),
      name: find('buyer name', 'recipient', 'customer', 'ชื่อผู้รับ', 'ชื่อลูกค้า', 'ชื่อ', 'name'),
      phone: find('phone', 'mobile', 'เบอร์', 'โทร'),
      address: find('address', 'ที่อยู่'),
      product: find('product', 'item', 'sku', 'สินค้า'),
      total: find('total', 'amount', 'ยอด', 'ราคา', 'price'),
      date: find('date', 'created', 'วันที่', 'time'),
    };
    const hasHead = col.phone >= 0;
    const rows = [];
    for (const l of lines.slice(hasHead ? 1 : 0)) {
      const c = split(l).map((x) => x.trim());
      const g = (k, i) => (hasHead ? (col[k] >= 0 ? c[col[k]] : '') : c[i]) || '';
      const pl = g('platform', 5).toLowerCase();
      rows.push({ orderNo: g('orderNo', 0), name: g('name', 1), phone: g('phone', 2), address: g('address', 3), product: g('product', 4),
        platform: pl.includes('shopee') ? 'shopee' : pl.includes('tiktok') ? 'tiktok' : pl.includes('evolution') ? 'evolution' : 'lazada', total: g('total', 6), date: g('date', 7) });
    }
    return rows.filter((r) => r.phone || r.name);
  }

  return {
    TZ, ROLES, RESULTS, LOST_REASONS, STATUS, ROUNDS, PLATFORMS, DEFAULT_USERS, DEFAULT_SETTINGS, DEFAULT_PRODUCTS, PERM,
    uid, nowIso, dayKey, today, addDays, daysBetween, thDate, thTime, baht, num, dur, hms, normPhone, fmtPhone, TH_DOW, TH_MON,
    emptyState, normalize, apply, can, isBoss, userById, userName, teles, admins, findCustomer, byPhone, customerTotal, isStale,
    visibleState, teleKpi, adminBoard, dashboard, parseTable, nextTele,
  };
});
