/* Example data for demo mode (and SEED_DEMO=1 on the server).
 * Every name, phone number and address here is invented. Product codes and price points
 * follow the real Pancake catalogue so the dashboard looks like a normal working day.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./core.js'));
  else root.HubDemoSeed = factory(root.HubCore);
})(typeof self !== 'undefined' ? self : this, function (H) {
  'use strict';
  function rng(seed) { let s = seed >>> 0; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }
  const FIRST = ['สมใจ', 'วันเพ็ญ', 'ประภา', 'อรุณี', 'กัญญา', 'สุดารัตน์', 'นิภา', 'พรทิพย์', 'จันทร์เพ็ญ', 'รัชนี', 'มาลี', 'ศิริพร', 'ละเอียด', 'บุญเรือน', 'สมศรี', 'อัญชลี', 'ปราณี', 'วิไล', 'ทองใบ', 'กาญจนา', 'สุนีย์', 'ดวงใจ', 'อำไพ', 'เยาวลักษณ์', 'ชนิดา', 'สมชาย', 'ประเสริฐ', 'วิชัย', 'สุรชัย', 'อนันต์'];
  const LAST = ['ใจดี', 'สุขสวัสดิ์', 'ศรีสุข', 'แก้วมณี', 'ทองคำ', 'บุญมา', 'พึ่งบุญ', 'มีสุข', 'รุ่งเรือง', 'ศรีวงศ์', 'จันทร์หอม', 'ชัยมงคล', 'วงศ์ไทย', 'สายทอง', 'เพชรรัตน์'];
  const PROV = [['บางกะปิ', 'กรุงเทพฯ', '10240'], ['เมือง', 'นนทบุรี', '11000'], ['หาดใหญ่', 'สงขลา', '90110'], ['เมือง', 'เชียงใหม่', '50000'], ['เมือง', 'ขอนแก่น', '40000'], ['บางพลี', 'สมุทรปราการ', '10540'], ['เมือง', 'นครราชสีมา', '30000'], ['ศรีราชา', 'ชลบุรี', '20110'], ['เมือง', 'อุดรธานี', '41000'], ['เมือง', 'ภูเก็ต', '83000']];
  const PAGES = ['Yanhee Anti-Aging ชะลอวัยสูตรเฉพาะจากยันฮี', 'Yanhee Neck Cream ครีมบำรุงคอพร้อมหัวกัวซา', 'เซรั่มปลูกผม ยันฮี ทีเซอร์', 'Yanhee Eye Serum Thailand', 'Yanhee Daily Vitamin', 'Yanhee Fozinnia วิตามินฟื้นฟูวัยทอง'];
  const PAGE_PRODUCT = [[0, 1, 2], [3, 4, 5], [6, 7], [8, 9], [10, 11], [12, 13]];

  function build() {
    const r = rng(20261008);
    const pick = (a) => a[Math.floor(r() * a.length)];
    const st = H.emptyState();
    st.demo = true;
    const P = st.settings.products;
    const sys = { id: 'system', role: 'system' };
    const asUser = (id) => ({ ...H.userById(st, id) });
    const T = H.today();
    const usedPhones = new Set();
    const phone = () => { let p; do { p = '0' + pick(['8', '9', '6']) + String(Math.floor(r() * 1e8)).padStart(8, '0'); } while (usedPhones.has(p)); usedPhones.add(p); return p; };
    const person = () => pick(FIRST) + ' ' + pick(LAST);
    const addr = () => { const a = pick(PROV); return (Math.floor(r() * 300) + 1) + '/' + (Math.floor(r() * 90) + 1) + ' ซ.' + (Math.floor(r() * 40) + 1) + ' อ.' + a[0] + ' จ.' + a[1] + ' ' + a[2]; };
    const at = (day, h, m) => new Date(Date.parse(day + 'T00:00:00Z') - H.TZ + (h * 60 + (m || 0)) * 60000).toISOString();
    // Freeze "now" for the seed by writing timestamps directly, then fix fields that apply() stamps.
    const stamp = (iso, fn) => { const real = Date.now; const t = Date.parse(iso); Date.now = () => t; const RD = Date; try { return fn(); } finally { Date.now = real; } };

    // ---- 1) history: past purchases so tickets have order history (60–10 days ago)
    const oldCustomers = [];
    for (let i = 0; i < 46; i++) {
      const pg = Math.floor(r() * PAGES.length);
      const owner = i % 2 ? 'khem' : 'wan';
      const name = person(), ph = phone();
      const firstDay = H.addDays(T, -(20 + Math.floor(r() * 50)));
      const res = stamp(at(firstDay, 10 + Math.floor(r() * 8), Math.floor(r() * 60)), () => H.apply(st, 'createClose', {
        name, phone: ph, address: addr(), page: PAGES[pg], items: [{ name: P[pick(PAGE_PRODUCT[pg])].code, qty: 1 }], closer: i % 3 ? 'laila' : 'admin2', date: at(firstDay, 11),
      }, asUser(i % 3 ? 'laila' : 'admin2')));
      { const ap = st.approvals.find((x) => x.id === res.id); const cc = H.findCustomer(st, res.customerId); if (ap) ap.assigned = owner; if (cc) cc.owner = owner; for (const a of st.appointments) if (a.customerId === res.customerId) a.owner = owner; }
      const c = H.findCustomer(st, res.customerId);
      c.round = pick(['T2', 'T3', 'T3']); c.status = pick(['won', 'later', 'warm', 'followup']);
      // a few repeat orders
      if (r() < 0.55) { const d2 = H.addDays(firstDay, 12 + Math.floor(r() * 10)); if (d2 < T) c.orders.push({ id: H.uid('o'), date: at(d2, 13), items: [{ name: P[pick(PAGE_PRODUCT[pg])].name, qty: 1 + Math.floor(r() * 2), price: P[pick(PAGE_PRODUCT[pg])].price }], total: P[PAGE_PRODUCT[pg][1] || PAGE_PRODUCT[pg][0]].price, status: 'paid', source: 'tele', by: owner, note: 'ซื้อซ้ำจาก T3' }); }
      c.orders.sort((a, b) => Date.parse(b.date) - Date.parse(a.date));
      c.appointments = undefined;
      oldCustomers.push(c);
    }
    st.appointments = [];

    // ---- 2) Marketplace customers (Lazada / Shopee / TikTok) over the last 14 days
    const ecomRows = [];
    for (let d = 13; d >= 0; d--) {
      const day = H.addDays(T, -d);
      const n = 3 + Math.floor(r() * 4);
      for (let i = 0; i < n; i++) {
        const p = pick(P);
        ecomRows.push({ day, row: { orderNo: String(80000000 + Math.floor(r() * 9999999)), platform: pick(['lazada', 'lazada', 'shopee', 'tiktok']), name: person(), phone: phone(), address: addr(), items: [{ name: p.code, qty: 1 }], total: p.price - pick([0, 0, 40, 90]), date: at(day, 9 + Math.floor(r() * 12), Math.floor(r() * 60)) } });
      }
    }
    for (const e of ecomRows) stamp(e.row.date, () => H.apply(st, 'ingestEcom', { rows: [e.row] }, sys));

    // ---- 3) Admin closes over the last 14 days (FB Page / Pancake), approved 50:50
    for (let d = 13; d >= 0; d--) {
      const day = H.addDays(T, -d);
      const n = d === 0 ? 7 : 9 + Math.floor(r() * 8);
      for (let i = 0; i < n; i++) {
        const pg = Math.floor(r() * PAGES.length);
        const h = 9 + Math.floor(r() * (d === 0 ? 2.5 : 11));
        const closer = r() < 0.55 ? 'laila' : 'admin2';
        const items = [{ name: P[pick(PAGE_PRODUCT[pg])].code, qty: 1 }];
        const res = stamp(at(day, h, Math.floor(r() * 60)), () => H.apply(st, 'createClose', { name: person(), phone: phone(), address: addr(), page: PAGES[pg], items, date: at(day, h, 5), source: r() < 0.7 ? 'pancake' : 'admin', closerName: closer === 'laila' ? 'ไลลา' : 'แอดมิน 2', closer }, sys));
      }
    }

    // ---- 4) Telesales calls (KPI log) for the last 14 days
    const results = ['no_answer', 'no_answer', 'no_answer', 'no_answer', 'no_answer', 'followup', 'followup', 'warm', 'info', 'later', 'later', 'hot', 'won', 'lost', 'won', 'no_answer', 'awaiting_payment', 'later'];
    for (const u of ['khem', 'wan']) {
      const mine = () => st.customers.filter((c) => c.owner === u);
      for (let d = 13; d >= 0; d--) {
        const day = H.addDays(T, -d);
        const dow = new Date(day + 'T00:00:00Z').getUTCDay();
        if (dow === 0 && d !== 0) continue; // Sunday off
        const skill = u === 'khem' ? 1.05 : 0.92;
        const fbN = d === 0 ? (u === 'khem' ? 14 : 9) : Math.round((24 + r() * 12) * skill);
        const mkN = d === 0 ? (u === 'khem' ? 9 : 6) : Math.round((22 + r() * 12) * skill);
        const startH = 9;
        const plan = [];
        for (let i = 0; i < fbN; i++) plan.push('fb');
        for (let i = 0; i < mkN; i++) plan.push('ecom');
        plan.sort(() => r() - 0.5);
        plan.forEach((ch, i) => {
          const pool = mine().filter((c) => c.channel === ch);
          const c = pool.length ? pick(pool) : null;
          if (!c) return;
          const minute = Math.floor(i * ((d === 0 ? 150 : 480) / plan.length));
          const when = at(day, startH + Math.floor(minute / 60), minute % 60);
          let result = pick(results);
          if (r() > skill - 0.15 && result === 'won') result = 'warm';
          const talkedSec = result === 'no_answer' ? Math.floor(r() * 25) : 60 + Math.floor(r() * 420);
          const p = pick(P);
          const sold = result === 'won' || result === 'awaiting_payment';
          const round = ch === 'fb' ? (c.round || pick(['T1', 'T2', 'T3', 'T3'])) : '';
          stamp(when, () => H.apply(st, 'logCall', {
            customerId: c.id, result, durationSec: talkedSec, round,
            items: sold ? [{ name: p.code, qty: 1 + (r() < 0.25 ? 1 : 0) }] : [], lostReason: result === 'lost' ? pick(H.LOST_REASONS) : '',
            note: sold ? 'ลูกค้ารับโปร ส่งฟรี' : result === 'followup' ? 'ขอให้โทรกลับช่วงเย็น' : '',
            nextAt: ['followup', 'warm', 'info', 'hot'].includes(result) ? at(H.addDays(day, 1 + Math.floor(r() * 4)), 10 + Math.floor(r() * 7), pick([0, 15, 30, 45])) : '',
            nextPurpose: result === 'hot' ? 'ปิดการขาย ส่งโปรล่าสุด' : 'โทรติดตามตามนัด',
          }, asUser(u)));
          const k = st.kpi[st.kpi.length - 1]; k.date = day; k.at = when;
          // OneCall shadow record for the same call
          st.onecall.push({ id: 'oc' + st.onecall.length, user: u, phone: c.phone, dur: talkedSec, at: when, dir: 'out' });
        });
      }
    }
    // A couple of whole-day summaries (the "กรอกยอดรวมทั้งวัน" mode)
    const yd = H.addDays(T, -1);
    stamp(at(yd, 18), () => H.apply(st, 'addKpi', { mode: 'summary', date: yd, channel: 'mkt', calls: 6, talkedCount: 3, durationSec: 840, amount: 0, orders: 0, note: 'โทรจากรายชื่อ Evolution ที่ไม่มีในระบบ' }, asUser('wan')));

    // older auto-created T1 appointments were handled on the day; keep the calendar realistic
    for (const a of st.appointments) if (Date.parse(a.at) < Date.now() - 3600000) { a.done = true; a.doneAt = a.at; }
    for (const a of st.appointments) if (!a.done && H.dayKey(a.at) === T && a.by === 'system') { a.done = true; a.doneAt = a.at; }
    // ---- 5) appointments for today/tomorrow so the calendar is alive
    const todayAppts = [['khem', 13, 30, 'T2 ถามผลการใช้ เสนอเซ็ต 2 กล่อง'], ['khem', 15, 0, 'T3 ชวนสั่งซ้ำ ของใกล้หมด'], ['wan', 14, 0, 'โทรกลับตามนัด ลูกค้าขอเย็น'], ['wan', 16, 30, 'T2 อัปเซล Eye Serum'], ['khem', 10, 0, 'T1 ยืนยันที่อยู่จัดส่ง']];
    for (const [u, h, m, purpose] of todayAppts) {
      const c = pick(st.customers.filter((x) => x.owner === u && x.channel === 'fb'));
      H.apply(st, 'addAppt', { customerId: c.id, at: at(T, h, m), purpose, round: purpose.slice(0, 2).startsWith('T') ? purpose.slice(0, 2) : '' }, asUser(u));
    }
    // two overdue ones (yesterday, not done)
    for (const u of ['wan', 'wan', 'khem']) {
      const c = pick(st.customers.filter((x) => x.owner === u));
      H.apply(st, 'addAppt', { customerId: c.id, at: at(yd, 16, 0), purpose: 'โทรติดตาม (เลยนัด)' }, asUser(u));
    }
    // refresh each ticket's next appointment, and give long-standing customers a recent touch
    for (const c of st.customers) {
      const open = st.appointments.filter((a) => a.customerId === c.id && !a.done).sort((a, b) => Date.parse(a.at) - Date.parse(b.at));
      c.nextApptAt = open.length ? open[0].at : null;
      if (!['won', 'lost'].includes(c.status) && r() < 0.7) c.lastContactAt = at(H.addDays(T, -Math.floor(r() * 2)), 9 + Math.floor(r() * 3));
    }
    // ---- 6) announcements
    st.announcements = [
      { id: 'an1', title: 'โปรเดือน ต.ค. : ซื้อ Anti-Aging 2 กล่อง แถม Serum 1 ขวด', body: 'ใช้ได้ทั้ง FB และ Telesales ถึง 31 ต.ค. 2569', at: at(H.addDays(T, -3), 9), by: 'at' },
      { id: 'an2', title: 'เริ่มใช้ Evolution Hub Commerce แทนระบบเดิม', body: 'บันทึกการโทรทุกสายในหน้า ลูกค้าของฉัน หรือ บันทึก KPI ตัวเลขจะขึ้น Dashboard ผู้บริหารทันที', at: at(H.addDays(T, -1), 8, 30), by: 'mo' },
      { id: 'an3', title: 'ประชุมทีมขายประจำสัปดาห์ วันจันทร์ 09:30 น.', body: '', at: at(T, 8), by: 'mo' },
    ];
    st.sync = {
      pancake: { lastRun: at(T, 11, 2), lastAdded: 2, lastError: null, mode: 'demo' },
      bigseller: { lastRun: at(T, 9, 40), lastAdded: 4, lastOrders: 5 },
      onecall: { lastRun: at(T, 11, 0), lastAdded: 23 },
      legacy: {},
    };
    st.activity = st.activity.slice(0, 60);
    return st;
  }
  return { build };
});
