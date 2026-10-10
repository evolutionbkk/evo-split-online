/* Evolution Hub Commerce — front end (vanilla JS, no build step).
 * Live mode talks to server.js; demo mode (window.HUB_DEMO) runs the same core rules in the browser.
 */
(function () {
  'use strict';
  const H = window.HubCore;
  const DEMO = !!window.HUB_DEMO;
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const B = H.baht, N = H.num;
  const pct = (a, b) => (b ? Math.min(100, Math.round(a / b * 100)) : 0);
  const pctTxt = (x) => Math.round(x * 100) + '%';

  // ------------------------------------------------------------ icons
  const IC = {
    help: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9.2a2.6 2.6 0 0 1 5 .9c0 1.7-2.5 2.2-2.5 3.9"/><path d="M12 17.2h.01"/>',
    play: '<path d="M8 5.5v13l10-6.5z"/>',
    home: '<path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V21h14V9.5"/><path d="M10 21v-6h4v6"/>',
    chart: '<path d="M3 3v18h18"/><path d="M7 15l4-4 3 3 5-6"/>',
    users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c.8-3.5 3.4-5.5 6.5-5.5s5.7 2 6.5 5.5"/><path d="M16 4.5a3.5 3.5 0 0 1 0 7"/><path d="M18 14.5c2 .6 3.2 2.5 3.5 5.5"/>',
    phone: '<path d="M5 3h4l2 5-2.5 1.5a11 11 0 0 0 6 6L16 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 5a2 2 0 0 1 2-2z"/>',
    calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
    clip: '<rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 4V3h6v1"/><path d="M9 11h6M9 15h4"/>',
    cart: '<circle cx="9" cy="20" r="1.4"/><circle cx="18" cy="20" r="1.4"/><path d="M2 3h3l2.4 12h11.2L21 7H6.2"/>',
    check: '<path d="M4 12.5l5 5L20 6.5"/>',
    checkc: '<circle cx="12" cy="12" r="9"/><path d="M8 12.5l3 3 5-6"/>',
    gear: '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1"/>',
    bell: '<path d="M6 8a6 6 0 1 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.9 1.9 0 0 0 3.4 0"/>',
    brief: '<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 13h18"/>',
    headset: '<path d="M4 14v-2a8 8 0 0 1 16 0v2"/><rect x="2.5" y="14" width="4" height="6" rx="1.5"/><rect x="17.5" y="14" width="4" height="6" rx="1.5"/>',
    msg: '<path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z"/>',
    inbox: '<path d="M3 13h5l2 3h4l2-3h5"/><path d="M5 5h14l2 8v6H3v-6z"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/>',
    x: '<path d="M6 6l12 12M18 6 6 18"/>',
    ban: '<circle cx="12" cy="12" r="9"/><path d="M5.6 5.6l12.8 12.8"/>',
    menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
    refresh: '<path d="M20 11a8 8 0 0 0-14.7-4.3L3 9"/><path d="M3 4v5h5"/><path d="M4 13a8 8 0 0 0 14.7 4.3L21 15"/><path d="M21 20v-5h-5"/>',
    lock: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
    mega: '<path d="M3 11v2a1 1 0 0 0 1 1h3l6 4V6L7 10H4a1 1 0 0 0-1 1z"/><path d="M17 8a5 5 0 0 1 0 8"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    link: '<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>',
    upload: '<path d="M12 15V3M7 8l5-5 5 5"/><path d="M4 15v4a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-4"/>',
    download: '<path d="M12 4v11"/><path d="M7 10l5 5 5-5"/><path d="M5 20h14"/>',
    logout: '<path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3"/><path d="M10 17l-5-5 5-5M5 12h11"/>',
    pin: '<path d="M12 21s-7-6.2-7-12a7 7 0 0 1 14 0c0 5.8-7 12-7 12z"/><circle cx="12" cy="9" r="2.5"/>',
    bag: '<path d="M5 8h14l-1 13H6z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/>',
    store: '<path d="M4 9l1.5-5h13L20 9"/><path d="M4 9a2.7 2.7 0 0 0 5.3 0 2.7 2.7 0 0 0 5.4 0 2.7 2.7 0 0 0 5.3 0"/><path d="M5 11v9h14v-9"/>',
    note: '<path d="M4 4h16v12l-4 4H4z"/><path d="M16 20v-4h4M8 9h8M8 13h5"/>',
    left: '<path d="M15 5l-7 7 7 7"/>', right: '<path d="M9 5l7 7-7 7"/>', down: '<path d="M6 9l6 6 6-6"/>',
    play: '<path d="M7 4l13 8-13 8z"/>', stop: '<rect x="6" y="6" width="12" height="12" rx="2"/>',
    send: '<path d="M21 3 10 14"/><path d="M21 3l-7 18-4-7-7-4z"/>',
    alert: '<path d="M12 3l10 18H2z"/><path d="M12 10v5M12 18v.5"/>',
  };
  const ico = (n, cls) => '<svg class="ico ' + (cls || '') + '" viewBox="0 0 24 24" aria-hidden="true">' + (IC[n] || '') + '</svg>';
  const av = (u, size) => u ? '<span class="avatar ' + (size || '') + ' av-' + esc(u.id) + '" title="' + esc(u.name) + '">' + esc(u.initial || (u.name || '?').slice(0, 1)) + '</span>' : '';

  // ------------------------------------------------------------ app state
  const S = { me: null, full: null, view: null, integrations: {}, updatedAt: null, page: 'home' };
  const ui = {
    range: 'today', chart: 'rev', custTab: 'fb', q: '', status: 'all', round: 'all', owner: 'all', limit: 120,
    calMonth: H.today().slice(0, 7), calDay: H.today(), calOwner: 'all',
    kpiMode: 'call', kpiUser: null, kpiDate: H.today(), apTab: 'pending', drawer: null, dTab: 'call', closeAdmin: 'all',
  };
  try { Object.assign(ui, JSON.parse(localStorage.getItem('hub-ui') || '{}'), { drawer: null }); } catch (_) { /* storage blocked */ }
  if (ui.calMonth < H.today().slice(0, 7) || ui.kpiDate !== H.today()) { ui.calMonth = H.today().slice(0, 7); ui.calDay = H.today(); ui.kpiDate = H.today(); }
  const remember = () => { try { const { drawer, ...rest } = ui; localStorage.setItem('hub-ui', JSON.stringify(rest)); } catch (_) { /* ignore */ } };
  const V = () => S.view;
  const boss = () => H.isBoss(S.me);
  const user = (id) => H.userById(S.full || S.view, id);
  const uname = (id) => H.userName(S.full || S.view, id);

  // ------------------------------------------------------------ data layer
  const DEMO_KEY = 'hub-demo-v1';
  const api = {
    async boot() {
      if (DEMO) {
        let st = null;
        try { const raw = localStorage.getItem(DEMO_KEY); if (raw) { const j = JSON.parse(raw); if (j.day === H.today()) st = j.state; } } catch (_) { st = null; }
        S.full = H.normalize(st || window.HubDemoSeed.build()); H.autoDistribute(S.full);
        let who = 'at'; try { who = localStorage.getItem('hub-demo-user') || 'at'; } catch (_) { /* ignore */ }
        S.me = H.userById(S.full, who) || H.userById(S.full, 'at');
        S.view = H.visibleState(S.full, S.me);
        S.integrations = { pancake: true, onecall: true, demo: true };
        return true;
      }
      const r = await fetch('/api/state', { credentials: 'same-origin' });
      if (r.status === 401) return false;
      const j = await r.json();
      S.me = j.me; S.view = j.state; S.full = H.isBoss(j.me) ? j.state : null; S.integrations = j.integrations || {}; S.updatedAt = j.updatedAt;
      return true;
    },
    saveDemo() { try { localStorage.setItem(DEMO_KEY, JSON.stringify({ day: H.today(), state: S.full })); } catch (_) { /* quota or blocked: keep in memory */ } },
    async act(type, payload) {
      if (DEMO) {
        const r = H.apply(S.full, type, payload, S.me);
        S.view = H.visibleState(S.full, S.me);
        api.saveDemo();
        return r;
      }
      const r = await fetch('/api/action', { method: 'POST', headers: { 'content-type': 'application/json' }, credentials: 'same-origin', body: JSON.stringify({ type, payload }) });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j.error || 'บันทึกไม่สำเร็จ');
      await api.refresh(true);
      return j.result;
    },
    async refresh(force) {
      if (DEMO) return false;
      const r = await fetch('/api/state' + (force ? '' : '?since=' + encodeURIComponent(S.updatedAt || '')), { credentials: 'same-origin' });
      if (r.status === 401) { location.reload(); return false; }
      const j = await r.json();
      if (j.unchanged) return false;
      S.me = j.me; S.view = j.state; S.full = H.isBoss(j.me) ? j.state : null; S.integrations = j.integrations || {}; S.updatedAt = j.updatedAt;
      return true;
    },
    async post(url, body) {
      if (DEMO) throw new Error('โหมดตัวอย่าง: ปุ่มนี้จะเชื่อมต่อระบบจริงเมื่อเปิดใช้งานบน Railway');
      const r = await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json' }, credentials: 'same-origin', body: JSON.stringify(body || {}) });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j.error || 'ไม่สำเร็จ');
      await api.refresh(true);
      return j;
    },
  };

  // ------------------------------------------------------------ toast
  function toast(msg, bad) {
    let box = $('.toasts'); if (!box) { box = document.createElement('div'); box.className = 'toasts'; document.body.appendChild(box); }
    const t = document.createElement('div'); t.className = 'toast' + (bad ? ' bad' : ''); t.setAttribute('role', 'status');
    t.innerHTML = ico(bad ? 'alert' : 'checkc') + '<span>' + esc(msg) + '</span>';
    box.appendChild(t); setTimeout(() => t.remove(), bad ? 5200 : 3200);
  }
  async function run(fn, okMsg) {
    try { const r = await fn(); if (okMsg) toast(typeof okMsg === 'function' ? okMsg(r) : okMsg); render(); return r; }
    catch (e) { toast(e.message || String(e), true); return null; }
  }

  // ------------------------------------------------------------ navigation
  const PAGES = {
    home: { t: 'หน้าหลัก', crumb: 'Evolution Hub Commerce : หน้าหลัก', ico: 'home' },
    overview: { t: 'ภาพรวมผู้บริหาร', crumb: 'Executive : ภาพรวมทีมขาย', ico: 'chart' },
    today: { t: 'คิวโทรวันนี้', crumb: 'Telesales : คิวโทรวันนี้', ico: 'phone' },
    customer: { t: 'รายละเอียดลูกค้า', crumb: '', ico: 'users' },
    customers: { t: 'ลูกค้า', crumb: 'Telesales : รายชื่อลูกค้า', ico: 'users' },
    calendar: { t: 'ปฏิทินนัดหมาย', crumb: 'Telesales : ปฏิทินนัดโทรลูกค้า', ico: 'calendar' },
    kpi: { t: 'บันทึก KPI', crumb: 'Telesales : บันทึก KPI รายวัน', ico: 'clip' },
    close: { t: 'ปิดการขาย', crumb: 'Admin Sales : บันทึกปิดการขาย', ico: 'cart' },
    approvals: { t: 'อนุมัติแจกรายชื่อ', crumb: 'Telesales : แจกรายชื่อ FB Page 50:50', ico: 'inbox' },
    dnc: { t: 'ยกเลิกการติดต่อถาวร', crumb: '', ico: 'ban' },
    ovtele: { t: 'ภาพรวมเทเลเซลล์', crumb: '', ico: 'phone' },
    ovadmin: { t: 'ภาพรวมแอดมิน', crumb: '', ico: 'msg' },
    settings: { t: 'ตั้งค่า', crumb: 'System : ตั้งค่าและการเชื่อมต่อ', ico: 'gear' },
    help: { t: 'คู่มือการใช้งาน', crumb: 'ช่วยเหลือ : คู่มือการใช้งาน', ico: 'help' },
  };
  function allowed(page) {
    const r = S.me.role;
    if (page === 'home' || page === 'help') return true;
    if (page === 'overview' || page === 'ovtele' || page === 'ovadmin') return boss() || r === 'tele';
    if (page === 'settings') return boss();
    if (page === 'kpi') return r === 'tele';
    if (page === 'today') return false;   // call queue removed: telesales work from the customer list
    if (['customers', 'customer', 'calendar'].includes(page)) return boss() || r === 'tele';
    if (page === 'close') return boss() || r === 'admin';
    if (page === 'approvals' || page === 'dnc') return boss() || r === 'tele';
    return false;
  }
  function go(page) {
    if (!allowed(page)) { toast('หน้านี้สำหรับ ' + ({ overview: 'ผู้บริหาร', settings: 'ผู้บริหาร', close: 'Admin Sales', customers: 'Telesales', calendar: 'Telesales', kpi: 'Telesales', approvals: 'Telesales และหัวหน้าทีม' }[page] || ''), true); return; }
    S.page = page; ui.drawer = null;
    try { history.replaceState(null, '', '#' + page); } catch (_) { /* sandboxed */ }
    $('.side') && $('.side').classList.remove('open');
    render(); window.scrollTo(0, 0);
  }
  // new leads handed to me today that I have not called yet (distribution itself is automatic)
  function pendingCount() { if (boss()) return 0; const v = V(), T = H.today(); return (v.approvals || []).filter((a) => a.status === 'approved' && a.assigned === S.me.id && H.dayKey(a.decidedAt || a.at) === T && ((H.findCustomer(S.full || v, a.customerId) || {}).status === 'new')).length; }
  function overdueAppts() { const now = Date.now(), T = H.today(); return (V().appointments || []).filter((a) => !a.done && (H.thTime(a.at) === '00:00' ? H.dayKey(a.at) < T : Date.parse(a.at) < now - 3600000) && (boss() || a.owner === S.me.id)); }

  // ------------------------------------------------------------ shell
  function shell(content) {
    const me = S.me, role = me.role;
    const nb = (id, label) => allowed(id) ? '<button class="' + (S.page === id || (id === 'customers' && S.page === 'customer') ? 'on' : '') + '" data-go="' + id + '">' + ico(PAGES[id].ico) + '<span>' + label + '</span>' + (id === 'approvals' && pendingCount() ? '<span class="badge">' + pendingCount() + '</span>' : '') + (id === 'calendar' && overdueAppts().length ? '<span class="badge">' + overdueAppts().length + '</span>' : '') + '</button>' : '';
    const isExec = boss();
    const helpGrp = () => { ui.navOpen = ui.navOpen || {}; if (ui.navOpen.hp == null) ui.navOpen.hp = true;
      return '<div class="ngrp' + (ui.navOpen.hp ? ' open' : '') + '"><button class="ngrp-h' + (S.page === 'help' ? ' in' : '') + '" data-act="nav-toggle" data-v="hp" data-nav-key="hp">' + ico('help') + '<span>ช่วยเหลือ</span><i class="chev" data-act="nav-toggle" data-v="hp" aria-label="ย่อ/ขยาย">' + ico('down') + '</i></button>' +
        '<div class="nsub"><button class="nsub-i l1' + (S.page === 'help' ? ' on' : '') + '" data-go="help"><i class="dot"></i><span>คู่มือการใช้งาน</span></button></div></div>'; };
    // executive: a short two-group tree (overview -> tele/admin, customers -> distributed/cancelled)
    const tree = () => {
      ui.navOpen = ui.navOpen || { ov: true, cu: true, all: true };
      const on = (ids) => ids.includes(S.page === 'customer' ? 'customers' : S.page);
      const grp = (key, id, label, icon, ids, kids) => '<div class="ngrp' + (ui.navOpen[key] ? ' open' : '') + '"><button class="ngrp-h' + (on([id]) ? ' on' : on(ids) ? ' in' : '') + '"' + (id ? ' data-go="' + id + '"' : ' data-act="nav-toggle" data-v="' + key + '"') + ' data-nav-key="' + key + '">' + ico(icon) + '<span>' + label + '</span><i class="chev" data-act="nav-toggle" data-v="' + key + '" aria-label="ย่อ/ขยาย">' + ico('down') + '</i></button><div class="nsub">' + kids + '</div></div>';
      const sub = (id, label, lvl) => '<button class="nsub-i l' + (lvl || 1) + (on([id]) ? ' on' : '') + '" data-go="' + id + '"><i class="dot"></i><span>' + label + '</span></button>';
      const sub2grp = (key, id, label, kids) => '<div class="ngrp2' + (ui.navOpen[key] ? ' open' : '') + '"><button class="nsub-i l1' + (on([id]) ? ' on' : '') + '" data-go="' + id + '" data-nav-key="' + key + '"><i class="dot"></i><span>' + label + '</span><i class="chev" data-act="nav-toggle" data-v="' + key + '" aria-label="ย่อ/ขยาย">' + ico('down') + '</i></button><div class="nsub">' + kids + '</div></div>';
      return grp('ov', 'overview', 'ภาพรวมทั้งหมด', 'chart', ['overview', 'ovtele', 'ovadmin'], sub('ovtele', 'เทเลเซลล์') + sub('ovadmin', 'แอดมิน')) +
        grp('cu', '', 'รายชื่อลูกค้า', 'users', ['customers', 'approvals', 'dnc'], sub2grp('all', 'customers', 'รายชื่อลูกค้าทั้งหมด', sub('approvals', 'รายชื่อลูกค้าที่ถูกแจก', 2) + sub('dnc', 'รายชื่อลูกค้าที่ยกเลิกการติดต่อ', 2))) +
        helpGrp();
    };
    const nav = isExec ? tree() : [
      nb('home', 'หน้าหลัก'),
      role === 'tele' ? nb('overview', 'ภาพรวมทีม') : '',
      boss() ? '<div class="nav-label">ผู้บริหาร</div>' + nb('overview', 'ภาพรวมผู้บริหาร') : '',
      (boss() || role === 'tele') ? '<div class="nav-label">เทเลเซลล์</div>' + nb('customers', boss() ? 'ลูกค้า' : 'ลูกค้าของฉัน') + nb('calendar', 'ปฏิทินนัดหมาย') + nb('kpi', 'บันทึก KPI') + nb('approvals', boss() ? 'การแจกรายชื่อ' : 'รายชื่อใหม่') + nb('dnc', 'ยกเลิกการติดต่อถาวร') : '',
      (boss() || role === 'admin') ? '<div class="nav-label">แอดมินเซลล์</div>' + nb('close', 'ปิดการขาย') : '',
      boss() ? '<div class="nav-label">ระบบ</div>' + nb('settings', 'ตั้งค่า') : '',
      '<div class="nav-sep"></div>' + helpGrp(),
    ].join('');
    const p = PAGES[S.page];
    const bellN = pendingCount() + overdueAppts().length;
    const sync = (V().sync || {}).pancake || {};
    return (DEMO ? demoBar() : '') +
      '<div class="shell"><aside class="side" aria-label="เมนู"><div class="brand"><b>EVOLUTION</b><small>Hub Commerce : ทีมขาย Office</small></div>' +
      '<nav class="nav">' + nav + '</nav>' +
      '<div class="side-foot"><b>สถานะการเชื่อมต่อ</b><span class="live">Pancake ' + (sync.lastRun ? H.thTime(sync.lastRun) + ' น.' : 'รอเชื่อมต่อ') + '</span><span style="opacity:.75">ข้อมูลอัปเดตอัตโนมัติ</span></div></aside>' +
      '<div class="main"><header class="head"><button class="icon-btn burger" data-act="menu" aria-label="เปิดเมนู">' + ico('menu') + '</button>' + crumbHtml() + '<span class="grow"></span>' +
      '<span class="hd-date hide-sm">' + longDay(H.today()) + '</span>' +
      '<button class="icon-btn plain" data-act="bell" aria-label="การแจ้งเตือน">' + ico('bell') + (bellN ? '<span class="dot"></span>' : '') + '</button>' +
      '<button class="me" data-act="me-menu">' + av(me, 'sm') + '<span class="who"><b>' + esc(me.name) + '</b><small>' + esc(H.ROLES[me.role].label) + '</small></span><span class="caret">▾</span></button></header>' +
      '<main class="page" id="page">' + content + '</main></div></div>';
  }
  function demoBar() {
    const ppl = (S.full.users || []).map((u) => '<button class="' + (S.me.id === u.id ? 'on' : '') + '" data-act="demo-user" data-id="' + u.id + '">' + esc(u.name) + '</button>').join('');
    return '<div class="demo-bar"><b>โหมดตัวอย่าง</b><span>ข้อมูลลูกค้าเป็นข้อมูลสมมติ ทดลองกดบันทึกได้ทุกปุ่ม : ดูในมุมมองของ</span><div class="seg">' + ppl + '</div><button class="link" data-act="demo-reset">ล้างข้อมูลตัวอย่าง</button></div>';
  }

  // ------------------------------------------------------------ helpers (UI)
  const statusPill = (s) => { const x = H.STATUS[s] || H.STATUS.new; return '<span class="pill st ' + x.tone + '">' + esc(x.label) + '</span>'; };
  const roundTag = (r) => r ? '<span class="tag ' + r.toLowerCase() + '">' + r + '</span>' : '';
  const platformTag = (p) => '<span class="tag">' + esc((H.PLATFORMS[p] || {}).label || p || '-') + '</span>';
  const srcLabel = { tele: 'Telesales', admin: 'Admin ปิดการขาย', pancake: 'Pancake (Admin)', ecom: 'E-Commerce', manual: 'บันทึกเอง', legacy: 'ระบบเดิม' };
  function meterCls(p) { return p >= 100 ? 'good' : p >= 60 ? 'warn' : 'bad'; }
  function lastOrderLine(c) {
    const o = (c.orders || [])[0]; if (!o) return '<span class="faint">ยังไม่มีออเดอร์</span>';
    return '<div class="ellip">' + esc((o.items || []).map((i) => i.name + (i.qty > 1 ? ' x' + i.qty : '')).join(', ') || 'ออเดอร์') + '</div><small class="muted">' + H.thDate(o.date) + ' : ' + B(o.total) + '</small>';
  }
  function apptLabel(c) {
    if (!c.nextApptAt) return '<span class="faint">-</span>';
    const late = Date.parse(c.nextApptAt) < Date.now() - 3600000;
    const today = H.dayKey(c.nextApptAt) === H.today();
    return '<span class="pill ' + (late ? 'bad' : today ? 'warn' : 'info') + '">' + (today ? 'วันนี้ ' + H.thTime(c.nextApptAt) : H.thDate(c.nextApptAt)) + (late ? ' (เลยนัด)' : '') + '</span>';
  }
  const products = () => (V().settings || {}).products || [];
  function prodDatalist() { return '<datalist id="prod-list">' + products().map((p) => '<option value="' + esc(p.code) + '">' + esc(p.name) + ' ' + B(p.price) + '</option>').join('') + '</datalist>'; }
  function itemRow(it) {
    it = it || {};
    return '<div class="item-row"><input class="in" list="prod-list" data-item="name" placeholder="รหัส/ชื่อสินค้า" value="' + esc(it.name || '') + '" aria-label="สินค้า">' +
      '<input class="in" type="number" min="1" data-item="qty" value="' + (it.qty || 1) + '" aria-label="จำนวน">' +
      '<input class="in" type="number" min="0" step="1" data-item="price" placeholder="ราคา" value="' + (it.price != null ? it.price : '') + '" aria-label="ราคาต่อชิ้น">' +
      '<button type="button" class="x" data-act="item-del" aria-label="ลบสินค้า">' + ico('x') + '</button></div>';
  }
  function itemsEditor(id, start) {
    return '<div class="field"><span>สินค้า (เลือกรหัสจากรายการ หรือพิมพ์ชื่อเอง)</span><div class="items" id="' + id + '">' + (start || [{}]).map(itemRow).join('') + '</div>' +
      '<button type="button" class="btn sm" data-act="item-add" data-target="' + id + '" style="justify-self:start">' + ico('plus') + ' เพิ่มสินค้า</button></div>';
  }
  function readItems(id) {
    return $$('#' + id + ' .item-row').map((r) => ({ name: $('[data-item=name]', r).value.trim(), qty: Number($('[data-item=qty]', r).value) || 1, price: $('[data-item=price]', r).value })).filter((i) => i.name);
  }
  function hmsInputs(prefix) {
    return '<div class="hms"><label><input class="in" type="number" min="0" name="' + prefix + 'h" placeholder="0" aria-label="ชั่วโมง"><small>ชม.</small></label>' +
      '<label><input class="in" type="number" min="0" max="59" name="' + prefix + 'm" placeholder="0" aria-label="นาที"><small>นาที</small></label>' +
      '<label><input class="in" type="number" min="0" max="59" name="' + prefix + 's" placeholder="0" aria-label="วินาที"><small>วินาที</small></label></div>';
  }
  const readHms = (f, prefix) => (Number(f[prefix + 'h'].value) || 0) * 3600 + (Number(f[prefix + 'm'].value) || 0) * 60 + (Number(f[prefix + 's'].value) || 0);
  function timerHtml(prefix) { return '<div class="timer" data-timer="' + prefix + '"><b>00:00:00</b><button type="button" class="btn sm" data-act="timer">' + ico('play') + ' จับเวลาสายนี้</button><span class="small muted">หรือกรอกเวลาเอง</span></div>'; }
  function localInput(iso) { const d = new Date(Date.parse(iso) + H.TZ); return d.toISOString().slice(0, 16); }
  const fromLocal = (v) => v ? new Date(Date.parse(v + ':00Z') - H.TZ).toISOString() : '';
  function plusDays(n, hh) { const d = H.addDays(H.today(), n); return d + 'T' + (hh || '10:00'); }

  // ------------------------------------------------------------ list standard
  // Search, dropdowns, paging (10/20/50/100), checkboxes with bulk actions, date range.
  // Same look and behaviour on every list in the hub.
  const PER_OPTS = [10, 20, 50, 100];
  ui.lists = ui.lists || {};
  ui.dr = ui.dr || {};
  ui.cStatus = ui.cStatus || [];
  const SEL = {}, LVITEMS = {}, LVID = {}, LVB = {};
  if (!ui.per10) { for (const k in (ui.lists || {})) ui.lists[k].per = 10; ui.per10 = 1; }
  const ls = (key) => ui.lists[key] || (ui.lists[key] = { page: 1, per: 10 });
  const sel = (key) => SEL[key] || (SEL[key] = { ids: new Set(), all: false });
  function resetList(key) { ls(key).page = 1; SEL[key] = { ids: new Set(), all: false }; }
  function refreshList(key) { const el = document.getElementById('lv-' + key); if (el && LVB[key]) { el.innerHTML = LVB[key](); remember(); } else render(); }
  function selectedOf(key) { const s = sel(key), items = LVITEMS[key] || []; return s.all ? items.slice() : items.filter((i) => s.ids.has(LVID[key](i))); }
  function pageNums(cur, total) {
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
    let a = Math.max(2, cur - 1), b = Math.min(total - 1, cur + 1);
    if (cur <= 3) { a = 2; b = 4; }
    if (cur >= total - 2) { a = total - 3; b = total - 1; }
    const out = [1]; if (a > 2) out.push('…');
    for (let i = a; i <= b; i++) out.push(i);
    if (b < total - 1) out.push('…'); out.push(total);
    return out;
  }
  // cfg: { key, items, id, head:[{h,cls}], row(it)->[td...], click(it)->customerId, actions:[{act,label,icon,danger}], rowDelete(it)->bool, rowDeleteAct, empty }
  function listView(cfg) {
    LVITEMS[cfg.key] = cfg.items; LVID[cfg.key] = cfg.id;
    const st = ls(cfg.key), s = sel(cfg.key), n = cfg.items.length;
    if (!n) return cfg.empty;
    if (!PER_OPTS.includes(st.per)) st.per = 10;
    const pages = Math.max(1, Math.ceil(n / st.per)); if (st.page > pages) st.page = pages; if (st.page < 1) st.page = 1;
    const from = (st.page - 1) * st.per, slice = cfg.items.slice(from, from + st.per);
    const selectable = !!((cfg.actions && cfg.actions.length) || cfg.xl);
    if (cfg.xl) XL['lv:' + cfg.key] = { name: cfg.xl.name, cols: cfg.xl.cols };
    const ids = slice.map(cfg.id);
    const isOn = (id) => s.all || s.ids.has(id);
    const pageAll = selectable && ids.length > 0 && ids.every(isOn);
    const count = s.all ? n : s.ids.size;
    const K = ' data-key="' + cfg.key + '"';
    let bar = cfg.xl ? '<div class="xbar">' + (n > 1 ? '<label class="xall"><input type="checkbox" data-act="ls-lvall"' + K + (s.all || (count && count === n) ? ' checked' : '') + '> เลือกทั้งหมด ' + N(n) + ' ' + (cfg.unit || 'รายการ') + '</label>' : '') +
      (count ? '<span class="xcnt">เลือกแล้ว ' + N(count) + '</span>' : '<span class="small faint hide-sm">ติ๊กเลือกทีละรายการได้</span>') + '<span class="grow"></span><button class="btn sm" data-act="lv-xlsx"' + K + '>' + ico('download') + ' ส่งออก Excel ' + (count ? '(' + N(count) + ' ที่เลือก)' : '(ทั้งหมด)') + '</button></div>' : '';
    if (selectable && count && cfg.actions && cfg.actions.length) {
      bar += '<div class="selbar"><b>เลือกแล้ว ' + N(count) + ' รายการ</b>' +
        (pageAll && !s.all && n > ids.length ? '<button class="link" data-act="ls-selall"' + K + '>เลือกทั้งหมด ' + N(n) + ' รายการ</button>' : '') +
        '<span class="grow"></span>' + cfg.actions.map((a) => '<button class="btn sm' + (a.danger ? ' danger' : '') + '" data-act="' + a.act + '"' + K + '>' + (a.icon ? ico(a.icon) : '') + ' ' + a.label + '</button>').join('') +
        '<button class="btn sm" data-act="ls-clear"' + K + '>ยกเลิกการเลือก</button></div>';
    }
    const th = (selectable ? '<th class="ck"><input type="checkbox" data-act="ls-pageall"' + K + ' aria-label="เลือกทั้งหมดในหน้านี้"' + (pageAll ? ' checked' : '') + '></th>' : '') +
      (cfg.head || []).map((h) => '<th class="' + (h.cls || '') + '">' + h.h + '</th>').join('') + (cfg.rowDelete ? '<th class="n"><span class="sr">ลบ</span></th>' : '');
    const rows = cfg.rows ? '' : slice.map((it) => {
      const id = cfg.id(it), on = isOn(id), cid = cfg.click ? cfg.click(it) : '';
      return '<tr class="' + (cid ? 'click ' : '') + (on ? 'sel' : '') + '"' + (cid ? ' data-open="' + esc(cid) + '"' : '') + '>' +
        (selectable ? '<td class="ck"><input type="checkbox" data-act="ls-check"' + K + ' data-id="' + esc(id) + '"' + (on ? ' checked' : '') + ' aria-label="เลือกรายการ"></td>' : '') +
        cfg.row(it).join('') +
        (cfg.rowDelete ? '<td class="n">' + (cfg.rowDelete(it) ? '<button class="x" data-act="' + cfg.rowDeleteAct + '"' + K + ' data-id="' + esc(id) + '" aria-label="ลบรายการนี้" title="ลบ">' + ico('x') + '</button>' : '') + '</td>' : '') + '</tr>';
    }).join('');
    const pager = n > 10 ? '<div class="pager"><span class="small muted">แสดง ' + N(from + 1) + ' - ' + N(Math.min(n, from + st.per)) + ' จาก ' + N(n) + ' ' + (cfg.unit || 'รายการ') + '</span><span class="grow"></span>' +
      ddBtn('per-' + cfg.key, { label: 'แสดง', options: PER_OPTS.map((p) => ({ v: String(p), l: p + ' รายการ / หน้า' })), value: String(st.per), onPick: (x) => { st.per = Number(x); st.page = 1; refreshList(cfg.key); } }) +
      (pages > 1 ? '<div class="pages"><button data-act="ls-page"' + K + ' data-v="' + (st.page - 1) + '"' + (st.page <= 1 ? ' disabled' : '') + ' aria-label="หน้าก่อน">‹</button>' +
        pageNums(st.page, pages).map((p) => p === '…' ? '<span>…</span>' : '<button class="' + (p === st.page ? 'on' : '') + '" data-act="ls-page"' + K + ' data-v="' + p + '"' + (p === st.page ? ' aria-current="page"' : '') + '>' + p + '</button>').join('') +
        '<button data-act="ls-page"' + K + ' data-v="' + (st.page + 1) + '"' + (st.page >= pages ? ' disabled' : '') + ' aria-label="หน้าถัดไป">›</button></div>' : '') + '</div>'
      : '<div class="small faint" style="margin-top:10px">ทั้งหมด ' + N(n) + ' รายการ</div>';
    if (cfg.rows) {
      const cards = slice.map((it) => { const id = cfg.id(it), on = isOn(id); return '<div class="arow' + (on ? ' sel' : '') + '">' + (selectable ? '<label class="ck"><input type="checkbox" data-act="ls-check"' + K + ' data-id="' + esc(id) + '"' + (on ? ' checked' : '') + ' aria-label="เลือกรายการ"></label>' : '') + cfg.card(it) + '</div>'; }).join('');
      const allBox = selectable && n > 1 ? '<label class="arow-all small muted"><input type="checkbox" data-act="ls-pageall"' + K + (pageAll ? ' checked' : '') + '> เลือกทั้งหมดในหน้านี้</label>' : '';
      return bar + allBox + '<div class="alist">' + cards + '</div>' + pager;
    }
    return bar + '<div class="tbl-wrap"><table class="tbl"><thead><tr>' + th + '</tr></thead><tbody>' + rows + '</tbody></table></div>' + pager;
  }
  function emptyState(msg, buttons) { return '<div class="empty"><div>' + msg + '</div>' + (buttons ? '<div class="row" style="justify-content:center;margin-top:10px">' + buttons + '</div>' : '') + '</div>'; }
  function searchBox(key, placeholder, value) {
    return '<div class="search"><span class="s-ico">' + ico('search') + '</span><input class="in" id="q-' + key + '" data-search="' + key + '" placeholder="' + esc(placeholder) + '" value="' + esc(value || '') + '" aria-label="' + esc(placeholder) + '" autocomplete="off">' +
      '<button class="s-x" data-act="search-clear" data-key="' + key + '" aria-label="ล้างคำค้น"' + (value ? '' : ' hidden') + '>' + ico('x') + '</button></div>';
  }
  // segmented control for 4 options or fewer
  function segF(label, act, opts, value) {
    return '<div class="seg-f"><span class="lbl">' + label + '</span><div class="seg sm">' + opts.map((o) => '<button class="' + (String(value) === String(o.v) ? 'on' : '') + '" data-act="' + act + '" data-v="' + esc(o.v) + '">' + esc(o.l) + '</button>').join('') + '</div></div>';
  }

  // ---- dropdown: plain (5-10), with search (>10), multi-select with checkboxes
  const DD = {};
  function ddBtn(key, cfg) {
    DD[key] = cfg;
    let txt;
    if (cfg.multi) {
      const vals = cfg.value || [], picked = cfg.options.filter((o) => vals.includes(o.v));
      txt = !picked.length ? cfg.label + ' : ทั้งหมด' : picked.length <= 2 ? cfg.label + ' : ' + picked.map((o) => o.l).join(', ') : cfg.label + ' (' + picked.length + ')';
    } else {
      const o = cfg.options.find((x) => String(x.v) === String(cfg.value)) || cfg.options[0];
      txt = cfg.label + ' : ' + o.l;
    }
    return '<button class="dd-btn' + ((cfg.multi ? (cfg.value || []).length : String(cfg.value) !== String(cfg.options[0].v)) ? ' set' : '') + '" data-act="dd-open" data-key="' + key + '" aria-haspopup="listbox"><span class="one">' + esc(txt) + '</span><span class="caret">▾</span></button>';
  }
  let pop = null;
  function openPop(btn, html, cls) {
    closePop();
    pop = document.createElement('div'); pop.className = 'pop-layer' + (innerWidth <= 640 ? ' sheet' : '');
    pop.innerHTML = '<div class="pop-backdrop"></div><div class="pop ' + (cls || '') + '" role="dialog">' + html + '</div>';
    document.body.appendChild(pop);
    const box = $('.pop', pop);
    if (innerWidth > 640) {
      const r = btn.getBoundingClientRect();
      let left = Math.max(12, Math.min(r.left, innerWidth - box.offsetWidth - 12));
      let top = r.bottom + 6;
      if (top + box.offsetHeight > innerHeight - 12) top = Math.max(12, r.top - box.offsetHeight - 6);
      box.style.left = left + 'px'; box.style.top = top + 'px';
    }
    $('.pop-backdrop', pop).addEventListener('click', closePop);
    pop.addEventListener('click', (e) => { const g = e.target.closest('[data-go]'); if (g) { e.preventDefault(); closePop(); go(g.dataset.go); } });
    pop._btn = btn;
    return box;
  }
  function closePop() { if (pop) { const b = pop._btn; pop.remove(); pop = null; if (b && b.isConnected) b.focus(); } }
  function openDropdown(btn) {
    const cfg = DD[btn.dataset.key]; if (!cfg) return;
    const temp = new Set(cfg.multi ? (cfg.value || []) : []);
    const many = cfg.options.length > 10;
    const box = openPop(btn, '<div class="pop-h">' + esc(cfg.label) + '</div>' + (many ? '<div class="search"><span class="s-ico">' + ico('search') + '</span><input class="in" placeholder="ค้นหาตัวเลือก" aria-label="ค้นหาตัวเลือก"></div>' : '') +
      '<div class="dd-list" role="listbox"' + (cfg.multi ? ' aria-multiselectable="true"' : '') + '>' + cfg.options.map((o) => '<button type="button" role="option" class="dd-opt" data-pv="' + esc(o.v) + '">' + (cfg.multi ? '<span class="ck-box"></span>' : '') + '<span class="one">' + esc(o.l) + '</span><span class="tick">✓</span></button>').join('') + '</div>' +
      (cfg.multi ? '<div class="dd-foot"><button type="button" class="btn sm" data-pv-act="clear">ล้าง</button><button type="button" class="btn primary sm" data-pv-act="ok">ตกลง</button></div>' : ''), 'dd-pop');
    const sync = () => $$('.dd-opt', box).forEach((b) => { const on = cfg.multi ? temp.has(b.dataset.pv) : b.dataset.pv === String(cfg.value); b.classList.toggle('on', on); b.setAttribute('aria-selected', on ? 'true' : 'false'); });
    sync();
    box.addEventListener('click', (e) => {
      const o = e.target.closest('.dd-opt');
      if (o) { if (cfg.multi) { temp.has(o.dataset.pv) ? temp.delete(o.dataset.pv) : temp.add(o.dataset.pv); sync(); } else { closePop(); cfg.onPick(o.dataset.pv); } return; }
      const a = e.target.closest('[data-pv-act]');
      if (a) { if (a.dataset.pvAct === 'clear') { temp.clear(); sync(); } else { closePop(); cfg.onPick([...temp]); } }
    });
    const s = $('.search input', box);
    if (s) s.addEventListener('input', () => { const q = s.value.trim().toLowerCase(); $$('.dd-opt', box).forEach((b) => { b.hidden = !!q && !b.textContent.toLowerCase().includes(q); }); });
    box.addEventListener('keydown', (e) => {
      const opts = $$('.dd-opt', box).filter((b) => !b.hidden); const i = opts.indexOf(document.activeElement);
      if (e.key === 'ArrowDown') { e.preventDefault(); (opts[i + 1] || opts[0]).focus(); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); (opts[i - 1] || opts[opts.length - 1]).focus(); }
    });
    (s || $('.dd-opt.on', box) || $('.dd-opt', box)).focus();
  }

  // ---- date range (same as Return & Refund): presets, day/week/month/custom, Monday-first, Thai time
  const DR_MODES = { today: 'วันนี้', '7d': '7 วันที่ผ่านมา', '28d': '28 วันที่ผ่านมา', all: 'ทั้งหมด', day: 'วัน', week: 'สัปดาห์', month: 'เดือน', custom: 'กำหนดเอง' };
  const DRCB = {};
  const drGet = (key, def) => ui.dr[key] || (ui.dr[key] = { mode: def || 'all' });
  function drRange(key) {
    const d = drGet(key), T = H.today();
    if (d.mode === 'today') return [T, T];
    if (d.mode === '7d') return [H.addDays(T, -6), T];
    if (d.mode === '28d') return [H.addDays(T, -27), T];
    if (d.mode === 'all' || !d.from) return [null, null];
    return [d.from, d.to];
  }
  const drFmt = (day) => { const [y, m, dd] = day.split('-').map(Number); return H.TH_MON[m - 1] + ' ' + dd + ', ' + y; };
  function drText(key, prefix) { const d = drGet(key), [f, t] = drRange(key); return prefix ? prefix + ' : ' + (f ? DR_MODES[d.mode] + ' (' + drFmt(f) + (f !== t ? ' - ' + drFmt(t) : '') + ')' : 'ทุกช่วงเวลา') : DR_MODES[d.mode] + ' : ' + (f ? drFmt(f) + ' - ' + drFmt(t) : 'ทุกช่วงเวลา'); }
  function drBtn(key, def, onChange, prefix) { drGet(key, def); DRCB[key] = onChange; return '<button class="dd-btn' + (drGet(key).mode !== 'all' ? ' set' : '') + '" data-act="dr-open" data-key="' + key + '">' + ico('calendar') + '<span class="one">' + esc(drText(key, prefix)) + '</span><span class="caret">▾</span></button>'; }
  function openDateRange(btn) {
    const key = btn.dataset.key, cur = drGet(key), T = H.today();
    let tab = ['day', 'week', 'month', 'custom'].includes(cur.mode) ? cur.mode : 'custom';
    let [rf, rt] = drRange(key);
    let view = (rt || T).slice(0, 7);
    let tempStart = null;
    const apply = (val) => { ui.dr[key] = val; closePop(); remember(); if (DRCB[key]) DRCB[key](); };
    const clip = (d) => (d > T ? T : d);
    const monStart = (d) => { const dow = (new Date(d + 'T00:00:00Z').getUTCDay() + 6) % 7; return H.addDays(d, -dow); };
    const lastOfMonth = (ym) => { const [y, m] = ym.split('-').map(Number); return new Date(Date.UTC(y, m, 0)).toISOString().slice(0, 10); };
    const box = openPop(btn, '<div class="dr"></div>', 'dr-pop');
    const host = $('.dr', box);
    const draw = () => {
      const [y, m] = view.split('-').map(Number);
      let grid = '';
      if (tab === 'month') {
        grid = '<div class="dr-months">' + H.TH_MON.map((mn, i) => { const ym = y + '-' + String(i + 1).padStart(2, '0'); const fut = ym + '-01' > T; const on = rf && rf.slice(0, 7) === ym && cur.mode === 'month'; return '<button type="button" class="' + (on ? 'edge' : '') + '" data-ym="' + ym + '"' + (fut ? ' disabled' : '') + '>' + mn + '</button>'; }).join('') + '</div>';
      } else {
        const first = view + '-01', start = monStart(first);
        grid = '<div class="dr-grid">' + ['จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.', 'อา.'].map((d) => '<span class="dow">' + d + '</span>').join('');
        for (let i = 0; i < 42; i++) {
          const d = H.addDays(start, i);
          if (i >= 35 && d.slice(0, 7) !== view) break;
          const a = tempStart || rf, b = tempStart ? null : rt;
          const cls = [d.slice(0, 7) !== view ? 'out' : '', d === T ? 'today' : '', (a && b && d > a && d < b) ? 'in' : '', (d === a || d === b) ? 'edge' : ''].join(' ');
          grid += '<button type="button" class="' + cls + '" data-day="' + d + '"' + (d > T ? ' disabled' : '') + '>' + Number(d.slice(8)) + '</button>';
        }
        grid += '</div>';
      }
      host.innerHTML = '<div class="dr-side">' + ['today', '7d', '28d', 'all'].map((k) => '<button type="button" class="' + (cur.mode === k ? 'on' : '') + '" data-preset="' + k + '">' + DR_MODES[k] + '</button>').join('') + '</div>' +
        '<div class="dr-main"><div class="seg sm dr-tabs">' + ['day', 'week', 'month', 'custom'].map((k) => '<button type="button" class="' + (tab === k ? 'on' : '') + '" data-tab="' + k + '">' + DR_MODES[k] + '</button>').join('') + '</div>' +
        '<div class="dr-nav"><button type="button" data-nav="-12" aria-label="ปีก่อน">«</button><button type="button" data-nav="-1" aria-label="เดือนก่อน">‹</button><b>' + (tab === 'month' ? y : H.TH_MON[m - 1] + ' ' + y) + '</b><button type="button" data-nav="1" aria-label="เดือนถัดไป">›</button><button type="button" data-nav="12" aria-label="ปีถัดไป">»</button></div>' +
        grid + '<div class="small muted dr-hint">' + (tab === 'custom' ? (tempStart ? 'เลือกวันสิ้นสุด' : 'เลือกวันเริ่ม แล้วเลือกวันสิ้นสุด') : tab === 'week' ? 'เลือกวันใดก็ได้ในสัปดาห์ (จันทร์ - อาทิตย์)' : tab === 'month' ? 'เลือกเดือน' : 'เลือกวัน') + ' : นับตามเวลาไทย</div></div>';
    };
    draw();
    host.addEventListener('mouseover', (e) => {
      if (tab !== 'custom' || !tempStart) return;
      const h = e.target.closest('[data-day]'); if (!h) return;
      const a = tempStart < h.dataset.day ? tempStart : h.dataset.day, b = tempStart < h.dataset.day ? h.dataset.day : tempStart;
      $$('[data-day]', host).forEach((x) => x.classList.toggle('in', x.dataset.day > a && x.dataset.day < b));
    });
    host.addEventListener('click', (e) => {
      const t = e.target.closest('button'); if (!t || t.disabled) return;
      if (t.dataset.preset) return apply({ mode: t.dataset.preset });
      if (t.dataset.tab) { tab = t.dataset.tab; tempStart = null; return draw(); }
      if (t.dataset.nav) { const n = Number(t.dataset.nav); let [yy, mm] = view.split('-').map(Number); mm += n; while (mm < 1) { mm += 12; yy--; } while (mm > 12) { mm -= 12; yy++; } view = yy + '-' + String(mm).padStart(2, '0'); return draw(); }
      if (t.dataset.ym) return apply({ mode: 'month', from: t.dataset.ym + '-01', to: clip(lastOfMonth(t.dataset.ym)) });
      const d = t.dataset.day; if (!d) return;
      if (tab === 'day') return apply({ mode: 'day', from: d, to: d });
      if (tab === 'week') { const s0 = monStart(d); return apply({ mode: 'week', from: s0, to: clip(H.addDays(s0, 6)) }); }
      if (!tempStart) { tempStart = d; return draw(); }
      const a = tempStart < d ? tempStart : d, b = tempStart < d ? d : tempStart;   // end before start → swap
      return apply({ mode: 'custom', from: a, to: b });
    });
  }

  // ---- confirm before delete, CSV export
  function confirmDelete(o) {
    openModal('<div class="row between" style="margin-bottom:6px"><h2 style="font-size:18px">' + esc(o.title) + '</h2><button class="icon-btn" data-act="close-modal" aria-label="ปิด">' + ico('x') + '</button></div>' +
      '<p style="margin:8px 0">ต้องการ' + esc(o.verb || 'ลบ') + ' <b>' + N(o.count) + ' รายการ</b> ใช่ไหม</p>' +
      (o.names && o.names.length ? '<div class="small muted">เช่น ' + o.names.slice(0, 3).map(esc).join(', ') + (o.count > 3 ? ' และอีก ' + N(o.count - 3) + ' รายการ' : '') + '</div>' : '') +
      (o.warn ? '<div class="warnbox">' + ico('alert') + '<span>' + esc(o.warn) + '</span></div>' : '') +
      '<div class="row" style="justify-content:flex-end;margin-top:18px"><button class="btn" data-act="close-modal">ยกเลิก</button><button class="btn danger-solid" id="confirm-ok">' + esc(o.okLabel || (o.verb || 'ลบ') + ' ' + N(o.count) + ' รายการ') + '</button></div>');
    $('#confirm-ok', modal).onclick = () => { closeModal(); o.onOk(); };
  }
  async function fileB64(file) { const bytes = new Uint8Array(await file.arrayBuffer()); let bin = ''; for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000)); return btoa(bin); }
  // ---------- Excel export: every list exports all rows, or only the rows ticked (one by one or "select all")
  let XLSXP = null;
  function loadXlsx() {
    if (window.XLSX) return Promise.resolve(window.XLSX);
    return XLSXP || (XLSXP = new Promise((ok, no) => { const sc = document.createElement('script'); sc.src = DEMO ? 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js' : '/vendor/xlsx.full.min.js'; sc.onload = () => ok(window.XLSX); sc.onerror = () => { XLSXP = null; no(new Error('load')); }; document.head.appendChild(sc); }));
  }
  // ASCII file names: some browsers drop non-Latin download names
  const XSLUG = [['ลูกค้า FB', 'customers-fb'], ['ลูกค้า E-Commerce', 'customers-ecommerce'], ['ลูกค้าซื้อซ้ำ', 'repeat-by-page'], ['นัดหมาย', 'appointments'], ['รายการโทร', 'calls'], ['ปิดการขาย', 'closes'], ['รายชื่อที่ถูกแจก', 'distributed-leads'], ['ยกเลิกการติดต่อ', 'do-not-contact'], ['รายการขายแอดมิน', 'admin-sales'], ['รายการขายเทเลเซลล์', 'telesales-sales'], ['ยกเลิกและตีกลับ แยกตามเพจ', 'cancel-return-by-page'], ['ยกเลิกและตีกลับ', 'cancel-return-by-admin'], ['สินค้าขายดี', 'top-products'], ['ยอดแอดมิน', 'admin-ranking'], ['KPI', 'kpi']];
  const xSlug = (name) => (XSLUG.find(([t]) => String(name).startsWith(t)) || [0, 'export'])[1];
  async function exportXlsx(name, header, rows) {
    try {
      const X = await loadXlsx();
      const ws = X.utils.aoa_to_sheet([header].concat(rows));
      ws['!cols'] = header.map((h, i) => ({ wch: Math.min(48, Math.max(String(h).length + 4, ...rows.slice(0, 300).map((r) => String(r[i] == null ? '' : r[i]).length + 2))) }));
      const wb = X.utils.book_new(); X.utils.book_append_sheet(wb, ws, String(name).slice(0, 30) || 'ข้อมูล');
      const buf = X.write(wb, { bookType: 'xlsx', type: 'array' });
      const el = document.createElement('a'); el.href = URL.createObjectURL(new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })); el.download = 'EvolutionHub-' + xSlug(name) + '-' + H.today() + '.xlsx';
      document.body.appendChild(el); el.click(); setTimeout(() => { URL.revokeObjectURL(el.href); el.remove(); }, 1500);
      toast('ส่งออก Excel ' + N(rows.length) + ' รายการแล้ว');
    } catch (_) { downloadCsv(name + ' ' + H.today() + '.csv', [header].concat(rows)); }
  }
  // lists that are not built with listView register here: XL[key] = { name, items, id, cols: [[header, fn]] }
  const XL = {}, XSEL = {};
  const xsel = (k) => XSEL[k] || (XSEL[k] = new Set());
  function xReg(key, name, items, id, cols) { XL[key] = { name, items, id, cols }; const ids = new Set(items.map((x) => String(id(x)))); for (const v of [...xsel(key)]) if (!ids.has(v)) xsel(key).delete(v); }
  function xBar(key, unit) {
    const d = XL[key]; if (!d) return '';
    const n = d.items.length, k = xsel(key).size, all = n > 0 && k === n;
    return '<div class="xbar"><label class="xall"><input type="checkbox" data-act="ls-xall" data-k="' + key + '"' + (all ? ' checked' : '') + (n ? '' : ' disabled') + '> เลือกทั้งหมด ' + N(n) + ' ' + (unit || 'รายการ') + '</label>' +
      (k ? '<span class="xcnt">เลือกแล้ว ' + N(k) + '</span><button class="link-plain small" data-act="x-clear" data-k="' + key + '">ล้างที่เลือก</button>' : '<span class="small faint hide-sm">ติ๊กเลือกทีละรายการได้</span>') +
      '<span class="grow"></span><button class="btn sm" data-act="x-export" data-k="' + key + '"' + (n ? '' : ' disabled') + '>' + ico('download') + ' ส่งออก Excel ' + (k ? '(' + N(k) + ' ที่เลือก)' : '(ทั้งหมด)') + '</button></div>';
  }
  const xCk = (key, id) => '<input type="checkbox" class="xck" data-act="ls-xck" data-k="' + key + '" data-id="' + esc(String(id)) + '"' + (xsel(key).has(String(id)) ? ' checked' : '') + ' aria-label="เลือกรายการนี้">';
  function xRun(d, chosen) { const rows = chosen.map((it) => d.cols.map(([, f]) => { const v = f(it); return v == null ? '' : v; })); exportXlsx(d.name, d.cols.map(([h]) => h), rows); }
  function downloadCsv(name, rows) {
    const q = (x) => '"' + String(x == null ? '' : x).replace(/"/g, '""') + '"';
    try {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob(['﻿' + rows.map((r) => r.map(q).join(',')).join('\n')], { type: 'text/csv;charset=utf-8' }));
      a.download = name; document.body.appendChild(a); a.click(); a.remove();
      toast('ส่งออก ' + N(rows.length - 1) + ' รายการแล้ว');
    } catch (e) { toast('ส่งออกไฟล์จากหน้านี้ไม่ได้', true); }
  }

  // ------------------------------------------------------------ HOME
  function pageHome() {
    const v = V(), me = S.me, full = S.full || v;
    const team = (full.users || v.users).filter((u) => !u.disabled);
    const T = H.today();
    const anns = (v.announcements || []).slice(0, 3);
    let right = '';
    if (me.role === 'admin') {
      const mine = (v.approvals || []).filter((a) => H.dayKey(a.at) === T).slice(0, 4);
      right = card('cart', 'ปิดการขายวันนี้', 'Today\'s closes', mine.length ? '<div class="ann">' + mine.map((a) => '<div class="ev"><div class="datebox"><b>' + H.thTime(a.at).slice(0, 2) + '</b><small>' + H.thTime(a.at).slice(3) + ' น.</small></div><div><b>' + B(a.total) + '</b><div class="small muted">ส่งให้ ' + esc(uname(a.assigned || a.proposed)) + '</div></div>' + (a.status === 'pending' ? '<span class="pill warn">รออนุมัติ</span>' : '<span class="pill good">ส่งแล้ว</span>') + '</div>').join('') + '</div>' : '<div class="empty">ยังไม่มีการปิดการขายวันนี้</div>', '<button class="link" data-go="close">บันทึกปิดการขาย</button>');
    } else {
      const list = (v.appointments || []).filter((a) => !a.done && H.dayKey(a.at) <= T && (boss() || a.owner === me.id)).sort((a, b) => Date.parse(a.at) - Date.parse(b.at)).slice(0, 4);
      right = card('calendar', 'นัดโทรวันนี้', 'Upcoming calls', list.length ? '<div class="ann">' + list.map((a) => apptEv(a)).join('') + '</div>' : '<div class="empty">ไม่มีนัดค้างวันนี้</div>', allowed('calendar') ? '<button class="link" data-go="calendar">ดูปฏิทิน</button>' : '');
    }
    const dash = boss() ? H.dashboard(full, T, T) : null;
    const myK = me.role === 'tele' ? H.teleKpi(v, me.id, T, T) : null;
    const tk = dash ? dash.teamSum : null;
    const depts = [
      { id: 'overview', ico: 'brief', th: 'ผู้บริหาร', en: 'Executive', who: team.filter((u) => H.isBoss(u)), desc: 'ภาพรวมยอดขายทุกช่องทาง KPI ทีม Telesales และงานที่ต้องตัดสินใจ', stats: dash ? [[B(dash.total), 'ยอดขายวันนี้'], [N(dash.pending), 'รออนุมัติ']] : null },
      { id: 'customers', ico: 'headset', th: 'Telesales', en: 'Telesales', who: team.filter((u) => u.role === 'tele'), desc: 'รายชื่อ E-Commerce และ FB Page, Ticket ลูกค้า, ปฏิทินนัด และบันทึก KPI', stats: myK ? [[myK.fbCalls + myK.mktCalls + '/' + (myK.target.fb + myK.target.mkt), 'สายวันนี้'], [B(myK.amount), 'ยอดขาย']] : tk ? [[N(tk.calls), 'สายวันนี้ทั้งทีม'], [B(tk.amount), 'ยอดขาย Telesales']] : null },
      { id: 'close', ico: 'msg', th: 'Admin Sales', en: 'Admin Sales', who: team.filter((u) => u.role === 'admin'), desc: 'บันทึกการปิดการขายจาก FB Page ระบบแจกรายชื่อให้ Telesales 50:50 อัตโนมัติ', stats: v.adminBoard ? [[N((v.adminBoard.find((x) => x.user === me.id) || {}).closes || 0), 'ปิดได้วันนี้'], [B((v.adminBoard.find((x) => x.user === me.id) || {}).revenue || 0), 'ยอดวันนี้']] : dash ? [[N(dash.cnt.admin), 'ออเดอร์วันนี้'], [B(dash.rev.admin), 'ยอดแอดมิน']] : null },
    ];
    return '<section class="banner"><div class="grow"><h1>ยินดีต้อนรับสู่ Evolution Hub Commerce</h1><p>' + esc(me.name) + ' : ' + H.thDate(T) + ' : เลือกฝ่ายงานด้านล่างเพื่อเริ่มทำงาน</p></div><div class="stack">' + team.map((u) => av(u)).join('') + '</div></section>' +
      '<div class="grid g2">' + card('mega', 'ประกาศข่าวสาร', 'Announcements', anns.length ? '<div class="ann">' + anns.map((a) => '<div class="ann-item"><div><b>' + esc(a.title) + '</b>' + (a.body ? '<div class="small muted">' + esc(a.body) + '</div>' : '') + '<small>' + H.thDate(a.at, true) + ' : ' + esc(uname(a.by)) + '</small></div></div>').join('') + '</div>' : '<div class="empty">ยังไม่มีประกาศ</div>', boss() ? '<button class="link" data-go="settings">จัดการประกาศ</button>' : '') + right + '</div>' +
      '<div class="grid g3">' + depts.map((d) => {
        const ok = allowed(d.id);
        return '<button class="card dept ' + (ok ? '' : 'locked') + '" data-go="' + d.id + '"' + (ok ? '' : ' aria-disabled="true"') + '>' + (ok ? '' : '<span class="lock">' + ico('lock') + ' ไม่มีสิทธิ์</span>') +
          '<div class="top"><span class="card-ico">' + ico(d.ico) + '</span><div><h3>' + d.th + '</h3><div class="en">' + d.en + '</div></div></div><p>' + d.desc + '</p>' +
          '<div class="row"><div class="stack">' + d.who.map((u) => av(u, 'sm')).join('') + '</div><span class="small muted">' + d.who.map((u) => esc(u.name)).join(', ') + '</span></div>' +
          (d.stats && ok ? '<div class="stat">' + d.stats.map((s) => '<div><b>' + s[0] + '</b><small>' + s[1] + '</small></div>').join('') + '</div>' : '') + '</button>';
      }).join('') + '</div>';
  }
  function apptEv(a) {
    const c = H.findCustomer(S.full || V(), a.customerId) || {};
    const late = Date.parse(a.at) < Date.now() - 3600000;
    return '<div class="ev"><div class="datebox ' + (late ? 'late' : '') + '"><b>' + H.thTime(a.at).slice(0, 2) + '</b><small>' + H.thTime(a.at).slice(3) + ' น.</small></div><div style="min-width:0"><b class="link" data-open="' + esc(c.id || '') + '">' + esc(c.name || 'ลูกค้า') + '</b><div class="small muted">' + esc(a.purpose) + (boss() ? ' : ' + esc(uname(a.owner)) : '') + (late ? ' : <span style="color:var(--bad)">เลยนัด ' + H.thDate(a.at) + '</span>' : '') + '</div></div>' + roundTag(a.round) + '</div>';
  }
  function card(icon, title, sub, body, foot, extra) {
    return '<section class="card"' + (extra || '') + '><div class="card-h"><span class="card-ico">' + ico(icon) + '</span><div class="ttl"><h2>' + title + '</h2><small>' + sub + '</small></div></div>' + body + (foot ? '<div class="row" style="justify-content:flex-end;margin-top:12px">' + foot + '</div>' : '') + '</section>';
  }

  // ------------------------------------------------------------ OVERVIEW (executive)
  function pageOverview(mode) {
    const st = S.full || V();
    const ovd = drGet('ov', 'today');
    let [from, to] = drRange('ov');
    if (!from) { from = H.today(); for (const k of (st.kpi || [])) if (k.date < from) from = k.date; for (const c of st.customers || []) { const d = H.dayKey(c.createdAt); if (d && d < from) from = d; } if (H.daysBetween(from, H.today()) > 365) from = H.addDays(H.today(), -365); to = H.today(); }
    const label = ovd.mode === 'today' ? 'วันนี้' : DR_MODES[ovd.mode];
    TIPCTX.ov = [from, to];
    const d = dashFor(from, to); if (!d) return '<div class="card"><div class="empty">กำลังโหลดภาพรวม…</div></div>';
    const t = st.settings.targets;
    const monthPct = pct(d.monthRev, d.monthTarget);
    const head = '<div class="row between"><div><h2 style="font-size:20px">' + (mode === 'tele' ? 'ภาพรวมเทเลเซลล์' : mode === 'admin' ? 'ภาพรวมแอดมิน' : 'ภาพรวมทั้งหมด') + ' : ' + label + '</h2><div class="small muted">' + (from === to ? H.thDate(from) : H.thDate(from) + ' - ' + H.thDate(to)) + ' : ยอด Telesales มาจากบันทึก KPI : ยอดแอดมินมาจาก Pancake/บันทึกปิดการขาย : E-Commerce จาก BigSeller</div></div>' +
      '<div class="row">' + drBtn('ov', 'today', render) +
      '<button class="btn sm" data-act="refresh">' + ico('refresh') + ' รีเฟรช</button></div></div>';
    const tiles = '<div class="tiles">' +
      tile('ยอดขายรวม', B(d.total), 'เดือนนี้ ' + B(d.monthRev) + ' : ' + monthPct + '% ของเป้า ' + B(d.monthTarget), 'hero', monthPct) +
      tile('<i style="background:var(--c-tele)"></i>Telesales', B(d.rev.tele), N(d.cnt.tele) + ' ออเดอร์ : ' + N(d.teamSum.calls) + ' สาย') +
      tile('<i style="background:var(--c-admin)"></i>Admin (FB Page)', B(d.rev.admin), N(d.cnt.admin) + ' ออเดอร์ที่แอดมินปิด') +
      tile('<i style="background:var(--c-ecom)"></i>E-Commerce', B(d.rev.ecom), N(d.cnt.ecom) + ' ออเดอร์ Lazada / Shopee / TikTok') +
      tile('ออเดอร์ทั้งหมด', N(d.orders), 'เฉลี่ย ' + B(d.aov) + ' ต่อออเดอร์') +
      tile('งานที่ต้องจัดการ', N(d.pending + d.overdue), 'เลยนัด ' + d.overdue + ' : เงียบเกินกำหนด ' + d.stale, d.pending + d.overdue ? 'alert' : '') + '</div>';
    const teamCard = '<section class="card"><div class="card-h"><span class="card-ico">' + ico('headset') + '</span><div class="ttl"><h2>KPI Telesales : ' + label + '</h2><small>เป้าต่อคนต่อวัน : FB ' + t.fbCalls + ' สาย (T1 ' + t.t1 + ' : T2 ' + t.t2 + ' : T3 ' + t.t3 + ') : Marketplace ' + t.mktCalls + ' สาย : คุย ' + t.talkMinutes + ' นาที : ยอด ' + B(t.teleRevenue) + (from !== to ? ' : คูณตามจำนวนวันอัตโนมัติ' : '') + '</small></div>' +
      (allowed('kpi') ? '<button class="btn sm" data-go="kpi">' + ico('clip') + ' ดูรายการที่บันทึก</button>' : '') + '</div>' + kpiTable(d.team) + '</section>';
    // daily chart: at least 14 days for context
    const cFrom = H.daysBetween(from, to) < 13 ? H.addDays(to, -13) : from;
    const cd = cFrom === from ? d : (dashFor(cFrom, to) || d);
    const lineVal = (x) => ui.chart === 'rev' ? x.tele + x.admin : x.calls;
    const lineSum = cd.days.reduce((t, k) => t + lineVal(cd.series[k]), 0);
    const cmp = ui.chart === 'cmp';
    const chartCard = '<section class="card"><div class="card-h"><span class="card-ico">' + ico('chart') + '</span><div class="ttl"><h2>' + (cmp ? 'เทียบยอดขายตามวันในสัปดาห์' : ui.chart === 'rev' ? 'ยอดขายรายวัน' : 'จำนวนสายรายวัน') + '</h2><small>' + H.thDate(cFrom) + ' - ' + H.thDate(to) + (cmp ? ' : Telesales เทียบ Admin' : ' : ชี้บนกราฟเพื่อดูค่ารายวัน') + '</small></div>' +
      (cmp ? '<div class="legend gb-legend"><span><i style="background:var(--c-tele)"></i>Telesales</span><span><i style="background:var(--c-admin)"></i>Admin</span></div>' : '<b class="lc-total">' + (ui.chart === 'rev' ? B(lineSum) : N(lineSum) + ' สาย') + '</b>') +
      '<div class="seg"><button class="' + (ui.chart === 'rev' ? 'on' : '') + '" data-act="chart" data-v="rev">ยอดขาย</button><button class="' + (cmp ? 'on' : '') + '" data-act="chart" data-v="cmp">เทียบทีม</button><button class="' + (ui.chart === 'calls' ? 'on' : '') + '" data-act="chart" data-v="calls">จำนวนสาย</button></div></div>' +
      '<div class="chart-wrap">' + (cmp ? weekdayBars(cd) : lineChart(cd)) + '</div></section>';
    const adminMax = Math.max(1, ...d.admins.map((a) => a.revenue));
    const adminCard = card('msg', 'ทีม Admin Sales', 'ยอดปิดการขาย FB Page : เรียงตามยอดเงิน', d.admins.length ? (() => { const [rows, pager, off] = pg10('adm', d.admins, 'คน'); xReg('adm', 'ยอดแอดมิน', d.admins, (a) => a.name, [['แอดมิน', (a) => a.name], ['ยอดขาย', (a) => a.revenue], ['ออเดอร์', (a) => a.closes]]); return xBar('adm', 'คน') + '<div class="rank">' + rows.map((a, i) => '<div class="rank-row" data-tip="adm" data-tip-k="' + esc(a.name) + '"><span class="no">' + (off + i + 1) + '</span><span class="ellip">' + xCk('adm', a.name) + ' ' + esc(a.name) + '</span><span class="bar"><i style="width:' + pct(a.revenue, adminMax) + '%"></i></span><span class="v">' + B(a.revenue) + ' <small>: ' + a.closes + ' ออเดอร์</small></span></div>').join('') + '</div>' + pager; })() : '<div class="empty">ยังไม่มีการปิดการขายในช่วงนี้</div>');
    const prodCard = card('bag', 'สินค้าขายดี', 'จัดอันดับตามยอดเงิน : ทุกช่องทาง', d.products.length ? (() => { const [rows, pager] = pg10('prod', d.products, 'สินค้า'); xReg('prod', 'สินค้าขายดี', d.products, (p) => p.name, [['สินค้า', (p) => p.name], ['ชิ้น', (p) => p.qty], ['Telesales', (p) => p.tele], ['Admin', (p) => p.admin], ['E-Commerce', (p) => p.ecom], ['ยอดขาย', (p) => p.revenue]]); return xBar('prod', 'สินค้า') + '<div class="tbl-wrap"><table class="tbl"><thead><tr><th class="ck"></th><th>สินค้า</th><th class="n">ชิ้น</th><th class="n hide-sm">Tele / Admin / Ecom</th><th class="n">ยอดขาย</th></tr></thead><tbody>' + rows.map((p) => '<tr><td class="ck">' + xCk('prod', p.name) + '</td><td><div class="ellip">' + esc(p.name) + '</div></td><td class="n">' + N(p.qty) + '</td><td class="n hide-sm muted">' + p.tele + ' / ' + p.admin + ' / ' + p.ecom + '</td><td class="n"><b>' + B(p.revenue) + '</b></td></tr>').join('') + '</tbody></table></div>' + pager; })() : '<div class="empty">ยังไม่มีข้อมูลสินค้าในช่วงนี้</div>');
    const f = d.funnel, fMax = Math.max(1, f.called, f.leads);
    const funnelCard = card('users', 'Funnel การโทร', 'รายชื่อที่ได้รับ → โทร → ได้คุย → ปิดได้', '<div class="funnel">' +
      [['รายชื่อเข้าใหม่', f.leads], ['โทรแล้ว', f.called], ['ได้คุย', f.talked], ['ปิดการขาย', f.won]].map(([l, v]) => '<div class="funnel-row"><span>' + l + '</span><span class="bar"><i style="width:' + Math.max(2, pct(v, fMax)) + '%"></i></span><span class="v">' + N(v) + '</span></div>').join('') +
      '</div><div class="row small muted" style="margin-top:12px;gap:16px"><span>อัตราติดต่อได้ <b style="color:var(--text)">' + pctTxt(d.contactRate) + '</b></span><span>อัตราปิดการขาย <b style="color:var(--text)">' + pctTxt(d.conversion) + '</b></span><span>ยอดต่อสายที่ได้คุย <b style="color:var(--text)">' + B(d.teamSum.talked ? d.teamSum.amount / d.teamSum.talked : 0) + '</b></span></div>');
    const hrs = d.hours.slice(8, 22), hMax = Math.max(1, ...hrs.map((h) => h.calls + h.orders));
    const heatCard = card('clock', 'ช่วงเวลาโทรและขาย', 'จำนวนสาย + ออเดอร์ต่อชั่วโมง (08:00-21:00)', '<div class="heat">' + hrs.map((h, i) => { const v = h.calls + h.orders; return '<div title="' + (i + 8) + ':00 น. : ' + h.calls + ' สาย : ' + h.orders + ' ออเดอร์" style="opacity:' + (0.12 + 0.88 * v / hMax).toFixed(2) + ';color:' + (v / hMax > .5 ? '#fff' : 'var(--text)') + '">' + (v || '') + '</div>'; }).join('') + '</div><div class="heat-lbl">' + hrs.map((h, i) => '<span>' + (i + 8) + '</span>').join('') + '</div>' +
      '<div class="small muted" style="margin-top:10px">ช่วงที่คึกคักที่สุด : <b style="color:var(--text)">' + (hrs.reduce((b, h, i) => (h.calls + h.orders > b.v ? { v: h.calls + h.orders, i } : b), { v: -1, i: 0 }).i + 8) + ':00 น.</b></div>');
    const alerts = '<div class="alerts">' +
      alertRow('bad', d.overdue, 'นัดโทรที่เลยกำหนด', 'ลูกค้าที่นัดไว้แต่ยังไม่ได้โทร', 'calendar') +
      alertRow('warn', d.stale, 'ลูกค้าเงียบเกินกำหนด', 'FB เกิน ' + st.settings.staleDays.fb + ' วัน : Marketplace เกิน ' + st.settings.staleDays.ecom + ' วัน ไม่มีความเคลื่อนไหว', 'customers', 'due') +
      alertRow('info', d.todayAppts - d.todayApptsDone, 'นัดที่เหลือของวันนี้', 'ทำแล้ว ' + d.todayApptsDone + ' จาก ' + d.todayAppts + ' นัด', 'calendar') + '</div>';
    const lr = Object.entries(d.lostReasons).sort((a, b) => b[1] - a[1]);
    const pf = Object.entries(d.platform).sort((a, b) => b[1] - a[1]), pfMax = Math.max(1, ...pf.map((x) => x[1]));
    const sideCard = card('alert', 'ต้องติดตาม', 'กดเพื่อไปยังรายการ', alerts +
      platCustHtml(st, from, to) + '<div class="section-t" style="margin-top:16px">ยอดขาย E-Commerce แยกแพลตฟอร์ม</div>' + (pf.length ? '<div class="rank" style="margin-top:8px">' + pf.map(([k, v], i) => '<div class="rank-row"><span class="no">' + (i + 1) + '</span><span>' + esc(k) + '</span><span class="bar"><i style="width:' + pct(v, pfMax) + '%;background:var(--c-ecom)"></i></span><span class="v">' + B(v) + '</span></div>').join('') + '</div>' : '<div class="small faint" style="margin-top:6px">ไม่มีออเดอร์ในช่วงนี้</div>') +
      '<div class="section-t" style="margin-top:16px">เหตุผลที่ลูกค้าปฏิเสธ</div>' + (lr.length ? '<div class="chips" style="margin-top:8px">' + lr.map(([k, v]) => '<span class="pill mute">' + esc(k) + ' ' + v + '</span>').join('') + '</div>' : '<div class="small faint" style="margin-top:6px">ไม่มีรายการ</div>'));
    const foot = '<div class="small faint">ข้อมูลล่าสุด ' + H.thDate(new Date().toISOString(), true) + '</div>';
    const two = d.rev.tele + d.rev.admin, twoN = d.cnt.tele + d.cnt.admin;
    if (mode === 'tele') {
      const tt = '<div class="tiles">' + tile('<i style="background:var(--c-tele)"></i>ยอดขาย Telesales', B(d.rev.tele), N(d.cnt.tele) + ' ออเดอร์จากการโทร', 'hero') +
        tile('จำนวนสาย', N(d.teamSum.calls), 'ได้คุย ' + N(d.teamSum.talked) + ' สาย') + tile('อัตราติดต่อได้', pctTxt(d.contactRate), 'จากสายทั้งหมด') + tile('อัตราปิดการขาย', pctTxt(d.conversion), 'จากสายที่ได้คุย') +
        tile('เฉลี่ยต่อออเดอร์', B(d.cnt.tele ? d.rev.tele / d.cnt.tele : 0), 'ยอด Telesales') + tile('นัดที่เลยกำหนด', N(d.overdue), 'เงียบเกินกำหนด ' + d.stale, d.overdue ? 'alert' : '') + '</div>';
      return head + tt + teamCard + '<div class="grid g3">' + funnelCard + heatCard + card('alert', 'ต้องติดตาม', 'งานค้างของทีม Telesales', alerts) + '</div>' + teleSales(st, from, to, label) + foot;
    }
    if (mode === 'admin') {
      const dist = fullView() ? (st.approvals || []).filter((a) => a.status === 'approved' && H.dayKey(a.decidedAt || a.at) >= from && H.dayKey(a.decidedAt || a.at) <= to).length : (DASH[from + '|' + to] || {}).dist || 0;
      const at = '<div class="tiles">' + tile('<i style="background:var(--c-admin)"></i>ยอดขาย Admin (FB Page)', B(d.rev.admin), N(d.cnt.admin) + ' ออเดอร์ที่แอดมินปิด', 'hero') +
        tile('เฉลี่ยต่อออเดอร์', B(d.cnt.admin ? d.rev.admin / d.cnt.admin : 0), 'ยอด Admin') + tile('รายชื่อที่แจกให้ Telesales', N(dist), 'แจกอัตโนมัติ 50:50') +
        tile('แอดมินที่มียอด', N(d.admins.filter((a) => a.revenue > 0).length), 'จาก ' + N(d.admins.length) + ' คน') + '</div>';
      const splitCard = card('send', 'สัดส่วนรายชื่อวันนี้', 'แจกให้ Telesales อัตโนมัติ 50:50', splitBar(todaySplit()), '<button class="btn sm" data-go="approvals">ดูรายชื่อที่ถูกแจก</button>');
      return head + at + '<div class="grid g-main">' + adminCard + '<div class="grid" style="align-content:start">' + splitCard + '</div></div>' + (fullView() ? qualityCard(st, from, to, label) + repeatPageCard(st) + adminSales(st, from, to, label) : '') + foot;
    }
    const ct = '<div class="tiles">' + tile('ยอดขายรวม (Telesales + Admin)', B(two), 'เดือนนี้ ' + B(d.monthRev) + ' : ' + monthPct + '% ของเป้า ' + B(d.monthTarget), 'hero', monthPct) +
      tile('<i style="background:var(--c-tele)"></i>Telesales', B(d.rev.tele), N(d.cnt.tele) + ' ออเดอร์ : ' + (two ? Math.round(d.rev.tele / two * 100) : 0) + '% ของยอดรวม') +
      tile('<i style="background:var(--c-admin)"></i>Admin (FB Page)', B(d.rev.admin), N(d.cnt.admin) + ' ออเดอร์ : ' + (two ? Math.round(d.rev.admin / two * 100) : 0) + '% ของยอดรวม') +
      tile('ออเดอร์ทั้งหมด', N(twoN), 'เฉลี่ย ' + B(twoN ? two / twoN : 0) + ' ต่อออเดอร์') + '</div>';
    const goCards = '<div class="grid g2"><button class="ov-go" data-go="ovtele"><span class="ov-go-i" style="background:var(--c-tele)">' + ico('phone') + '</span><span><b>เทเลเซลล์</b><small>' + B(d.rev.tele) + ' : ' + N(d.teamSum.calls) + ' สาย : KPI รายคน</small></span>' + ico('right') + '</button>' +
      '<button class="ov-go" data-go="ovadmin"><span class="ov-go-i" style="background:var(--c-admin)">' + ico('msg') + '</span><span><b>แอดมิน</b><small>' + B(d.rev.admin) + ' : ' + N(d.cnt.admin) + ' ออเดอร์ : อันดับแอดมิน</small></span>' + ico('right') + '</button></div>';
    const prods = d.products.slice(0, 5), prodRest = d.products.slice(5).reduce((t, x) => t + x.revenue, 0);
    const donutCard = '<div class="grid g2">' +
      card('chart', 'สัดส่วนยอดขายตามทีม', label + ' : Telesales เทียบ Admin', donut([{ l: 'Telesales', v: d.rev.tele, c: 'var(--c-tele)' }, { l: 'Admin (FB Page)', v: d.rev.admin, c: 'var(--c-admin)' }], B(two), 'ยอดรวม')) +
      card('bag', 'สัดส่วนยอดขายตามสินค้า', label + ' : 5 อันดับแรก ทุกช่องทาง', donut(prods.map((x, i) => ({ l: x.name.replace(/ \([^)]*\)$/, ''), v: x.revenue, c: DONUT_COL[i] })).concat(prodRest ? [{ l: 'อื่น ๆ', v: prodRest, c: '#cbd5e1' }] : []), N(d.products.length), 'รายการสินค้า')) + '</div>';
    return head + ct + goCards + donutCard + '<div class="grid g-main">' + chartCard + sideCard + '</div>' + prodCard + (fullView() ? '' : teleSales(st, from, to, label)) + foot;
  }
  // E-Commerce customers by marketplace: who brings the most customers (all time + new in range)
  const PLAT_COL = { shopee: '#ee4d2d', lazada: '#1a2dbd', tiktok: '#111827', evolution: '#94a3b8' };
  function platCustHtml(st, from, to) {
    const all = {}, nw = {};
    for (const c of st.customers || []) { if (c.channel !== 'ecom') continue; const k = c.platform || 'evolution'; all[k] = (all[k] || 0) + 1; const d = H.dayKey(c.createdAt); if (d >= from && d <= to) nw[k] = (nw[k] || 0) + 1; }
    const rows = PLAT_ORDER.filter((k) => all[k]).sort((x, y) => (x === 'evolution') - (y === 'evolution') || all[y] - all[x]), mx = Math.max(1, ...rows.map((k) => all[k]));
    if (!rows.length) return '';
    return '<div class="section-t" style="margin-top:16px">ลูกค้า E-Commerce แยกช่องทาง</div><div class="rank" style="margin-top:8px">' + rows.map((k, i) => '<div class="rank-row"><span class="no">' + (k === 'evolution' ? '-' : i + 1) + '</span><span>' + esc(H.PLATFORMS[k].label) + '</span><span class="bar"><i style="width:' + pct(all[k], mx) + '%;background:' + PLAT_COL[k] + '"></i></span><span class="v">' + N(all[k]) + ' ราย' + (nw[k] ? ' <small>: ใหม่ ' + N(nw[k]) + '</small>' : '') + '</span></div>').join('') + '</div>';
  }
  function tile(lbl, val, sub, cls, meter) {
    return '<div class="tile ' + (cls || '') + '"><span class="lbl">' + lbl + '</span><span class="val">' + val + '</span><span class="sub">' + sub + '</span>' + (meter != null ? '<div class="meter"><i style="width:' + Math.min(100, meter) + '%"></i></div>' : '') + '</div>';
  }
  function alertRow(tone, n, title, sub, page, filter) {
    return '<button class="alert-row ' + (n ? tone : '') + '" data-go="' + page + '"' + (filter ? ' data-filter="' + filter + '"' : '') + '><span class="n">' + N(n) + '</span><span class="t"><b>' + title + '</b><small>' + sub + '</small></span>' + ico('right') + '</button>';
  }
  const KSTAT = { done: ['good', 'ครบ KPI'], close: ['warn', 'ใกล้ครบ'], behind: ['bad', 'ยังไม่ถึงเป้า'], none: ['mute', 'ยังไม่บันทึก'] };
  // KPI as one simple table: rows = targets, columns = each telesales + team total
  function kpiTable(team) {
    if (!team.length) return '<div class="empty">ยังไม่มี Telesales</div>';
    const rows = [
      { l: 'E-Commerce', sub: 'Lazada · Shopee · TikTok', col: '#b45309', v: (r) => r.mktCalls, t: (r) => r.target.mkt },
      { l: 'T1 · โทรขาย', col: '#2563eb', v: (r) => r.t1, t: (r) => r.target.t1 },
      { l: 'T2 · ตามรอบ 2', col: '#0891b2', v: (r) => r.t2, t: (r) => r.target.t2 },
      { l: 'T3 · ตามรอบ 3', col: '#7c3aed', v: (r) => r.t3, t: (r) => r.target.t3 },
      { l: 'เวลาคุย', sub: 'นาที', col: '#475569', v: (r) => Math.round(r.talkSec / 60), t: (r) => Math.round(r.target.talkSec / 60) },
    ];
    const cell = (v, t, col) => { const p = pct(v, t), ok = t > 0 && v >= t, c2 = ok ? 'var(--good)' : col; return '<td' + (ok ? ' class="kt-ok"' : '') + '><div class="kt-c"><span><b>' + N(v) + '</b><small>/' + N(t) + '</small></span><em style="color:' + c2 + '">' + (ok ? '✓ ครบ' : p + '%') + '</em></div><div class="kt-bar"><i style="width:' + p + '%;background:' + c2 + '"></i></div></td>'; };
    xReg('kpi-team', 'KPI Telesales', team, (r) => r.user, [['Telesales', (r) => (user(r.user) || { name: r.name }).name], ['E-Commerce (สาย)', (r) => r.mktCalls], ['เป้า E-Commerce', (r) => r.target.mkt], ['T1', (r) => r.t1], ['เป้า T1', (r) => r.target.t1], ['T2', (r) => r.t2], ['เป้า T2', (r) => r.target.t2], ['T3', (r) => r.t3], ['เป้า T3', (r) => r.target.t3], ['เวลาคุย (นาที)', (r) => Math.round(r.talkSec / 60)], ['เป้าเวลาคุย (นาที)', (r) => Math.round(r.target.talkSec / 60)], ['ยอดขาย', (r) => r.amount], ['เป้ายอดขาย', (r) => r.target.revenue], ['ออเดอร์', (r) => r.orders], ['นัดเลยกำหนด', (r) => r.appts.overdue]]);
    const head = '<tr><th>รายการ</th>' + team.map((r) => { const u = user(r.user) || { name: r.name }; return '<th><label class="kt-pick">' + xCk('kpi-team', r.user) + ' ' + esc(u.name) + '</label></th>'; }).join('') + '<th class="n">รวมทีม</th></tr>';
    const body = rows.map((x) => '<tr><td class="kt-l"><b style="color:' + x.col + '">' + x.l + '</b>' + (x.sub ? '<small>' + x.sub + '</small>' : '') + '</td>' + team.map((r) => cell(x.v(r), x.t(r), x.col)).join('') + '<td class="n"><b>' + N(team.reduce((s, r) => s + x.v(r), 0)) + '</b></td></tr>').join('') +
      '<tr class="kt-sum"><td class="kt-l"><b style="color:var(--good)">ยอดขาย</b><small>จากการโทร</small></td>' + team.map((r) => '<td data-tip="tele" data-tip-k="' + esc(r.user) + '"><div class="kt-c"><span><b style="color:var(--good)">' + B(r.amount) + '</b><small>/' + B(r.target.revenue) + '</small></span><em class="muted">' + N(r.orders) + ' ปิด</em></div>' + (r.appts.overdue ? '<small class="kt-od">เลยนัด ' + N(r.appts.overdue) + '</small>' : '') + '</td>').join('') +
      '<td class="n"><b style="color:var(--good)">' + B(team.reduce((s, r) => s + r.amount, 0)) + '</b></td></tr>';
    return xBar('kpi-team', 'คน') + '<div class="tbl-wrap"><table class="kt">' + '<thead>' + head + '</thead><tbody>' + body + '</tbody></table></div><div class="small muted" style="margin-top:10px">เลข = สายที่ <b>ได้คุย</b> เท่านั้น (OneCall นับว่าได้คุยเมื่อคุยเกิน 7 วินาที) เทียบเป้าต่อวัน : สายที่ไม่ได้คุยไม่นับ</div>';
  }
  function kpiPerson(r) {
    const u = user(r.user) || { id: r.user, name: r.name };
    const s = KSTAT[r.status];
    const stat = (label, v, t, sub, fmt) => { const p = pct(v, t); return '<div class="kq"><span class="kq-l">' + label + '</span><span class="kq-v"><b>' + (fmt ? fmt(v) : N(v)) + '</b><small>/ ' + (fmt ? fmt(t) : N(t)) + '</small></span><div class="meter ' + meterCls(p) + '"><i style="width:' + p + '%"></i></div><span class="kq-s">' + sub + '</span></div>'; };
    return '<div class="kpc"><div class="kpc-h">' + av(u, 'lg') + '<div class="kpc-n"><b>' + esc(u.name) + '</b><small>ผ่าน ' + r.passed + ' จาก 4 เกณฑ์</small></div><span class="pill ' + s[0] + '">' + s[1] + '</span></div>' +
      '<div class="kpc-g">' +
      stat('โทร FB', r.fbCalls, r.target.fb, 'T1 ' + r.t1 + ' · T2 ' + r.t2 + ' · T3 ' + r.t3) +
      stat('โทร E-Commerce', r.mktCalls, r.target.mkt, 'Lazada · Shopee · TikTok') +
      stat('เวลาคุย', r.talkSec, r.target.talkSec, 'นาที', (x) => N(Math.round(x / 60))) +
      stat('ยอดขาย', r.amount, r.target.revenue, N(r.orders) + ' ออเดอร์', B) + '</div>' +
      '<div class="kpc-f"><span>ได้คุย <b>' + pctTxt(r.contactRate) + '</b></span><span>ปิดได้ <b>' + pctTxt(r.conversion) + '</b></span><span>นัดวันนี้ <b>' + r.appts.done + '/' + r.appts.due + '</b></span>' +
      (r.appts.overdue ? '<span class="bad">เลยนัด <b>' + N(r.appts.overdue) + '</b></span>' : '') + '</div></div>';
  }
  // ---- cancel / return rates by admin and by page (Pancake is the source of truth; the demo uses hub orders)
  const QR = {};
  function qualityRows(st, from, to) {
    if (DEMO) {
      const out = [];
      for (const a of st.approvals || []) { if (a.status === 'rejected') continue; const c = H.findCustomer(st, a.customerId) || {}, o = (c.orders || []).find((x) => x.id === a.orderId) || {}; const at = o.date || a.at, d = H.dayKey(at); if (d < from || d > to) continue;
        const sc = (o.ship || {}).code; out.push({ at, admin: a.closerName || uname(a.closer) || 'ไม่ระบุ', page: a.page || c.page || 'ไม่ระบุเพจ', kind: o.status === 'cancelled' || sc === 'cancel' ? 'cancel' : sc === 'back' ? 'back' : sc === 'done' ? 'done' : sc === 'ship' ? 'ship' : 'open', total: o.total != null ? o.total : a.total || 0 }); }
      return out;
    }
    const k = from + '|' + to, hit = QR[k];
    if (hit && (hit.rows || hit.error) && hit.at > Date.now() - 5 * 60000) return hit;
    if (!hit || !hit.loading) { QR[k] = { loading: true, at: 0 }; fetch('/api/report/quality?from=' + from + '&to=' + to, { credentials: 'same-origin' }).then((r) => r.json().then((j) => (r.ok ? { rows: j.rows } : { error: j.error || 'โหลดไม่สำเร็จ' }))).catch((e) => ({ error: e.message })).then((x) => { QR[k] = Object.assign(x, { at: Date.now() }); if (S.page === 'ovadmin') render(); }); }
    return hit && (hit.rows || hit.error) ? hit : null;
  }
  function qualityCard(st, from, to, label) {
    const r = qualityRows(st, from, to), rows = Array.isArray(r) ? r : r && r.rows;
    const headH = '<div class="card-h"><span class="card-ico">' + ico('alert') + '</span><div class="ttl"><h2>อัตรายกเลิกและตีกลับ</h2><small>' + label + ' : ออเดอร์จาก Pancake แยกตามแอดมินและเพจ</small></div>' +
      '<div class="seg"><button class="' + (ui.qBy !== 'page' ? 'on' : '') + '" data-act="q-by" data-v="admin">แยกตามแอดมิน</button><button class="' + (ui.qBy === 'page' ? 'on' : '') + '" data-act="q-by" data-v="page">แยกตามเพจ</button></div></div>';
    if (!rows) return '<section class="card q-card">' + headH + '<div class="empty">' + (r && r.error ? 'ดึงข้อมูลจาก Pancake ไม่ได้ : ' + esc(r.error) : 'กำลังดึงข้อมูลจาก Pancake…') + '</div></section>';
    const agg = (list) => { const a = { n: list.length, cancel: 0, back: 0, done: 0, ship: 0, lost: 0 }; for (const x of list) { if (x.kind in a) a[x.kind]++; if (x.kind === 'cancel' || x.kind === 'back') a.lost += x.total || 0; } a.sent = a.done + a.back + a.ship; a.cr = a.n ? a.cancel / a.n : 0; a.rr = a.sent ? a.back / a.sent : 0; return a; };
    const all = agg(rows), key = ui.qBy === 'page' ? 'page' : 'admin', groups = {};
    for (const x of rows) (groups[x[key]] = groups[x[key]] || []).push(x);
    const list = Object.entries(groups).map(([name, l]) => Object.assign({ name }, agg(l))).sort((a, b) => b.n - a.n);
    const P = (v) => (v * 100).toFixed(1) + '%';
    const warn = (v, base, n) => n >= 3 && v > 0 && v >= Math.max(base * 1.5, 0.05);
    const [pageRows, pager] = pg10('q-' + key, list, key === 'page' ? 'เพจ' : 'คน');
    xReg('q-' + key, 'ยกเลิกและตีกลับ แยกตาม' + (key === 'page' ? 'เพจ' : 'แอดมิน'), list, (g) => g.name, [[key === 'page' ? 'เพจ' : 'แอดมิน', (g) => g.name], ['ออเดอร์', (g) => g.n], ['ยกเลิก', (g) => g.cancel], ['% ยกเลิก', (g) => +(g.cr * 100).toFixed(1)], ['ตีกลับ', (g) => g.back], ['% ตีกลับ', (g) => +(g.rr * 100).toFixed(1)], ['ส่งสำเร็จ', (g) => g.done], ['มูลค่าที่เสียไป', (g) => g.lost]]);
    const cell = (cnt, rate, base, n) => '<td class="n"><div class="q-c' + (warn(rate, base, n) ? ' bad' : '') + '"><b>' + N(cnt) + '</b><span>' + P(rate) + '</span></div><div class="q-bar"><i style="width:' + Math.min(100, rate * 100 * 4) + '%"></i></div></td>';
    return '<section class="card q-card">' + headH +
      '<div class="as-sum"><div><small>ออเดอร์ทั้งหมด</small><b>' + N(all.n) + '</b></div><div><small>ยกเลิก</small><b class="' + (all.cancel ? 'q-bad' : 'q-ok') + '">' + N(all.cancel) + ' <em>' + P(all.cr) + '</em></b></div><div><small>ตีกลับ</small><b class="' + (all.back ? 'q-bad' : 'q-ok') + '">' + N(all.back) + ' <em>' + P(all.rr) + '</em></b></div><div><small>ส่งสำเร็จ</small><b>' + N(all.done) + '</b></div><div><small>มูลค่าที่เสียไป</small><b>' + B(all.lost) + '</b></div></div>' +
      (list.length ? xBar('q-' + key, key === 'page' ? 'เพจ' : 'คน') + '<div class="tbl-wrap"><table class="tbl q-tbl"><thead><tr><th class="ck"></th><th>' + (key === 'page' ? 'เพจ' : 'แอดมิน') + '</th><th class="n">ออเดอร์</th><th class="n">ยกเลิก</th><th class="n">ตีกลับ</th><th class="n hide-sm">ส่งสำเร็จ</th><th class="n hide-sm">มูลค่าที่เสียไป</th></tr></thead><tbody>' +
        pageRows.map((g) => '<tr><td class="ck">' + xCk('q-' + key, g.name) + '</td><td><b class="one">' + esc(g.name) + '</b></td><td class="n"><b>' + N(g.n) + '</b></td>' + cell(g.cancel, g.cr, all.cr, g.n) + cell(g.back, g.rr, all.rr, g.sent) + '<td class="n hide-sm">' + N(g.done) + '</td><td class="n hide-sm">' + (g.lost ? B(g.lost) : '<span class="faint">-</span>') + '</td></tr>').join('') + '</tbody></table></div>' + pager : '<div class="empty">ไม่มีออเดอร์ในช่วงนี้</div>') +
      '<div class="small muted" style="margin-top:10px">ยกเลิก = ออเดอร์ที่ถูกยกเลิก ÷ ออเดอร์ทั้งหมด : ตีกลับ = พัสดุตีกลับ ÷ พัสดุที่ส่งออกไปแล้ว : <b style="color:var(--bad)">สีแดง</b> = สูงกว่าค่าเฉลี่ยทั้งทีมชัดเจน</div></section>';
  }
  // which FB page brings customers who come back and buy again (any channel, including telesales re-sales)
  function repeatPageCard(st) {
    const g = {};
    for (const c of st.customers || []) {
      if (c.channel !== 'fb' || !c.page) continue;
      const os = (c.orders || []).filter((o) => o.status !== 'cancelled').sort((a, b) => Date.parse(a.date) - Date.parse(b.date));
      if (!os.length) continue;
      const x = g[c.page] = g[c.page] || { name: c.page, n: 0, rep: 0, rev: 0, tele: 0 };
      x.n++; if (os.length >= 2) { x.rep++; for (const o of os.slice(1)) { x.rev += o.total || 0; if (o.source === 'tele') x.tele++; } }
    }
    const list = Object.values(g).filter((x) => x.n >= 1).sort((a, b) => b.rep - a.rep || b.n - a.n);
    const best = list.filter((x) => x.n >= 10).sort((a, b) => b.rep / b.n - a.rep / a.n)[0];
    const [rows, pager, off] = pg10('rep-page', list, 'เพจ');
    xReg('rep', 'ลูกค้าซื้อซ้ำ แยกตามเพจ', list, (x) => x.name, [['เพจ', (x) => x.name], ['ลูกค้า', (x) => x.n], ['ซื้อซ้ำ', (x) => x.rep], ['% ซื้อซ้ำ', (x) => +(x.rep / x.n * 100).toFixed(1)], ['ยอดจากการซื้อซ้ำ', (x) => x.rev], ['ปิดซ้ำโดยเทเลเซลล์ (ออเดอร์)', (x) => x.tele]]);
    const mx = Math.max(0.0001, ...list.map((x) => x.rep / x.n));
    return '<section class="card"><div class="card-h"><span class="card-ico">' + ico('users') + '</span><div class="ttl"><h2>เพจที่ได้ลูกค้าซื้อซ้ำ</h2><small>ลูกค้าที่มาจากเพจนั้นแล้วกลับมาซื้ออีก (ทุกช่องทาง รวมที่เทเลเซลล์ขายต่อ) : นับตั้งแต่มีข้อมูล</small></div>' +
      (best ? '<span class="pill good">อัตราซื้อซ้ำสูงสุด : ' + esc(best.name.length > 28 ? best.name.slice(0, 28) + '…' : best.name) + ' ' + Math.round(best.rep / best.n * 100) + '%</span>' : '') + '</div>' +
      (list.length ? xBar('rep', 'เพจ') + '<div class="tbl-wrap"><table class="tbl q-tbl"><thead><tr><th class="ck"></th><th>#</th><th>เพจ</th><th class="n">ลูกค้า</th><th class="n">ซื้อซ้ำ</th><th>อัตราซื้อซ้ำ</th><th class="n hide-sm">ยอดจากการซื้อซ้ำ</th><th class="n hide-sm">ปิดซ้ำโดยเทเลเซลล์</th></tr></thead><tbody>' +
        rows.map((x, i) => { const rt = x.rep / x.n; return '<tr><td class="ck">' + xCk('rep', x.name) + '</td><td class="muted">' + (off + i + 1) + '</td><td><b class="one">' + esc(x.name) + '</b></td><td class="n">' + N(x.n) + '</td><td class="n"><b>' + N(x.rep) + '</b></td><td><div class="rp-r"><span class="bar"><i style="width:' + Math.round(rt / mx * 100) + '%"></i></span><b>' + (rt * 100).toFixed(1) + '%</b></div></td><td class="n hide-sm">' + B(x.rev) + '</td><td class="n hide-sm">' + N(x.tele) + ' ออเดอร์</td></tr>'; }).join('') + '</tbody></table></div>' + pager
        : '<div class="empty">ยังไม่มีข้อมูลเพจของลูกค้า</div>') + '</section>';
  }
  // ---- hover tooltips: point at a person's total to see which orders / products / prices make it up
  const TIPCTX = {};
  const tipItems = (items) => (items || []).map((i) => esc(String(i.name).replace(/\s*\([^)]*\)$/, '')) + ' ×' + (i.qty || 1)).join(', ') || '<span class="faint">ไม่ระบุสินค้า</span>';
  function tipList(title, rows, map) {
    const ok = rows.filter((r) => r.status !== 'cancelled'), sum = ok.reduce((t, r) => t + r.total, 0);
    if (!rows.length) return '<div class="htip-h"><b>' + esc(title) + '</b></div><div class="small muted">ไม่มีออเดอร์ในช่วงนี้</div>';
    return '<div class="htip-h"><b>' + esc(title) + '</b><span>' + N(ok.length) + ' ออเดอร์ : ' + B(sum) + '</span></div><div class="htip-l">' +
      rows.slice(0, 8).map((r) => { const m = map(r); return '<div class="htip-r"><span class="t">' + m.when + '</span><span class="c"><b>' + esc(m.who || 'ลูกค้า') + '</b><small>' + tipItems(r.items) + '</small></span><span class="v' + (r.status === 'cancelled' ? ' x' : '') + '">' + B(r.total) + '</span></div>'; }).join('') + '</div>' +
      (rows.length > 8 ? '<div class="htip-f">และอีก ' + N(rows.length - 8) + ' ออเดอร์ : ดูทั้งหมดในรายการขายด้านล่าง</div>' : '');
  }
  const TIP = {
    adm: (name) => { const [f, t] = TIPCTX.ov || [H.today(), H.today()]; const st = S.full || V(); if (!(st.approvals || []).length) return ''; const rows = adminSalesRows(st, f, t).filter((r) => r.closer === name); return tipList(name, rows, (r) => ({ when: (f === t ? '' : H.thDate(r.at).replace(/ \d{4}$/, '') + ' ') + H.thTime(r.at), who: r.c.name })); },
    tele: (uid) => { const [f, t] = TIPCTX.ov || [H.today(), H.today()]; const st = S.full || V(); if (!fullView() && uid !== S.me.id) return ''; const rows = teleSalesRows(st, f, t).filter((r) => r.k.user === uid); return tipList(uname(uid), rows, (r) => ({ when: (f === t ? '' : H.thDate(r.k.date).replace(/ \d{4}$/, '') + ' ') + (r.k.at ? H.thTime(r.k.at) : ''), who: r.name })); },
  };
  function tipShow(el) {
    const html = (TIP[el.dataset.tip] || (() => ''))(el.dataset.tipK); if (!html) return;
    let tp = document.getElementById('htip'); if (!tp) { tp = document.createElement('div'); tp.id = 'htip'; tp.className = 'htip'; document.body.appendChild(tp); }
    tp.innerHTML = html; tp.style.display = 'block';
    const r = el.getBoundingClientRect(), w = tp.offsetWidth, h = tp.offsetHeight;
    let x = Math.min(window.innerWidth - w - 12, Math.max(12, r.right - w)), y = r.bottom + 8; if (y + h > window.innerHeight - 8) y = Math.max(8, r.top - h - 8);
    tp.style.left = x + 'px'; tp.style.top = y + 'px';
  }
  const tipHide = () => { const tp = document.getElementById('htip'); if (tp) tp.style.display = 'none'; };
  document.addEventListener('mouseover', (e) => { const el = e.target.closest && e.target.closest('[data-tip]'); if (el) { if (el !== tipHide.cur) { tipHide.cur = el; tipShow(el); } } else if (tipHide.cur) { tipHide.cur = null; tipHide(); } });
  window.addEventListener('scroll', () => { tipHide.cur = null; tipHide(); }, true);
  // ---- detailed admin sales (Pancake + manual closes): one row per order
  function adminSalesRows(st, from, to) {
    const out = [];
    for (const a of st.approvals || []) {
      if (a.status === 'rejected') continue;
      const c = H.findCustomer(st, a.customerId) || {};
      const o = (c.orders || []).find((x) => x.id === a.orderId) || {};
      const at = o.date || a.at, d = H.dayKey(at);
      if (d < from || d > to) continue;
      out.push({ a, c, o, at, d, items: (o.items && o.items.length ? o.items : a.items) || [], total: o.total != null ? o.total : a.total || 0,
        status: o.status || 'paid', closer: a.closerName || uname(a.closer) || '-', page: a.page || c.page || '', ext: String(a.extId || o.extId || '').replace(/^pc:/, ''), to: a.assigned || a.proposed });
    }
    return out.sort((x, y) => Date.parse(y.at) - Date.parse(x.at));
  }
  function adminSales(st, from, to, label) {
    let rows = adminSalesRows(st, from, to);
    const admins = [...new Set(rows.map((r) => r.closer))].sort(), pagesL = [...new Set(rows.map((r) => r.page).filter(Boolean))].sort();
    if (ui.asAdmin && ui.asAdmin !== 'all') rows = rows.filter((r) => r.closer === ui.asAdmin);
    if (ui.asPg && ui.asPg !== 'all') rows = rows.filter((r) => r.page === ui.asPg);
    const q = (ui.asQ || '').trim().toLowerCase();
    if (q) rows = rows.filter((r) => [r.c.name, r.c.phone, r.ext, r.closer, r.page, r.items.map((i) => i.name).join(' ')].join(' ').toLowerCase().includes(q.replace(/[-\s]/g, '')) || (r.c.phone || '').includes(q.replace(/\D/g, '') || '###'));
    const ok = rows.filter((r) => r.status !== 'cancelled'), sum = ok.reduce((t, r) => t + r.total, 0), qty = ok.reduce((t, r) => t + r.items.reduce((u, i) => u + (i.qty || 0), 0), 0);
    const per = 10, pages = Math.max(1, Math.ceil(rows.length / per)), page = Math.min(Math.max(1, ui.asPage || 1), pages);
    xReg('as', 'รายการขายแอดมิน', rows, (r) => r.a.id, [['วันที่', (r) => H.thDate(r.at)], ['เวลา', (r) => H.thTime(r.at)], ['เลขออเดอร์', (r) => r.ext], ['ลูกค้า', (r) => r.c.name], ['เบอร์', (r) => H.fmtPhone(r.c.phone || '')], ['สินค้า', (r) => r.items.map((i) => i.name + ' x' + (i.qty || 1)).join(', ')], ['จำนวนชิ้น', (r) => r.items.reduce((u, i) => u + (i.qty || 0), 0)], ['ยอด', (r) => r.total], ['สถานะ', (r) => ({ paid: 'ชำระแล้ว', awaiting_payment: 'รอชำระ', cancelled: 'ยกเลิก' }[r.status] || r.status)], ['ปิดโดย', (r) => r.closer], ['เพจ', (r) => r.page], ['ส่งให้', (r) => uname(r.to)], ['ลูกค้าเก่า', (r) => (r.a.returning ? 'ใช่' : '')]]);
    const stt = { paid: ['good', 'ชำระแล้ว'], awaiting_payment: ['warn', 'รอชำระ'], cancelled: ['bad', 'ยกเลิก'] };
    const tr = (r) => { const s2 = stt[r.status] || stt.paid, tu = user(r.to);
      return '<tr><td class="ck">' + xCk('as', r.a.id) + '</td><td class="nowrap"><b>' + H.thDate(r.at).replace(/ \d{4}$/, '') + '</b><small class="muted">' + H.thTime(r.at) + ' น.</small></td>' +
        '<td><b class="link one" data-open="' + esc(r.c.id || '') + '">' + esc(r.c.name || 'ลูกค้าไม่ระบุชื่อ') + '</b><small class="muted">' + (r.c.phone ? H.fmtPhone(r.c.phone) : 'ไม่มีเบอร์') + (r.a.returning ? ' : <span class="pill info">ลูกค้าเก่า</span>' : '') + '</small></td>' +
        '<td>' + (r.items.length ? r.items.map((i) => '<div class="as-it"><span class="one">' + esc(String(i.name).replace(/\s*\([^)]*\)$/, '')) + '</span><b>×' + (i.qty || 1) + '</b>' + (i.price ? '<small class="muted">' + B(i.price) + '</small>' : '') + '</div>').join('') : '<span class="faint">ไม่ระบุสินค้า</span>') + '</td>' +
        '<td class="n"><b>' + B(r.total) + '</b><span class="pill ' + s2[0] + '">' + s2[1] + '</span></td>' +
        '<td><b class="one">' + esc(r.closer) + '</b><small class="muted one">' + esc(r.page || (r.a.source === 'pancake' ? 'Pancake' : 'บันทึกในระบบ')) + '</small></td>' +
        '<td class="hide-sm">' + (tu ? '<span class="who small"><span class="mini">' + esc(tu.initial || '') + '</span>' + esc(tu.name) + '</span>' : '<span class="faint">-</span>') + '<small class="muted">' + (r.ext ? '#' + esc(r.ext) : '') + '</small></td></tr>'; };
    const sel = (act, val, opts, all) => '<select class="in as-sel" data-act-change="' + act + '"><option value="all">' + all + '</option>' + opts.map((o) => '<option' + (o === val ? ' selected' : '') + '>' + esc(o) + '</option>').join('') + '</select>';
    return '<section class="card as-card"><div class="card-h"><span class="card-ico">' + ico('bag') + '</span><div class="ttl"><h2>รายการขายของแอดมิน</h2><small>' + label + ' : ออเดอร์จาก Pancake และที่บันทึกในระบบ ทีละรายการ</small></div></div>' +
      '<div class="as-sum"><div><small>ออเดอร์</small><b>' + N(ok.length) + '</b></div><div><small>ยอดขาย</small><b>' + B(sum) + '</b></div><div><small>เฉลี่ยต่อออเดอร์</small><b>' + B(ok.length ? sum / ok.length : 0) + '</b></div><div><small>จำนวนชิ้น</small><b>' + N(qty) + '</b></div><div><small>ลูกค้าเก่าซื้อซ้ำ</small><b>' + N(ok.filter((r) => r.a.returning).length) + '</b></div></div>' +
      '<div class="as-bar"><label class="search"><span class="s-ico">' + ico('search') + '</span><input class="in" placeholder="ค้นหาชื่อ เบอร์ สินค้า หรือเลขออเดอร์" value="' + esc(ui.asQ || '') + '" data-act-change="as-q" aria-label="ค้นหา"></label>' + sel('as-admin', ui.asAdmin, admins, 'แอดมินทุกคน') + sel('as-pg', ui.asPg, pagesL, 'ทุกเพจ') + '</div>' +
      (rows.length ? xBar('as', 'ออเดอร์') + '<div class="tbl-wrap"><table class="tbl as-tbl"><thead><tr><th class="ck"></th><th>วันที่ / เวลา</th><th>ลูกค้า</th><th>สินค้า × จำนวน</th><th class="n">ยอด</th><th>ปิดการขายโดย</th><th class="hide-sm">ส่งให้ Telesales</th></tr></thead><tbody>' + rows.slice((page - 1) * per, page * per).map(tr).join('') + '</tbody></table></div>' +
        pagerHtml('as-page', page, pages, rows.length, per)
        : '<div class="empty">ไม่มีรายการขายในช่วงนี้</div>') + '</section>';
  }
  // generic 10-per-page slice for any ranked list: returns [rows on this page, pager html, offset]
  function pg10(key, arr, unit) {
    const pages = Math.max(1, Math.ceil(arr.length / 10)), p = Math.min(Math.max(1, (ui.pg || {})[key] || 1), pages);
    return [arr.slice((p - 1) * 10, p * 10), arr.length > 10 ? pagerHtml('pg', p, pages, arr.length, 10, unit).replace(/data-act="pg"/g, 'data-act="pg" data-k="' + key + '"') : '', (p - 1) * 10];
  }
  function pagerHtml(act, page, pages, total, per, unit) {
    return '<div class="cp-pager"><small class="muted">' + ((page - 1) * per + 1) + '–' + Math.min(page * per, total) + ' จาก ' + N(total) + ' ' + (unit || 'ออเดอร์') + '</small>' + (pages > 1 ? '<div class="pages"><button data-act="' + act + '" data-v="' + (page - 1) + '"' + (page === 1 ? ' disabled' : '') + ' aria-label="ก่อนหน้า">‹</button>' + Array.from({ length: pages }, (_, i) => i + 1).filter((n) => pages <= 7 || n === 1 || n === pages || Math.abs(n - page) <= 1).map((n, i, a) => (i && n - a[i - 1] > 1 ? '<span class="faint">…</span>' : '') + '<button class="' + (n === page ? 'on' : '') + '" data-act="' + act + '" data-v="' + n + '">' + n + '</button>').join('') + '<button data-act="' + act + '" data-v="' + (page + 1) + '"' + (page === pages ? ' disabled' : '') + ' aria-label="ถัดไป">›</button></div>' : '') + '</div>';
  }
  // ---- detailed telesales sales (from logged calls): one row per sale
  function teleSalesRows(st, from, to) {
    const out = [];
    for (const k of st.kpi || []) {
      if (!(k.orders > 0 || k.amount > 0) || k.date < from || k.date > to) continue;
      const c = (k.customerId && H.findCustomer(st, k.customerId)) || {};
      const o = (k.orderId && (c.orders || []).find((x) => x.id === k.orderId)) || {};
      out.push({ k, c, at: k.at || k.date, name: c.name || k.name || '', phone: c.phone || k.phone || '', items: (o.items && o.items.length ? o.items : k.items) || [], total: k.amount || o.total || 0,
        status: o.status || (k.result === 'awaiting_payment' ? 'awaiting_payment' : 'paid'), seller: uname(k.user) || '-', round: k.channel === 'mkt' ? 'E-Commerce' : (k.round || 'T1') });
    }
    return out.sort((x, y) => Date.parse(y.at) - Date.parse(x.at));
  }
  function teleSales(st, from, to, label) {
    const all = fullView();
    let rows = teleSalesRows(st, from, to);
    const sellers = [...new Set(rows.map((r) => r.seller))].sort(), rounds = ['T1', 'T2', 'T3', 'E-Commerce'].filter((x) => rows.some((r) => r.round === x));
    if (all && ui.tsUser && ui.tsUser !== 'all') rows = rows.filter((r) => r.seller === ui.tsUser);
    if (ui.tsRd && ui.tsRd !== 'all') rows = rows.filter((r) => r.round === ui.tsRd);
    const q = (ui.tsQ || '').trim().toLowerCase();
    if (q) rows = rows.filter((r) => [r.name, r.phone, r.seller, r.round, r.items.map((i) => i.name).join(' ')].join(' ').toLowerCase().includes(q.replace(/[-\s]/g, '')) || (r.phone || '').includes(q.replace(/\D/g, '') || '###'));
    const ok = rows.filter((r) => r.status !== 'cancelled'), sum = ok.reduce((t, r) => t + r.total, 0), qty = ok.reduce((t, r) => t + r.items.reduce((u, i) => u + (i.qty || 0), 0), 0);
    const per = 10, pages = Math.max(1, Math.ceil(rows.length / per)), page = Math.min(Math.max(1, ui.tsPage || 1), pages);
    xReg('ts', 'รายการขายเทเลเซลล์', rows, (r) => r.k.id, [['วันที่', (r) => H.thDate(r.k.date)], ['เวลา', (r) => (r.k.at ? H.thTime(r.k.at) : '')], ['ลูกค้า', (r) => r.name], ['เบอร์', (r) => H.fmtPhone(r.phone || '')], ['สินค้า', (r) => r.items.map((i) => i.name + ' x' + (i.qty || 1)).join(', ')], ['จำนวนชิ้น', (r) => r.items.reduce((u, i) => u + (i.qty || 0), 0)], ['ยอด', (r) => r.total], ['สถานะ', (r) => ({ paid: 'ชำระแล้ว', awaiting_payment: 'รอชำระ', cancelled: 'ยกเลิก' }[r.status] || r.status)], ['ปิดโดย', (r) => r.seller], ['รอบ', (r) => r.round], ['เวลาคุย (วินาที)', (r) => r.k.durationSec || 0]]);
    const stt = { paid: ['good', 'ชำระแล้ว'], awaiting_payment: ['warn', 'รอชำระ'], cancelled: ['bad', 'ยกเลิก'] };
    const tr = (r) => { const s2 = stt[r.status] || stt.paid, u = user(r.k.user);
      return '<tr><td class="ck">' + xCk('ts', r.k.id) + '</td><td class="nowrap"><b>' + H.thDate(r.at).replace(/ \d{4}$/, '') + '</b><small class="muted">' + (r.k.at ? H.thTime(r.k.at) + ' น.' : '') + '</small></td>' +
        '<td><b class="link one"' + (r.c.id ? ' data-open="' + esc(r.c.id) + '"' : '') + '>' + esc(r.name || 'ลูกค้าไม่ระบุชื่อ') + '</b><small class="muted">' + (r.phone ? H.fmtPhone(r.phone) : 'ไม่มีเบอร์') + '</small></td>' +
        '<td>' + (r.items.length ? r.items.map((i) => '<div class="as-it"><span class="one">' + esc(String(i.name).replace(/\s*\([^)]*\)$/, '')) + '</span><b>×' + (i.qty || 1) + '</b>' + (i.price ? '<small class="muted">' + B(i.price) + '</small>' : '') + '</div>').join('') : '<span class="faint">ไม่ระบุสินค้า</span>') + '</td>' +
        '<td class="n"><b>' + B(r.total) + '</b><span class="pill ' + s2[0] + '">' + s2[1] + '</span></td>' +
        '<td>' + (u ? '<span class="who small"><span class="mini">' + esc(u.initial || '') + '</span>' + esc(u.name) + '</span>' : '<b class="one">' + esc(r.seller) + '</b>') + '<small class="muted one">รอบ ' + esc(r.round) + '</small></td>' +
        '<td class="hide-sm"><b class="small">' + (r.k.durationSec ? Math.floor(r.k.durationSec / 60) + ':' + String(r.k.durationSec % 60).padStart(2, '0') + ' นาที' : '-') + '</b><small class="muted">' + (r.k.ocId || r.k.auto ? 'OneCall' : 'บันทึกเอง') + '</small></td></tr>'; };
    const sel = (act, val, opts, allL) => '<select class="in as-sel" data-act-change="' + act + '"><option value="all">' + allL + '</option>' + opts.map((o) => '<option' + (o === val ? ' selected' : '') + '>' + esc(o) + '</option>').join('') + '</select>';
    return '<section class="card as-card"><div class="card-h"><span class="card-ico">' + ico('bag') + '</span><div class="ttl"><h2>' + (all ? 'รายการขายของเทเลเซลล์' : 'รายการขายของฉัน') + '</h2><small>' + label + ' : ทุกออเดอร์ที่ปิดจากการโทร ทีละรายการ</small></div></div>' +
      '<div class="as-sum"><div><small>ออเดอร์</small><b>' + N(ok.length) + '</b></div><div><small>ยอดขาย</small><b>' + B(sum) + '</b></div><div><small>เฉลี่ยต่อออเดอร์</small><b>' + B(ok.length ? sum / ok.length : 0) + '</b></div><div><small>จำนวนชิ้น</small><b>' + N(qty) + '</b></div><div><small>รอชำระ</small><b>' + N(ok.filter((r) => r.status === 'awaiting_payment').length) + '</b></div></div>' +
      '<div class="as-bar"><label class="search"><span class="s-ico">' + ico('search') + '</span><input class="in" placeholder="ค้นหาชื่อ เบอร์ หรือสินค้า" value="' + esc(ui.tsQ || '') + '" data-act-change="ts-q" aria-label="ค้นหา"></label>' + (all ? sel('ts-user', ui.tsUser, sellers, 'เทเลเซลล์ทุกคน') : '') + sel('ts-rd', ui.tsRd, rounds, 'ทุกรอบ') + '</div>' +
      (rows.length ? xBar('ts', 'ออเดอร์') + '<div class="tbl-wrap"><table class="tbl as-tbl"><thead><tr><th class="ck"></th><th>วันที่ / เวลา</th><th>ลูกค้า</th><th>สินค้า × จำนวน</th><th class="n">ยอด</th><th>ปิดการขายโดย</th><th class="hide-sm">เวลาคุย</th></tr></thead><tbody>' + rows.slice((page - 1) * per, page * per).map(tr).join('') + '</tbody></table></div>' +
        pagerHtml('ts-page', page, pages, rows.length, per)
        : '<div class="empty">ไม่มีรายการขายในช่วงนี้</div>') + '</section>';
  }
  // donut: share of a whole, legend with amount + percent beside it
  const DONUT_COL = ['#2563eb', '#0d9488', '#f59e0b', '#8b5cf6', '#ec4899'];
  function donut(parts, center, sub) {
    parts = parts.filter((p) => p.v > 0);
    const tot = parts.reduce((t, p) => t + p.v, 0);
    if (!tot) return '<div class="empty">ยังไม่มียอดขายในช่วงนี้</div>';
    const R = 70, C = 2 * Math.PI * R; let acc = 0;
    const segs = parts.map((p, i) => { const len = p.v / tot * C, gap = parts.length > 1 ? Math.min(3, len / 3) : 0; const s = '<circle class="dn-seg" style="--d:' + (i * 0.08) + 's" r="' + R + '" cx="90" cy="90" fill="none" stroke="' + p.c + '" stroke-width="22" stroke-dasharray="' + Math.max(0, len - gap) + ' ' + (C - Math.max(0, len - gap)) + '" stroke-dashoffset="' + (-acc) + '" transform="rotate(-90 90 90)"><title>' + esc(p.l) + ' : ' + B(p.v) + ' (' + Math.round(p.v / tot * 100) + '%)</title></circle>'; acc += len; return s; }).join('');
    return '<div class="dn"><div class="dn-c"><svg viewBox="0 0 180 180" class="dn-svg"><circle r="' + R + '" cx="90" cy="90" fill="none" stroke="#eef2f7" stroke-width="22"/>' + segs + '</svg><div class="dn-mid"><b>' + center + '</b><small>' + sub + '</small></div></div>' +
      '<div class="dn-leg">' + parts.map((p) => '<div class="dn-row"><i style="background:' + p.c + '"></i><span class="one">' + esc(p.l) + '</span><b>' + Math.round(p.v / tot * 100) + '%</b><small>' + B(p.v) + '</small></div>').join('') + '</div></div>';
  }
  // grouped bars by weekday: Telesales vs Admin side by side
  function weekdayBars(d) {
    const DOW = ['จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.', 'อา.'], FULL = ['วันจันทร์', 'วันอังคาร', 'วันพุธ', 'วันพฤหัสบดี', 'วันศุกร์', 'วันเสาร์', 'วันอาทิตย์'];
    const agg = DOW.map(() => ({ tele: 0, admin: 0 }));
    for (const k of d.days) { const w = (new Date(k + 'T00:00:00Z').getUTCDay() + 6) % 7; agg[w].tele += d.series[k].tele; agg[w].admin += d.series[k].admin; }
    const max = Math.max(1, ...agg.map((a) => Math.max(a.tele, a.admin)));
    const W = 1000, Hh = 250, padT = 14, padB = 34, ih = Hh - padT - padB, gw = W / 7, bw = Math.min(30, gw * 0.18);
    const best = agg.reduce((b, a, i) => (a.tele + a.admin > b.v ? { v: a.tele + a.admin, i } : b), { v: -1, i: 0 });
    let g = '<line class="grid-l" x1="0" x2="' + W + '" y1="' + (padT + ih) + '" y2="' + (padT + ih) + '"/>';
    agg.forEach((a, i) => {
      const cx = gw * i + gw / 2;
      [['tele', 'var(--c-tele)', -1], ['admin', 'var(--c-admin)', 1]].forEach(([k, col, side]) => {
        const h = Math.max(a[k] ? 4 : 0, a[k] / max * ih), x = cx + (side < 0 ? -bw - 4 : 4);
        if (h) g += '<rect class="gb" x="' + x + '" y="' + (padT + ih - h) + '" width="' + bw + '" height="' + h + '" rx="' + Math.min(8, bw / 2) + '" fill="' + col + '"><title>' + FULL[i] + ' : ' + (k === 'tele' ? 'Telesales ' : 'Admin ') + B(a[k]) + '</title></rect>';
      });
      g += '<text class="ax' + (i === best.i && best.v > 0 ? ' best' : '') + '" x="' + cx + '" y="' + (Hh - 10) + '" text-anchor="middle">' + DOW[i] + '</text>';
    });
    return '<svg class="lc" viewBox="0 0 ' + W + ' ' + Hh + '" role="img" aria-label="เทียบยอดขายตามวันในสัปดาห์">' + g + '</svg>' +
      (best.v > 0 ? '<div class="gb-note">' + ico('chart') + ' วันที่ขายได้มากที่สุด : <b>' + FULL[best.i] + '</b> (' + B(best.v) + ' : Telesales ' + B(agg[best.i].tele) + ' / Admin ' + B(agg[best.i].admin) + ')</div>' : '');
  }
  // smooth single line with a soft area; hover a day for its breakdown
  function lineChart(d) {
    const days = d.days, W = 1000, Hh = 260, padL = 48, padR = 16, padT = 16, padB = 30, iw = W - padL - padR, ih = Hh - padT - padB;
    const rev = ui.chart === 'rev';
    const val = (k) => { const x = d.series[k]; return rev ? x.tele + x.admin : x.calls; };
    const vs = days.map(val), max = Math.max(1, ...vs);
    const step = niceStep(max / 4), top = Math.ceil(max / step) * step;
    const X = (i) => padL + (days.length > 1 ? iw * i / (days.length - 1) : iw / 2), Y = (v) => padT + ih - v / top * ih;
    const pts = vs.map((v, i) => [X(i), Y(v)]);
    let path = 'M' + pts[0][0] + ',' + pts[0][1];
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
      const c1y = Math.min(padT + ih, p1[1] + (p2[1] - p0[1]) / 6), c2y = Math.min(padT + ih, p2[1] - (p3[1] - p1[1]) / 6);
      path += ' C' + (p1[0] + (p2[0] - p0[0]) / 6) + ',' + c1y + ' ' + (p2[0] - (p3[0] - p1[0]) / 6) + ',' + c2y + ' ' + p2[0] + ',' + p2[1];
    }
    const area = path + ' L' + pts[pts.length - 1][0] + ',' + (padT + ih) + ' L' + pts[0][0] + ',' + (padT + ih) + ' Z';
    const fmtAxis = (v) => rev ? (v >= 1000 ? (Math.round(v / 100) / 10) + 'k' : v) : v;
    let g = '<defs><linearGradient id="lc-fill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2563eb" stop-opacity=".22"/><stop offset="1" stop-color="#2563eb" stop-opacity="0"/></linearGradient></defs>';
    for (let v = 0; v <= top + 0.001; v += step) g += '<line class="grid-l" x1="' + padL + '" x2="' + (W - padR) + '" y1="' + Y(v) + '" y2="' + Y(v) + '"/><text class="ax" x="' + (padL - 10) + '" y="' + (Y(v) + 4) + '" text-anchor="end">' + fmtAxis(v) + '</text>';
    const every = Math.max(1, Math.ceil(days.length / 8));
    days.forEach((k, i) => { if (i % every === 0 || i === days.length - 1) { const dt = new Date(k + 'T00:00:00Z'); g += '<text class="ax" x="' + X(i) + '" y="' + (Hh - 8) + '" text-anchor="middle">' + dt.getUTCDate() + ' ' + H.TH_MON[dt.getUTCMonth()] + '</text>'; } });
    g += '<path class="lc-area" d="' + area + '" fill="url(#lc-fill)"/><path class="lc-line" pathLength="1" d="' + path + '" fill="none" stroke="#2563eb" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>';
    if (days[days.length - 1] === H.today()) { const lp = pts[pts.length - 1]; g += '<circle class="lc-now-p" cx="' + lp[0] + '" cy="' + lp[1] + '" r="10"/><circle class="lc-now" cx="' + lp[0] + '" cy="' + lp[1] + '" r="5"/>'; }
    const colW = iw / Math.max(1, days.length - 1);
    days.forEach((k, i) => {
      const x = d.series[k], tipW = 168, tx = Math.min(Math.max(X(i) - tipW / 2, padL), W - padR - tipW), lines = rev ? [['Telesales', B(x.tele)], ['Admin', B(x.admin)]] : [['สาย', N(x.calls)]];
      const tipH = 30 + lines.length * 20, ty = Math.max(2, Y(vs[i]) - tipH - 14);
      g += '<g class="lc-pt"><rect class="hit" x="' + (X(i) - colW / 2) + '" y="' + padT + '" width="' + colW + '" height="' + ih + '"/><line class="vl" x1="' + X(i) + '" x2="' + X(i) + '" y1="' + padT + '" y2="' + (padT + ih) + '"/><circle cx="' + X(i) + '" cy="' + Y(vs[i]) + '" r="5"/>' +
        '<g class="tip"><rect x="' + tx + '" y="' + ty + '" width="' + tipW + '" height="' + tipH + '" rx="10"/><text x="' + (tx + 12) + '" y="' + (ty + 21) + '" class="tt">' + H.thDate(k).replace(/ \d{4}$/, '') + ' : ' + (rev ? B(vs[i]) : N(vs[i]) + ' สาย') + '</text>' +
        lines.map((l, j) => '<text x="' + (tx + 12) + '" y="' + (ty + 42 + j * 20) + '" class="tl">' + l[0] + '</text><text x="' + (tx + tipW - 12) + '" y="' + (ty + 42 + j * 20) + '" class="tl" text-anchor="end">' + l[1] + '</text>').join('') + '</g></g>';
    });
    return '<svg class="lc" viewBox="0 0 ' + W + ' ' + Hh + '" role="img" aria-label="กราฟเส้นรายวัน">' + g + '</svg>';
  }
  function barChart(d) {
    const days = d.days, W = Math.max(560, days.length * 46), Hh = 230, padL = 52, padB = 26, padT = 12, iw = W - padL - 10, ih = Hh - padB - padT;
    const vals = days.map((k) => { const s = d.series[k]; return ui.chart === 'rev' ? [s.tele, s.admin, s.ecom] : [s.calls]; });
    const max = Math.max(1, ...vals.map((v) => v.reduce((a, b) => a + b, 0)));
    const step = niceStep(max / 4), top = Math.ceil(max / step) * step;
    const y = (v) => padT + ih - v / top * ih;
    const bw = Math.min(30, iw / days.length * 0.62);
    const colors = ui.chart === 'rev' ? ['var(--c-tele)', 'var(--c-admin)', 'var(--c-ecom)'] : ['var(--c-tele)'];
    let g = '';
    for (let v = 0; v <= top + 0.001; v += step) g += '<line class="grid-l" x1="' + padL + '" x2="' + (W - 10) + '" y1="' + y(v) + '" y2="' + y(v) + '"/><text x="' + (padL - 8) + '" y="' + (y(v) + 4) + '" text-anchor="end">' + (ui.chart === 'rev' ? (v >= 1000 ? (v / 1000) + 'k' : v) : v) + '</text>';
    days.forEach((k, i) => {
      const cx = padL + iw / days.length * (i + 0.5);
      let acc = 0;
      vals[i].forEach((v, j) => { if (!v) return; const y1 = y(acc + v), y0 = y(acc); g += '<rect x="' + (cx - bw / 2) + '" y="' + y1 + '" width="' + bw + '" height="' + Math.max(0, y0 - y1) + '" fill="' + colors[j] + '" rx="' + (j === vals[i].length - 1 ? 3 : 0) + '"><title>' + H.thDate(k) + ' : ' + (ui.chart === 'rev' ? ['Telesales', 'Admin', 'E-Commerce'][j] + ' ' + B(v) : v + ' สาย') + '</title></rect>'; acc += v; });
      const dt = new Date(k + 'T00:00:00Z');
      g += '<text x="' + cx + '" y="' + (Hh - 8) + '" text-anchor="middle"' + (k === H.today() ? ' style="font-weight:700;fill:var(--accent)"' : '') + '>' + dt.getUTCDate() + '</text>';
    });
    return '<svg class="chart" viewBox="0 0 ' + W + ' ' + Hh + '" width="100%" style="min-width:' + Math.min(W, 560) + 'px" role="img" aria-label="กราฟยอดขายรายวัน">' + g + '</svg>';
  }
  function niceStep(x) { const p = Math.pow(10, Math.floor(Math.log10(Math.max(1, x)))); const n = x / p; return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10) * p; }

  // ------------------------------------------------------------ TODAY (call queue for Telesales)
  // One customer at a time, in the order they should be called. One tap logs the result,
  // counts KPI and books the next call automatically (T1 -> T2 -> T3).
  ui.tq = ui.tq || { bucket: 'all', user: null };
  const qSkipped = new Set();
  let qCur = null, qTimer0 = null, qTick = null;
  const Q_BUCKETS = [{ v: 'all', l: 'ทั้งหมด' }, { v: 'appt', l: 'นัดถึงเวลา' }, { v: 'new', l: 'T1' }, { v: 'T2', l: 'T2' }, { v: 'T3', l: 'T3' }, { v: 'mkt', l: 'Marketplace' }];
  function queueFor(who) {
    const v = V(), now = Date.now(), endToday = Date.parse(H.addDays(H.today(), 1) + 'T00:00:00Z') - H.TZ;
    const out = [];
    for (const c of (v.customers || [])) {
      if (c.owner !== who || c.status === 'lost' || c.status === 'dnc' || c.status === 'won' && !c.nextApptAt) continue;
      const appt = c.nextApptAt ? Date.parse(c.nextApptAt) : null;
      let why = null, rank = 9, t = appt || 0;
      if (appt && appt <= endToday) { why = appt < now - 3600000 ? 'late' : 'appt'; rank = appt < now ? 0 : 3; }
      else if (!appt && c.status === 'new') { why = 'new'; rank = 1; t = Date.parse(c.assignedAt || c.createdAt || 0); }
      else if (!appt && H.isStale(v, c)) { why = 'stale'; rank = 4; t = Date.parse(c.updatedAt || 0); }
      if (!why) continue;
      const bucket = c.channel === 'ecom' ? 'mkt' : (c.round === 'T2' || c.round === 'T3') ? c.round : 'new';
      out.push({ c, why, rank, t, bucket, appt });
    }
    return out.sort((a, b) => a.rank - b.rank || a.t - b.t);
  }
  const WHY = { late: ['bad', 'เลยนัด'], appt: ['warn', 'นัดวันนี้'], new: ['info', 'รายชื่อใหม่'], stale: ['mute', 'เงียบนาน'] };
  function pageToday() {
    const v = V(), T = H.today();
    const tele = H.teles(S.full || v);
    const who = boss() ? (ui.tq.user && tele.find((u) => u.id === ui.tq.user) ? ui.tq.user : (tele[0] || {}).id) : S.me.id;
    if (!who) return emptyState('ยังไม่มี Telesales ในระบบ');
    const all = queueFor(who);
    const counts = {}; Q_BUCKETS.forEach((b) => { counts[b.v] = b.v === 'all' ? all.length : b.v === 'appt' ? all.filter((x) => x.why === 'appt' || x.why === 'late').length : all.filter((x) => x.bucket === b.v).length; });
    const list = ui.tq.bucket === 'all' ? all : ui.tq.bucket === 'appt' ? all.filter((x) => x.why === 'appt' || x.why === 'late') : all.filter((x) => x.bucket === ui.tq.bucket);
    const ready = list.filter((x) => !qSkipped.has(x.c.id));
    const pick = ready.find((x) => x.c.id === qCur) || ready[0] || list[0] || null;
    if (!pick || pick.c.id !== qCur) { qCur = pick ? pick.c.id : null; qTimer0 = null; }
    const k = H.teleKpi(v, who, T, T);
    const target = k.target.fb + k.target.mkt, done = k.fbCalls + k.mktCalls;
    const head = '<section class="q-head"><div class="q-prog"><div class="row between"><b>วันนี้โทรแล้ว ' + done + ' / ' + target + ' สาย</b><span class="small muted">' + (target > done ? 'เหลืออีก ' + (target - done) + ' สาย' : 'ครบเป้าแล้ว') + '</span></div>' +
      '<div class="meter ' + meterCls(pct(done, target)) + '" style="height:10px"><i style="width:' + pct(done, target) + '%"></i></div>' +
      '<div class="q-stats"><span>ได้คุย <b>' + k.talked + '</b></span><span>ปิดได้ <b>' + k.orders + '</b></span><span>ยอดขาย <b>' + B(k.amount) + '</b></span><span>เวลาคุย <b>' + Math.round(k.talkSec / 60) + ' น.</b></span></div></div>' +
      (boss() ? segF('ดูคิวของ', 'tq-user', tele.map((u) => ({ v: u.id, l: u.name })), who) : '') + '</section>' +
      '<div class="chips q-buckets">' + Q_BUCKETS.map((b) => '<button class="chip ' + (ui.tq.bucket === b.v ? 'on' : '') + '" data-act="tq-bucket" data-v="' + b.v + '">' + b.l + '<span class="c">' + counts[b.v] + '</span></button>').join('') + '</div>';
    if (!pick) return head + '<section class="card q-card">' + emptyState('<b style="font-size:17px;color:var(--text)">เคลียร์คิวนี้ครบแล้ว</b><div class="small" style="margin-top:4px">ลูกค้าที่โทรแล้วจะกลับมาในคิวเองตามวันนัดครั้งถัดไป</div>', '<button class="btn sm" data-go="customers">ดูลูกค้าทั้งหมด</button>' + (ui.tq.bucket !== 'all' ? '<button class="btn sm" data-act="tq-bucket" data-v="all">ดูคิวทั้งหมด</button>' : '')) + '</section>';
    const c = pick.c, o = (c.orders || [])[0];
    const idx = list.indexOf(pick) + 1;
    const lastNote = (c.notes || []).find((n) => n.kind === 'call' || n.kind === 'note');
    const days = o ? H.daysBetween(H.dayKey(o.date), T) : null;
    const reason = WHY[pick.why];
    const goal = c.channel === 'fb' ? (H.ROUNDS[c.round || 'T1']) : 'ลูกค้า Marketplace : แนะนำตัว ถามผลการใช้ ชวนสั่งซ้ำช่องทางโทร';
    const prods = products().slice(0, 14);
    const next = ready.filter((x) => x !== pick).slice(0, 5);
    return head + '<div class="grid q-grid"><section class="card q-card" data-q="' + c.id + '">' +
      '<div class="row" style="gap:8px"><span class="pill ' + reason[0] + '">' + reason[1] + (pick.appt ? ' ' + H.thTime(new Date(pick.appt).toISOString()) : '') + '</span>' + (c.channel === 'fb' ? roundTag(c.round || 'T1') : platformTag(c.platform)) + '<span class="grow"></span><span class="small muted">คิวที่ ' + idx + ' จาก ' + list.length + '</span></div>' +
      '<h2 class="q-name one">' + esc(c.name || 'ไม่ระบุชื่อ') + '</h2>' +
      '<div class="q-dial"><div><span class="phone-big">' + H.fmtPhone(c.phone) + '</span> <button class="copy" data-act="copy" data-text="' + esc(H.normPhone(c.phone)) + '">คัดลอก</button></div>' +
      '<a class="btn primary lg" href="tel:' + esc(H.normPhone(c.phone)) + '" data-act="q-dial">' + ico('phone') + ' โทรเลย</a><span class="q-timer" id="q-timer">' + (qTimer0 ? H.hms((Date.now() - qTimer0) / 1000) : '00:00:00') + '</span></div>' +
      '<div class="q-goal"><b>คุยเรื่องอะไร</b><span>' + esc(pick.why === 'appt' || pick.why === 'late' ? ((V().appointments || []).find((a) => a.customerId === c.id && !a.done) || {}).purpose || goal : goal) + '</span></div>' +
      '<div class="q-facts"><div><small>ซื้อล่าสุด</small><b class="one">' + (o ? esc((o.items || []).map((i) => i.name + (i.qty > 1 ? ' x' + i.qty : '')).join(', ') || 'ออเดอร์') : 'ยังไม่มี') + '</b><span class="small muted">' + (o ? B(o.total) + ' : ' + (days === 0 ? 'วันนี้' : days + ' วันก่อน') : '-') + '</span></div>' +
      '<div><small>ซื้อทั้งหมด</small><b>' + B(H.customerTotal(c)) + '</b><span class="small muted">' + (c.orders || []).length + ' ครั้ง : โทรแล้ว ' + (c.callCount || 0) + ' ครั้ง</span></div></div>' +
      (lastNote ? '<div class="q-note">' + ico('note') + '<span class="one">ครั้งก่อน : ' + esc(lastNote.text) + '</span></div>' : '') +
      '<div class="section-t" style="margin-top:4px">ผลการโทร</div>' +
      '<div class="q-out"><button class="q-btn mute" data-act="q-save" data-r="no_answer">' + ico('phone') + '<b>ไม่รับสาย</b><small>ระบบนัดโทรซ้ำให้เอง</small></button>' +
      '<button class="q-btn info" data-act="q-sub" data-v="talk">' + ico('msg') + '<b>คุยแล้ว</b><small>ยังไม่ซื้อ</small></button>' +
      '<button class="q-btn good" data-act="q-sub" data-v="sale">' + ico('bag') + '<b>ปิดการขายได้</b><small>เลือกสินค้า</small></button>' +
      '<button class="q-btn warn" data-act="q-sub" data-v="later">' + ico('calendar') + '<b>นัดโทรใหม่</b><small>ลูกค้าขอให้โทรกลับ</small></button></div>' +
      '<div class="q-sub" data-sub="talk" hidden><div class="small muted">ลูกค้าเป็นอย่างไร (กดแล้วบันทึกทันที)</div><div class="chips">' +
      [['hot', 'สนใจมาก', 'นัด 2 วัน'], ['warm', 'ขอคิดก่อน', 'นัด 3 วัน'], ['info', 'ขอรายละเอียด', 'นัดพรุ่งนี้'], ['later', 'ยังไม่พร้อม', 'นัด 14 วัน'], [c.channel === 'fb' ? 'followup' : 'followup', 'คุยจบรอบนี้', c.channel === 'fb' ? 'ขึ้นรอบถัดไป' : 'นัด 25 วัน']].map(([r, l, d]) => '<button class="chip" data-act="q-save" data-r="' + r + '">' + l + ' <span class="c">' + d + '</span></button>').join('') +
      '<button class="chip" data-act="q-lost">ไม่สนใจ</button></div><div class="chips" data-lost hidden>' + H.LOST_REASONS.map((r) => '<button class="chip" data-act="q-save" data-r="lost" data-reason="' + esc(r) + '">' + esc(r) + '</button>').join('') + '</div></div>' +
      '<div class="q-sub" data-sub="sale" hidden><div class="small muted">แตะสินค้าที่ขายได้ (แตะซ้ำเพิ่มจำนวน)</div><div class="chips q-prods">' + prods.map((p) => '<button class="chip" data-act="q-prod" data-code="' + esc(p.code) + '">' + esc(p.name) + ' <span class="c">' + B(p.price) + '</span></button>').join('') + '</div>' +
      '<div class="q-cart" id="q-cart"></div><div class="f2"><label class="field"><span>ยอดขาย (บาท)</span><input class="in" type="number" min="0" id="q-amount" placeholder="คำนวณให้อัตโนมัติ"></label><div class="field"><span>การชำระเงิน</span><div class="seg sm" data-seg-pay><button class="on" data-act="q-pay" data-v="won">ชำระแล้ว</button><button data-act="q-pay" data-v="awaiting_payment">รอชำระ</button></div></div></div>' +
      '<button class="btn good lg" data-act="q-save" data-r="sale">' + ico('check') + ' บันทึกการขาย</button></div>' +
      '<div class="q-sub" data-sub="later" hidden><div class="small muted">โทรกลับเมื่อไร</div><div class="chips">' + [[0, 'เย็นนี้', '17:00'], [1, 'พรุ่งนี้', '10:30'], [3, 'อีก 3 วัน', '10:30'], [7, 'อีก 7 วัน', '10:30']].map(([d, l, t]) => '<button class="chip" data-act="q-later" data-d="' + d + '" data-t="' + t + '">' + l + '</button>').join('') + '</div>' +
      '<div class="row" style="flex-wrap:nowrap"><input class="in" type="datetime-local" id="q-later-at" aria-label="วันเวลานัด"><button class="btn primary" data-act="q-save" data-r="followup-custom">บันทึกนัด</button></div></div>' +
      '<div class="q-extra"><input class="in" id="q-note" placeholder="โน้ตสั้น ๆ (ไม่บังคับ)" aria-label="โน้ต"><label class="q-dur"><span class="small muted">เวลาคุย</span><input class="in" id="q-dur" placeholder="นาที:วินาที" inputmode="numeric" aria-label="เวลาคุย นาที:วินาที"></label></div>' +
      '<div class="row between"><button class="btn sm" data-act="q-skip">ข้ามไปก่อน</button><button class="btn sm" data-open="' + c.id + '">' + ico('note') + ' ดูประวัติทั้งหมด</button></div></section>' +
      '<aside class="card q-next"><div class="section-t">คิวถัดไป</div>' + (next.length ? next.map((x) => '<button class="q-next-row" data-act="q-jump" data-id="' + x.c.id + '"><span class="pill ' + WHY[x.why][0] + '">' + WHY[x.why][1] + '</span><span class="one">' + esc(x.c.name || H.fmtPhone(x.c.phone)) + '</span>' + (x.c.channel === 'fb' ? roundTag(x.c.round || 'T1') : '<span class="tag">MKT</span>') + '</button>').join('') : '<div class="small faint">ไม่มีคิวถัดไป</div>') +
      (qSkipped.size ? '<button class="link small" data-act="q-unskip" style="margin-top:8px">นำรายชื่อที่ข้ามกลับเข้าคิว (' + qSkipped.size + ')</button>' : '') +
      '<div class="small muted" style="margin-top:12px">ลำดับคิว : เลยนัด → รายชื่อใหม่ → นัดวันนี้ → ลูกค้าเงียบนาน</div></aside></div>';
  }
  const qCart = {};
  function qCartHtml() {
    const items = Object.entries(qCart).filter(([, q]) => q > 0);
    const total = items.reduce((s, [code, q]) => s + q * ((products().find((p) => p.code === code) || {}).price || 0), 0);
    const amt = $('#q-amount'); if (amt && !amt.dataset.touched) amt.value = total || '';
    return items.map(([code, q]) => { const p = products().find((x) => x.code === code) || { name: code, price: 0 }; return '<span class="pill info">' + esc(p.name) + ' x' + q + ' <button class="x" style="width:20px;height:20px" data-act="q-unprod" data-code="' + esc(code) + '" aria-label="เอาออก">' + ico('x') + '</button></span>'; }).join('');
  }
  function qDuration() {
    const raw = ($('#q-dur') || {}).value || '';
    if (raw.trim()) { const parts = raw.split(/[:.\s]/).map(Number); return parts.length > 1 ? (parts[0] || 0) * 60 + (parts[1] || 0) : (parts[0] || 0) * 60; }
    return qTimer0 ? Math.round((Date.now() - qTimer0) / 1000) : 0;
  }
  async function qSave(el) {
    const id = qCur; if (!id) return;
    let r = el.dataset.r, payload = { customerId: id, durationSec: qDuration(), note: ($('#q-note') || {}).value || '', autoNext: true };
    if (r === 'sale') {
      const items = Object.entries(qCart).filter(([, q]) => q > 0).map(([code, qty]) => ({ name: code, qty }));
      if (!items.length && !Number(($('#q-amount') || {}).value)) { toast('แตะเลือกสินค้าที่ขายได้ก่อน', true); return; }
      r = ($('[data-seg-pay] .on') || {}).dataset ? $('[data-seg-pay] .on').dataset.v : 'won';
      Object.assign(payload, { items, amount: ($('#q-amount') || {}).value });
    } else if (r === 'followup-custom') {
      const at = fromLocal(($('#q-later-at') || {}).value); if (!at) { toast('เลือกวันเวลาที่จะโทรกลับ', true); return; }
      r = 'followup'; payload.nextAt = at; payload.nextPurpose = 'ลูกค้าขอให้โทรกลับ';
    } else if (r === 'lost') payload.lostReason = el.dataset.reason;
    payload.result = r;
    if (r === 'followup' && !payload.nextAt) payload.autoNext = true;   // "คุยจบรอบนี้": move to the next round
    const c = H.findCustomer(V(), id);
    const res = await run(() => api.act('logCall', payload), (x) => 'บันทึกแล้ว : ' + (c ? c.name : '') + (x && x.next ? ' : โทรครั้งถัดไป ' + H.thDate(x.next.at, true) + (x.next.round ? ' (' + x.next.round + ')' : '') : r === 'lost' ? ' : ปิดรายชื่อนี้' : ''));
    if (res !== null) { Object.keys(qCart).forEach((k) => delete qCart[k]); qCur = null; qTimer0 = null; render(); }
  }

  const C_STATUS_OPTS = [{ v: 'due', l: 'ต้องโทรวันนี้' }].concat(Object.entries(H.STATUS).map(([k, x]) => ({ v: k, l: x.label })));
  // ------------------------------------------------------------ page head + breadcrumb (v2 look)
  const TH_DAYS_FULL = ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์'];
  const TH_MON_FULL = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'];
  const longDay = (d) => { const x = new Date(d + 'T00:00:00Z'); return TH_DAYS_FULL[x.getUTCDay()] + ' ' + H.thDate(d); };
  const CRUMB = { home: ['หน้าหลัก'], overview: ['ภาพรวม', 'ภาพรวมผู้บริหาร'], today: ['งานขาย', 'คิวโทรวันนี้'], customers: ['งานขาย', 'ลูกค้า'], customer: ['งานขาย', 'ลูกค้า', 'รายละเอียดลูกค้า'],
    calendar: ['งานขาย', 'ปฏิทินนัดหมาย'], kpi: ['งานขาย', 'บันทึก KPI'], approvals: ['งานขาย', 'รายชื่อใหม่'], ovtele: ['ภาพรวมทั้งหมด', 'เทเลเซลล์'], ovadmin: ['ภาพรวมทั้งหมด', 'แอดมิน'], dnc: ['งานขาย', 'ยกเลิกการติดต่อถาวร'], close: ['การจัดการ', 'ปิดการขาย'], settings: ['การจัดการ', 'ตั้งค่า'] };
  const PH = { today: ['คิวโทรวันนี้', 'ระบบเรียงลำดับให้แล้ว โทรทีละคน กดผลแล้วไปคนถัดไป'],
    kpi: ['บันทึก KPI', 'กรอกทีละสายหรือยอดรวมทั้งวัน ตัวเลขขึ้น Dashboard ผู้บริหารทันที'], dnc: ['ยกเลิกการติดต่อถาวร', 'ลูกค้าที่ขอไม่ให้ติดต่ออีก ไม่อยู่ในคิวโทรและรายชื่อลูกค้า กู้คืนได้ถ้าต้องการ'], approvals: ['การแจกรายชื่อ', 'ระบบแจกรายชื่อจากแอดมินที่ปิดการขายบน FB Page ให้ Telesales อัตโนมัติ 50:50'],
    close: ['บันทึกปิดการขาย', 'ปิดการขายแล้วระบบส่งรายชื่อให้ Telesales อัตโนมัติ'], settings: ['ตั้งค่า', 'เป้า KPI ทีมงาน สินค้า และการเชื่อมต่อระบบ'] };
  function pageHead(title, sub, actions) { return '<div class="ph"><div class="ph-t"><h1>' + title + '</h1>' + (sub ? '<p>' + sub + '</p>' : '') + '</div>' + (actions ? '<div class="ph-act">' + actions + '</div>' : '') + '</div>'; }
  function crumbHtml() {
    const c = S.page === 'help' ? ['ช่วยเหลือ', 'คู่มือการใช้งาน'] : S.page === 'approvals' && boss() ? ['รายชื่อลูกค้า', 'รายชื่อลูกค้าที่ถูกแจก'] : S.page === 'dnc' && boss() ? ['รายชื่อลูกค้า', 'ยกเลิกการติดต่อ'] : S.page === 'customers' && boss() ? ['รายชื่อลูกค้า', 'รายชื่อลูกค้าทั้งหมด'] : S.page === 'overview' ? ['ภาพรวมทั้งหมด'] : CRUMB[S.page] || ['หน้าหลัก'];
    return '<nav class="bc" aria-label="ตำแหน่งหน้า">' + c.map((x, i) => (i === c.length - 1 ? '<b>' + x + '</b>' : (S.page === 'customer' && x === 'ลูกค้า' ? '<button class="link-plain" data-go="customers">' + x + '</button>' : '<span>' + x + '</span>'))).join('<i>›</i>') + '</nav>';
  }

  // ------------------------------------------------------------ CUSTOMERS (v2)
  const PLAT_ORDER = ['shopee', 'lazada', 'tiktok', 'evolution'];
  const platOpts = (list) => { const n = {}; for (const c of list) { const k = c.platform || 'evolution'; n[k] = (n[k] || 0) + 1; } return [{ v: 'all', l: 'ทุกช่องทาง' }].concat(PLAT_ORDER.map((k) => ({ v: k, l: (H.PLATFORMS[k] || {}).label + ' (' + N(n[k] || 0) + ')' }))); };
  const ROUND_OPTS = [{ v: 'all', l: 'T1 / T2 / T3' }, { v: 'T1', l: 'T1' }, { v: 'T2', l: 'T2' }, { v: 'T3', l: 'T3' }];
  function apptMap() { const m = {}; for (const a of (V().appointments || [])) if (!a.done && (!m[a.customerId] || Date.parse(a.at) < Date.parse(m[a.customerId].at))) m[a.customerId] = a; return m; }
  function custFiltersActive() { return (ui.cStatus || []).length > 0 || (ui.custTab === 'fb' && ui.round !== 'all') || (boss() && ui.owner !== 'all') || !!drRange('cust')[0]; }
  function custBase() { const v = V(); return (v.customers || []).filter((c) => c.status !== 'dnc' && c.channel === ui.custTab && (c.owner || boss()) && (!boss() || ui.owner === 'all' || (ui.owner === 'none' ? !c.owner : c.owner === ui.owner))); }
  // "มาใหม่วันนี้": customers the system handed out today (lead distribution), not sheet imports
  function newTodayIds() {
    const T = H.today(), ids = new Set((V().approvals || []).filter((a) => a.status === 'approved' && H.dayKey(a.decidedAt || a.at) === T).map((a) => a.customerId));
    for (const c of V().customers || []) if (c.channel === 'ecom' && c.autoAssignedAt && H.dayKey(c.autoAssignedAt) === T) ids.add(c.id);   // E-Commerce orders handed out today
    return ids;
  }
  const isTodayAppt = (c) => c.nextApptAt && H.dayKey(c.nextApptAt) === H.today();
  const isLateAppt = (c) => c.nextApptAt && Date.parse(c.nextApptAt) < Date.now() - 3600000;
  function custList() {
    const v = V(), T = H.today();
    let list = custBase();
    if (ui.cView === 'new') { const ns = newTodayIds(); list = list.filter((c) => ns.has(c.id)); }
    else if (ui.cView === 'today') list = list.filter(isTodayAppt);
    else if (ui.cView === 'late') list = list.filter((c) => isLateAppt(c) || H.isStale(v, c));
    const q = (ui.q || '').trim().toLowerCase(), qd = q.replace(/\D/g, '');
    if (q) list = list.filter((c) => (c.name || '').toLowerCase().includes(q) || (qd.length >= 3 && H.normPhone(c.phone).includes(qd)) || (c.address || '').toLowerCase().includes(q) ||
      (c.orders || []).some((o) => (o.extId || '').toLowerCase().includes(q) || (o.items || []).some((i) => (i.name || '').toLowerCase().includes(q))));
    const [f, t] = drRange('cust');
    if (f) list = list.filter((c) => { const o = (c.orders || [])[0]; const d = o ? H.dayKey(o.date) : ''; return d && d >= f && d <= t; });
    const due = (c) => c.status === 'new' || (c.nextApptAt && H.dayKey(c.nextApptAt) <= T) || H.isStale(v, c);
    const sts = ui.cStatus || [];
    if (sts.length) list = list.filter((c) => sts.some((s) => (s === 'due' ? due(c) : c.status === s)));
    if (ui.custTab === 'fb' && ui.round !== 'all') list = list.filter((c) => c.round === ui.round);
    if (ui.custTab === 'ecom' && ui.plat && ui.plat !== 'all') list = list.filter((c) => (c.platform || 'evolution') === ui.plat);
    const key = (c) => (c.nextApptAt ? Date.parse(c.nextApptAt) : 9e15);
    return list.sort((a, b) => key(a) - key(b) || (Date.parse(b.updatedAt || 0) - Date.parse(a.updatedAt || 0)));
  }
  function pageCustomers() {
    const v = V();
    const scope = (ch) => (v.customers || []).filter((c) => c.status !== 'dnc' && c.channel === ch && (c.owner || boss()) && (!boss() || ui.owner === 'all' || (ui.owner === 'none' ? !c.owner : c.owner === ui.owner))).length;
    const base = custBase();
    const nToday = base.filter(isTodayAppt).length, nLate = base.filter((c) => isLateAppt(c) || H.isStale(v, c)).length;
    const am = apptMap();
    const nextA = base.map((c) => am[c.id]).filter((a) => a && Date.parse(a.at) >= Date.now() - 3600000).sort((a, b) => Date.parse(a.at) - Date.parse(b.at))[0];
    const nextC = nextA ? H.findCustomer(S.full || v, nextA.customerId) : null;
    const tele = H.teles(S.full || v);
    const ownerOpts = [{ v: 'all', l: 'ทุกคน' }].concat(tele.map((u) => ({ v: u.id, l: u.name })), [{ v: 'none', l: 'ยังไม่มีผู้ดูแล' }]);
    const actions = (boss() ? '<button class="btn" data-act="cust-io">' + ico('upload') + ' นำเข้า / ส่งออก</button>' : '') + '<button class="btn primary" data-act="add-customer">' + ico('plus') + ' เพิ่มลูกค้า</button>';
    const qtab = (k, l, n, cls) => '<button class="qtab' + (ui.cView === k ? ' on' : '') + '" data-act="cview" data-v="' + k + '">' + l + ' <span class="' + (cls || '') + '">' + N(n) + '</span></button>';
    return pageHead('ลูกค้า', 'จัดการข้อมูลลูกค้าและติดตามนัดหมายได้จากที่เดียว', actions) +
      '<div class="utabs"><button class="' + (ui.custTab === 'fb' ? 'on' : '') + '" data-act="ctab" data-v="fb">' + ico('msg') + ' FB Page (Pancake) <span class="cnt">' + N(scope('fb')) + '</span></button>' +
      '<button class="' + (ui.custTab === 'ecom' ? 'on' : '') + '" data-act="ctab" data-v="ecom">' + ico('store') + ' E-Commerce <span class="cnt">' + N(scope('ecom')) + '</span></button>' +
      '<span class="grow"></span><span class="small muted hide-sm">' + (ui.custTab === 'fb' ? 'รายชื่อจากแอดมินที่ปิดการขายบน FB Page' : 'Lazada : Shopee : TikTok ผ่าน BigSeller') + '</span></div>' +
      '<section class="card lcard"><div class="lc-top"><div class="qtabs">' + qtab('all', 'ทั้งหมด', base.length) + qtab('new', 'มาใหม่วันนี้', (() => { const ns = newTodayIds(); return base.filter((c) => ns.has(c.id)).length; })(), 'acc') + qtab('today', 'นัดวันนี้', nToday) + qtab('late', 'เลยกำหนด', nLate, 'bad') + '</div>' +
      (nextA && nextC ? '<button class="link-plain small muted lc-next" data-open="' + nextC.id + '">' + ico('clock') + ' นัดถัดไป ' + H.thTime(nextA.at) + ' : ' + esc(nextC.name) + '</button>' : '') + '</div>' +
      searchBox('cust', 'ค้นหาชื่อ เบอร์โทร คำสั่งซื้อ สินค้า หรือที่อยู่', ui.q) +
      '<div class="flt"><span class="flt-ico">' + ico('gear') + '</span>' + drBtn('cust', 'all', () => { resetList('cust'); render(); }, 'คำสั่งซื้อล่าสุด') +
      ddBtn('cstatus', { label: 'สถานะ', multi: true, options: C_STATUS_OPTS, value: ui.cStatus, onPick: (vals) => { ui.cStatus = vals; resetList('cust'); render(); } }) +
      (ui.custTab === 'ecom' ? ddBtn('cplat', { label: 'ช่องทาง', options: platOpts(base), value: ui.plat || 'all', onPick: (x) => { ui.plat = x; resetList('cust'); render(); } }) : '') +
      (ui.custTab === 'fb' ? ddBtn('cround', { label: 'รอบ', options: ROUND_OPTS, value: ui.round, onPick: (x) => { ui.round = x; resetList('cust'); render(); } }) : '') +
      (boss() ? ddBtn('cowner', { label: 'ผู้ดูแล', options: ownerOpts, value: ui.owner, onPick: (x) => { ui.owner = x; resetList('cust'); render(); } }) : '') +
      '<span class="grow"></span><span class="small muted hide-sm">' + (boss() ? 'มุมมองผู้จัดการ' : 'มุมมองเซลล์') + '</span></div>' +
      '<div id="lv-cust">' + custListHtml() + '</div></section>';
  }
  LVB.cust = () => custListHtml();
  function nextApptCell(c, a) {
    if (!c.nextApptAt) return '<span class="faint">-</span>';
    const t = Date.parse(c.nextApptAt), T = H.today(), d = H.dayKey(c.nextApptAt);
    const purpose = a ? '<small class="one">' + esc(a.purpose) + '</small>' : '';
    if (t < Date.now() - 3600000) { const days = Math.max(0, H.daysBetween(d, T)); return '<b class="na late">' + (days ? 'เลยกำหนด ' + days + ' วัน' : 'เลยเวลา ' + H.thTime(c.nextApptAt)) + '</b><small>' + H.thDate(d).replace(/ \d{4}$/, '') + ' : ' + H.thTime(c.nextApptAt) + '</small>'; }
    if (d === T) return '<b class="na today">วันนี้ : ' + H.thTime(c.nextApptAt) + '</b>' + purpose;
    return '<b class="na">' + H.thDate(d).replace(/ \d{4}$/, '') + ' : ' + H.thTime(c.nextApptAt) + '</b>' + purpose;
  }
  function custListHtml() {
    const list = custList(), active = custFiltersActive(), q = (ui.q || '').trim();
    const am = apptMap();
    const clearQ = '<button class="btn sm" data-act="search-clear" data-key="cust">ล้างคำค้น</button>';
    const clearF = '<button class="btn sm" data-act="filters-clear">ล้างฟิลเตอร์ทั้งหมด</button>';
    const empty = q ? emptyState('ไม่พบ “' + esc(q) + '”' + (active ? '<div class="small" style="margin-top:4px">กำลังกรองด้วยฟิลเตอร์อื่นอยู่ด้วย</div>' : ''), clearQ + (active ? clearF : ''))
      : active || ui.cView !== 'all' ? emptyState('ไม่พบลูกค้าตามเงื่อนไขที่เลือก', clearF) : emptyState('ยังไม่มีลูกค้าในแท็บนี้', '<button class="btn sm primary" data-act="add-customer">' + ico('plus') + ' เพิ่มลูกค้า</button>');
    const head = [{ h: 'ชื่อ / เบอร์โทร' }, { h: 'คำสั่งซื้อล่าสุด' }, { h: 'ยอดซื้อสะสม', cls: 'hide-sm' }, { h: 'สถานะ' }, { h: ui.custTab === 'fb' ? 'รอบ' : 'แพลตฟอร์ม' }, { h: 'นัดหมายถัดไป ↑', cls: 'th-acc' }].concat(boss() ? [{ h: 'ผู้ดูแล', cls: 'hide-sm' }] : []).concat([{ h: '', cls: 'n' }]);
    const actions = [{ act: 'cust-status', label: 'เปลี่ยนสถานะ' }].concat([{ act: 'cust-assign', label: 'เปลี่ยนผู้ดูแล' }, { act: 'cust-dnc', label: 'ยกเลิกการติดต่อ', danger: true }], boss() ? [{ act: 'cust-del', label: 'ลบ', danger: true }] : []);
    return listView({
      key: 'cust', items: list, id: (c) => c.id, click: (c) => c.id, head, actions, empty, unit: 'ลูกค้า',
      xl: { name: 'ลูกค้า ' + (ui.custTab === 'fb' ? 'FB Page' : 'E-Commerce'), cols: [['ชื่อ', (c) => c.name], ['เบอร์', (c) => H.fmtPhone(c.phone)], ['ที่อยู่', (c) => c.address], ['ช่องทาง', (c) => (c.channel === 'fb' ? 'FB Page' : 'E-Commerce')], ['เพจ / แพลตฟอร์ม', (c) => (c.channel === 'fb' ? c.page : (H.PLATFORMS[c.platform] || {}).label)], ['รอบ', (c) => c.round], ['สถานะ', (c) => (H.STATUS[c.status] || {}).label], ['ผู้ดูแล', (c) => uname(c.owner)], ['ยอดซื้อสะสม', (c) => H.customerTotal(c)], ['จำนวนคำสั่งซื้อ', (c) => (c.orders || []).length], ['ซื้อล่าสุด', (c) => ((c.orders || [])[0] ? H.thDate(c.orders[0].date) : '')], ['สินค้าล่าสุด', (c) => (((c.orders || [])[0] || {}).items || []).map((i) => i.name + ' x' + i.qty).join(', ')], ['นัดถัดไป', (c) => (c.nextApptAt ? H.thDate(c.nextApptAt, true) : '')], ['โทรแล้ว (ครั้ง)', (c) => c.callCount || 0]] },
      row: (c) => {
        const o = (c.orders || [])[0];
        const it = o ? (o.items || []).map((i) => i.name.replace(/ \([^)]*\)$/, '') + ' × ' + i.qty).join(', ') : '';
        const u = c.owner ? user(c.owner) : null;
        return ['<td class="cust-name"><b class="one">' + esc(c.name || 'ไม่ระบุชื่อ') + '</b><small>' + H.fmtPhone(c.phone) + '</small></td>',
          '<td class="c2">' + (o ? '<span class="one">' + esc(it || 'คำสั่งซื้อ') + '</span><small>' + H.thDate(o.date) + ' : ' + B(o.total) + '</small>' : '<span class="faint">ยังไม่มี</span>') + '</td>',
          '<td class="c2 hide-sm"><b>' + B(H.customerTotal(c)) + '</b><small>' + (c.orders || []).length + ' คำสั่งซื้อ</small></td>',
          '<td>' + statusPill(c.status) + '</td>', '<td>' + (c.channel === 'fb' ? '<span class="rtag">' + (c.round || 'T1') + '</span>' : platformTag(c.platform)) + '</td>',
          '<td class="c2">' + nextApptCell(c, am[c.id]) + '</td>']
          .concat(boss() ? ['<td class="hide-sm"><span class="who">' + (u ? '<span class="mini">' + esc(u.initial || '') + '</span>' + esc(u.name) : '<span class="faint">-</span>') + '</span></td>'] : [])
          .concat(['<td class="n"><button class="dots" data-act="row-menu" data-id="' + c.id + '" aria-label="เมนูเพิ่มเติม">⋯</button></td>']);
      },
    });
  }

  // ------------------------------------------------------------ CUSTOMER DETAIL (v2, full page)
  const RESULT_STEPS = [
    { id: 'sold', label: 'ขายได้', hint: 'ลูกค้าตกลงซื้อ', icon: 'checkc', tone: 'good', q: 'ชำระเงินแล้วหรือยัง', ids: ['won', 'awaiting_payment'] },
    { id: 'talk', label: 'ยังไม่ซื้อ', hint: 'สนใจ / ขอคิด / ปฏิเสธ / ยกเลิกถาวร', icon: 'phone', tone: 'warn', q: 'ลูกค้าตอบว่าอย่างไร', ids: ['hot', 'warm', 'info', 'followup', 'later', 'lost', 'dnc'] },
    { id: 'none', label: 'ติดต่อไม่ได้', hint: 'ไม่รับสาย / ปิดเครื่อง', icon: 'x', tone: 'bad', q: '', ids: ['no_answer'] },
  ];
  // products grouped by line ("Yanhee Anti-Aging") with pack sizes ("1 กล่อง") as a second step
  const SIZE_RE = /\s*(\d+\s*(กล่อง|หลอด|ขวด|กระปุก|ชิ้น|ซอง|ก้อน|ชุด|แพ็ค|แพ็ก|เซ็ต))$/;
  function prodLines() {
    const map = new Map();
    for (const p of products()) { const m = p.name.match(SIZE_RE); const line = m ? p.name.slice(0, m.index).trim() : p.name; if (!map.has(line)) map.set(line, []); map.get(line).push({ ...p, size: m ? m[1] : '' }); }
    return [...map].map(([name, items]) => ({ name, items }));
  }
  function pickSize(f, el) {
    f.prod.value = el.value; f.prod.dataset.price = el.dataset.price; f.prod.dataset.label = el.dataset.label;
    $('[data-pp-label]', f).textContent = el.dataset.label + ' (' + B(Number(el.dataset.price)) + ')';
    if (!f.amount.dataset.touched) f.amount.value = Number(el.dataset.price) * (Number(f.qty.value) || 1);
  }
  // change owner: bosses and telesales (a telesales can hand their own customers to another telesales)
  function assignModal(items, fromDetail) {
    if (!items.length) return;
    const cur = items.length === 1 ? items[0].owner : null;
    openModal('<div class="row between" style="margin-bottom:6px"><h2 style="font-size:18px">' + (items.length === 1 ? 'เปลี่ยนผู้ดูแล : ' + esc(items[0].name) : 'เปลี่ยนผู้ดูแลลูกค้า ' + N(items.length) + ' ราย') + '</h2><button class="icon-btn" data-act="close-modal" aria-label="ปิด">' + ico('x') + '</button></div>' +
      '<p class="small muted" style="margin:0 0 12px">นัดหมายที่ยังไม่ได้โทรจะย้ายไปให้ผู้ดูแลใหม่ด้วย' + (boss() ? '' : ' : ย้ายแล้วรายชื่อนี้จะไปอยู่ในรายการของคนที่รับ') + '</p><div class="people">' +
      H.teles(S.full || V()).map((u) => '<button class="person' + (u.id === cur ? ' on' : '') + '" data-assign-to="' + u.id + '"' + (u.id === cur ? ' disabled' : '') + '>' + av(u, 'lg') + '<b>' + esc(u.name) + '</b><small>' + (u.id === cur ? 'ผู้ดูแลปัจจุบัน' : u.id === S.me.id ? 'ตัวเอง' : 'Telesales') + '</small></button>').join('') + '</div>');
    $$('[data-assign-to]', modal).forEach((b) => b.onclick = () => { closeModal(); const to = b.dataset.assignTo;
      run(async () => { const r = await api.act('bulkUpdateCustomers', { ids: items.map((c) => c.id), patch: { owner: to } }); SEL.cust = null;
        if (fromDetail && !boss() && to !== S.me.id) go('customers'); return r; }, (r) => 'ย้ายให้ ' + uname(to) + ' แล้ว ' + N(r.updated) + ' ราย'); });
  }
  function dncModal(items) {
    if (!items.length) return;
    openModal('<div class="row between" style="margin-bottom:6px"><h2 style="font-size:18px;display:flex;align-items:center;gap:8px">' + ico('ban') + ' ยกเลิกการติดต่อ' + (items.length === 1 ? ' : ' + esc(items[0].name || 'ลูกค้า') : ' ' + N(items.length) + ' ราย') + '</h2><button class="icon-btn" data-act="close-modal" aria-label="ปิด">' + ico('x') + '</button></div>' +
      '<div class="dnc-warn">' + ico('ban') + '<span>รายชื่อจะย้ายไปเมนู <b>ยกเลิกการติดต่อถาวร</b> นัดทั้งหมดจะถูกปิด และไม่ขึ้นในคิวโทรอีก (กู้คืนได้ภายหลัง)</span></div>' +
      '<label class="field" style="margin-top:14px"><span>เหตุผล <em>*</em></span><select class="in" name="dncr"><option value="">เลือกเหตุผล</option>' + H.DNC_REASONS.map((r) => '<option>' + esc(r) + '</option>').join('') + '</select></label>' +
      '<div class="row" style="justify-content:flex-end;gap:8px;margin-top:16px"><button class="btn" data-act="close-modal">ยกเลิก</button><button class="btn danger-solid" data-dnc-go>' + ico('ban') + ' ยืนยันยกเลิกการติดต่อ</button></div>');
    $('select[name=dncr]', modal).onchange = (e) => e.target.classList.remove('err');
    $('[data-dnc-go]', modal).onclick = () => { const sel = $('select[name=dncr]', modal), r = sel.value; if (!r) { sel.focus(); sel.classList.add('err'); toast('เลือกเหตุผลก่อน', true); return; } closeModal();
      run(async () => { const x = await api.act('markDnc', { ids: items.map((c) => c.id), reason: r }); SEL.cust = null; return x; }, (x) => 'ย้ายไปยกเลิกการติดต่อถาวรแล้ว ' + N(x.updated) + ' ราย'); };
  }
  function reasonField(f, result) {
    const box = $('[data-show=lost]', f); if (!box) return;
    const on = result === 'lost' || result === 'dnc'; box.hidden = !on; if (!on) return;
    const sel = f.lostReason, list = result === 'dnc' ? H.DNC_REASONS : H.LOST_REASONS;
    if (sel.dataset.kind !== result) { sel.innerHTML = '<option value="">เลือกเหตุผล</option>' + list.map((r) => '<option>' + esc(r) + '</option>').join(''); sel.dataset.kind = result; }
    const lab = $('[data-reason-label]', box); if (lab) lab.innerHTML = (result === 'dnc' ? 'เหตุผลที่ยกเลิกการติดต่อถาวร' : 'เหตุผลที่ปฏิเสธ') + ' <em>*</em>';
    const w = $('[data-dnc-warn]', box); if (w) w.hidden = result !== 'dnc';
    if (result === 'dnc') { f.nd.value = ''; f.np.value = ''; }
  }
  // ------------------------------------------------------------ DO-NOT-CONTACT list
  function pageDnc() {
    const v = V(), st = S.full || v;
    let list = (v.customers || []).filter((c) => c.status === 'dnc' && (boss() || c.owner === S.me.id));
    const q = (ui.dncQ || '').trim().toLowerCase();
    if (q) list = list.filter((c) => (c.name || '').toLowerCase().includes(q) || (c.phone || '').includes(q.replace(/\D/g, '') || '###'));
    list.sort((a, b) => Date.parse((b.dnc || {}).at || b.updatedAt || 0) - Date.parse((a.dnc || {}).at || a.updatedAt || 0));
    const total = (v.customers || []).filter((c) => c.status === 'dnc' && (boss() || c.owner === S.me.id)).length;
    xReg('dnc', 'ยกเลิกการติดต่อถาวร', list, (c) => c.id, [['ชื่อ', (c) => c.name], ['เบอร์', (c) => H.fmtPhone(c.phone)], ['เหตุผล', (c) => (c.dnc || {}).reason], ['ยกเลิกโดย', (c) => uname((c.dnc || {}).by)], ['วันที่', (c) => ((c.dnc || {}).at ? H.thDate(c.dnc.at, true) : '')], ['ผู้ดูแล', (c) => uname(c.owner)], ['ยอดซื้อสะสม', (c) => H.customerTotal(c)]]);
    const row = (c) => { const d = c.dnc || {}; return '<article class="dnc-card"><div class="ap-who">' + xCk('dnc', c.id) + '<span class="ap-av dnc">' + esc((c.name || '?').trim()[0] || '?') + '</span><div class="ap-id"><b class="link" data-open="' + esc(c.id) + '">' + esc(c.name || 'ลูกค้าไม่ระบุชื่อ') + '</b><small>' + (c.phone ? ico('phone') + ' ' + H.fmtPhone(c.phone) : '<span class="faint">ไม่มีเบอร์</span>') + ' <span class="pill mute">' + (c.channel === 'ecom' ? 'E-Commerce' : 'FB Page') + '</span></small></div></div>' +
      '<div class="dnc-reason"><small>เหตุผล</small><b>' + esc(d.reason || '-') + '</b></div>' +
      '<div class="dnc-meta"><small>ยกเลิกโดย</small><b>' + esc(uname(d.by) || '-') + '</b><small>' + (d.at ? H.thDate(d.at, true) : '') + '</small></div>' +
      (boss() ? '<div class="dnc-meta"><small>ผู้ดูแล</small><b>' + esc(uname(c.owner) || '-') + '</b></div>' : '') +
      '<div class="ap-act"><button class="btn sm" data-open="' + esc(c.id) + '">ดูประวัติ</button><button class="btn sm" data-act="dnc-restore" data-id="' + esc(c.id) + '">' + ico('refresh') + ' กู้คืน</button></div></article>'; };
    const per = 10, page = Math.max(1, Math.min(ui.dncPage || 1, Math.ceil(list.length / per) || 1)), pages = Math.ceil(list.length / per);
    return '<section class="card dnc-main"><div class="ap-bar"><div class="dnc-sum"><span class="ap-ti dnc">' + ico('ban') + '</span><div><b>' + N(total) + ' รายชื่อ</b><small>ไม่อยู่ในคิวโทร ปฏิทิน และรายชื่อลูกค้า</small></div></div>' +
      '<label class="search dnc-search"><span class="s-ico">' + ico('search') + '</span><input class="in" placeholder="ค้นหาชื่อหรือเบอร์" value="' + esc(ui.dncQ || '') + '" data-act-change="dnc-q" aria-label="ค้นหา"></label></div>' +
      (list.length ? xBar('dnc', 'รายชื่อ') + '<div class="ap-list">' + list.slice((page - 1) * per, page * per).map(row).join('') + '</div>' + (pages > 1 ? '<div class="cp-pager"><small class="muted">' + ((page - 1) * per + 1) + '–' + Math.min(page * per, list.length) + ' จาก ' + list.length + '</small><div class="pages">' + Array.from({ length: pages }, (_, i) => '<button class="' + (page === i + 1 ? 'on' : '') + '" data-act="dnc-page" data-v="' + (i + 1) + '">' + (i + 1) + '</button>').join('') + '</div></div>' : '')
        : '<div class="ap-empty"><span>' + ico('ban') + '</span><b>' + (q ? 'ไม่พบรายชื่อที่ค้นหา' : 'ยังไม่มีรายชื่อที่ยกเลิกถาวร') + '</b><small>เมื่อบันทึกผลการโทรเป็น "ยังไม่ซื้อ → ยกเลิกถาวร" รายชื่อจะมาอยู่ที่นี่</small></div>') + '</section>';
  }
  const resultOf = (id) => H.RESULTS.find((x) => x.id === id) || (id === 'oc_talk' ? { id, label: 'โทรออก ได้คุย (OneCall)', group: 'ได้คุย : อัตโนมัติ', tone: 'info' } : null);
  const noTime = (a) => H.thTime(a.at) === '00:00';
  function pageCustomer() {
    const st = S.full || V();
    const c = H.findCustomer(st, ui.custId);
    if (!c) return pageHead('ไม่พบลูกค้า', 'ลูกค้ารายนี้อาจถูกลบหรือย้ายไปให้เซลล์คนอื่น', '<button class="btn" data-go="customers">กลับไปรายชื่อลูกค้า</button>');
    const canEdit = boss() || c.owner === S.me.id;
    const list = LVITEMS.cust && LVITEMS.cust.length ? LVITEMS.cust : custList();
    const idx = list.findIndex((x) => x.id === c.id);
    const owner = c.owner ? user(c.owner) : null;
    const appts = (st.appointments || []).filter((a) => a.customerId === c.id && !a.done).sort((a, b) => Date.parse(a.at) - Date.parse(b.at));
    const a0 = appts[0];
    const lastCall = (c.notes || []).find((n) => n.kind === 'call');
    const o0 = (c.orders || [])[0];
    const code = c.legacyCode || ('EH-' + String(c.id).slice(-6).toUpperCase());
    const tip = (c.notes || []).find((n) => n.kind === 'note');
    const round = c.round || 'T1';
    const top = '<div class="cd-top"><button class="link-plain" data-act="cd-back">' + ico('left') + ' ' + (ui.custBack && ui.custBack !== 'customers' ? 'กลับ' : 'กลับไปรายชื่อลูกค้า') + '</button>' +
      (idx >= 0 ? '<div class="cd-nav small muted">ลูกค้า ' + (idx + 1) + ' จาก ' + N(list.length) + '<button class="icon-btn sm" data-act="cd-step" data-v="-1"' + (idx <= 0 ? ' disabled' : '') + ' aria-label="ก่อนหน้า">' + ico('left') + '</button><button class="icon-btn sm" data-act="cd-step" data-v="1"' + (idx >= list.length - 1 ? ' disabled' : '') + ' aria-label="ถัดไป">' + ico('right') + '</button></div>' : '') + '</div>';
    const head = '<div class="cd-head"><span class="cd-av">' + esc((c.name || '?').replace(/^(คุณ|นาย|นาง|น\.ส\.)\s*/, '').slice(0, 1)) + '</span><div class="cd-id"><div class="row" style="gap:10px"><h1 class="one">' + esc(c.name || 'ไม่ระบุชื่อ') + '</h1>' + statusPill(c.status) +
      '<span class="pill info">' + (c.channel === 'fb' ? 'FB Page : ' + round : esc((H.PLATFORMS[c.platform] || {}).label || 'E-Commerce')) + '</span></div>' +
      '<div class="cd-sub">' + ico('phone') + ' <span class="cd-phone">' + H.fmtPhone(c.phone) + '</span><button class="link-plain" data-act="copy" data-text="' + esc(H.normPhone(c.phone)) + '" title="คัดลอกเบอร์">' + ico('clip') + '</button><span class="faint">' + esc(code) + '</span></div></div>' +
      (canEdit ? '<div class="ph-act"><button class="btn" data-act="cd-assign">' + ico('users') + ' เปลี่ยนผู้ดูแล</button><button class="btn" data-act="cd-edit">' + ico('note') + ' แก้ไขข้อมูล</button><button class="btn" data-act="cd-order">' + ico('plus') + ' เพิ่มคำสั่งซื้อ</button></div>' : '') + '</div>';
    const left = '<div class="cd-col"><section class="card"><h3 class="ct">ข้อมูลลูกค้า</h3><div class="cd-stats"><div><small>ยอดซื้อสะสม</small><b>' + B(H.customerTotal(c)) + '</b></div><div><small>คำสั่งซื้อ</small><b>' + (c.orders || []).length + '</b></div></div>' +
      '<div class="cd-info">' +
      '<div>' + ico('users') + '<div><small>ผู้ดูแลลูกค้า</small><span>' + (owner ? esc(owner.name) : 'ยังไม่มีผู้ดูแล') + '</span></div></div>' +
      '<div>' + ico('pin') + '<div><small>ที่อยู่จัดส่ง</small><span>' + (c.address ? esc(c.address) : '<span class="faint">ยังไม่มีที่อยู่</span>') + '</span></div></div>' +
      '<div>' + ico('phone') + '<div><small>ติดต่อล่าสุด</small><span>' + (c.lastContactAt ? H.thDate(c.lastContactAt, true) : '<span class="faint">ยังไม่เคยโทร</span>') + (lastCall ? '<br>' + (lastCall.round ? lastCall.round + ' : ' : '') + esc(lastCall.text.split(' : ')[0]) : '') + '</span></div></div>' +
      '<div>' + ico('msg') + '<div><small>แหล่งที่มา</small><span>' + (c.channel === 'fb' ? 'FB Page' + (c.page ? ' : ' + esc(c.page) : '') + '<br>เชื่อมต่อผ่าน Pancake' : esc((H.PLATFORMS[c.platform] || {}).label || 'E-Commerce') + '<br>ผ่าน BigSeller') + '</span></div></div></div>' +
      '<div class="cd-foot small muted">รหัสลูกค้า ' + esc(code) + '<br>เป็นลูกค้าตั้งแต่ ' + H.thDate(c.createdAt) + (c.closerName ? '<br>แอดมินที่ปิดการขาย : ' + esc(c.closerName) : '') + '</div></section>' +
      (o0 ? '<section class="card"><h3 class="ct">คำสั่งซื้อล่าสุด</h3><div class="cd-last">' + (o0.items || []).map((i) => '<b>' + esc(i.name.replace(/ \([^)]*\)$/, '')) + ' × ' + i.qty + '</b>').join('') + '<div class="row between"><small class="muted">' + H.thDate(o0.date) + '</small><b>' + B(o0.total) + '</b></div>' +
        '<span class="pill ' + (o0.status === 'cancelled' ? 'bad' : o0.status === 'awaiting_payment' ? 'warn' : 'good') + '" style="justify-self:start">' + (o0.status === 'cancelled' ? 'ยกเลิก' : o0.status === 'awaiting_payment' ? 'รอชำระ' : 'ชำระแล้ว') + '</span></div></section>' : '') +
      (tip ? '<section class="card cd-tip"><h3 class="ct">' + ico('note') + ' ข้อควรรู้ก่อนโทร</h3><p>' + esc(tip.text) + '</p></section>' : '') + '</div>';
    const a0late = a0 && (noTime(a0) ? H.dayKey(a0.at) < H.today() : Date.parse(a0.at) < Date.now() - 3600000);
    const banner = a0 ? '<section class="cd-appt' + (a0late ? ' late' : '') + '"><div class="row between"><b>' + ico('calendar') + ' ' + (H.dayKey(a0.at) === H.today() ? 'นัดวันนี้' : H.thDate(a0.at).replace(/ \d{4}$/, '')) + (noTime(a0) ? '' : ' : ' + H.thTime(a0.at) + ' น.') + (a0late ? ' (เลยกำหนด)' : '') + '</b><span class="rtag">' + esc(a0.round || round) + '</span></div>' +
      '<p>' + esc(a0.purpose) + '</p><div class="row between"><small class="muted">นัดโดย ' + esc(uname(a0.by === 'system' || a0.by === 'import' ? a0.owner : a0.by)) + ' : ' + H.thDate(a0.createdAt) + '</small>' +
      '<a class="btn primary" href="tel:' + esc(H.normPhone(c.phone)) + '" data-act="cd-dial">' + ico('phone') + ' โทร ' + H.fmtPhone(c.phone) + '</a></div></section>'
      : '<section class="cd-appt none"><div class="row between"><b>' + ico('calendar') + ' ยังไม่มีนัด</b></div><p>' + esc(c.channel === 'fb' ? H.ROUNDS[round] : 'แนะนำตัว ถามผลการใช้ ชวนสั่งซ้ำ') + '</p><div class="row" style="justify-content:flex-end"><a class="btn primary" href="tel:' + esc(H.normPhone(c.phone)) + '" data-act="cd-dial">' + ico('phone') + ' โทร ' + H.fmtPhone(c.phone) + '</a></div></section>';
    const pLines = prodLines();
    const prodPick = '<input type="hidden" name="prod"><div class="pp"><div class="rg-opts">' + pLines.map((l, i) => '<label class="rg-o"><input type="radio" name="pline" value="' + i + '" data-act-change="cd-pline"><span>' + esc(l.name) + '</span></label>').join('') +
      '<label class="rg-o"><input type="radio" name="pline" value="other" data-act-change="cd-pline"><span>อื่น ๆ (ระบุเอง)</span></label></div>' +
      pLines.map((l, i) => '<div class="pp-sizes" data-pl="' + i + '" hidden>' + l.items.map((p) => '<label class="rg-o sz"><input type="radio" name="psize" value="' + esc(p.code) + '" data-price="' + p.price + '" data-label="' + esc(p.name) + '" data-act-change="cd-psize"><span>' + esc(l.items.length > 1 || p.size ? (p.size || p.name) : p.name) + ' <b>' + B(p.price) + '</b></span></label>').join('') + '</div>').join('') +
      '<div class="pp-other" data-pl="other" hidden><input class="in" name="prodOther" placeholder="พิมพ์ชื่อสินค้า เช่น สบู่สมุนไพร 2 ก้อน" aria-label="ชื่อสินค้า"></div></div>';
    const nowLocal = localInput(new Date().toISOString());
    const callTab = '<form class="form cd-form" data-form="call2" data-id="' + c.id + '">' +
      (c.channel === 'fb' ? '<div class="cd-goal">' + ico('alert') + '<div><b>' + round + ' : ' + esc(H.ROUNDS[round]) + '</b><small>T1 ต้อนรับ / ยืนยันออเดอร์ : T2 ถามผลการใช้ / อัปเซล : T3 ติดตามซื้อซ้ำ</small></div></div>' : '') +
      '<div class="field"><span>ผลการโทร <em>*</em></span><div class="rs">' + RESULT_STEPS.map((g) => '<label class="rs-card ' + g.tone + '"><input type="radio" name="rstep" value="' + g.id + '" data-act-change="cd-rstep"><span class="rs-ico">' + ico(g.icon) + '</span><span class="rs-txt"><b>' + g.label + '</b><small>' + g.hint + '</small></span></label>').join('') + '</div>' +
        RESULT_STEPS.map((g) => '<div class="rs-sub ' + g.tone + '" data-rs="' + g.id + '" hidden>' + (g.ids.length > 1 ? '<span class="rs-q">' + g.q + '</span>' + (g.id === 'sold' ? '<small class="rs-note">' + ico('checkc') + ' กรอกรายการขายด้านล่าง (สินค้า จำนวน ยอด) แล้วกดบันทึกครั้งเดียว ระบบสร้างคำสั่งซื้อให้อัตโนมัติ</small>' : '') + '<div class="rg-opts">' + g.ids.map((id) => { const r = H.RESULTS.find((x) => x.id === id); return '<label class="rg-o"><input type="radio" name="result" value="' + id + '" data-act-change="cd-result"><span>' + esc(r.short || r.label) + '</span></label>'; }).join('') + '</div>' : '<input type="radio" name="result" value="' + g.ids[0] + '" hidden>') + '</div>').join('') + '</div>' +
      (c.channel === 'fb' ? '<div class="cd-row2"><label class="field"><span>รอบการโทร</span><select class="in" name="round">' + ['T1', 'T2', 'T3'].map((r) => '<option' + (round === r ? ' selected' : '') + '>' + r + '</option>').join('') + '</select></label><div></div></div>' : '') +
      '<div class="field" data-show="lost" hidden><span data-reason-label>เหตุผลที่ปฏิเสธ <em>*</em></span><select class="in" name="lostReason"><option value="">เลือกเหตุผล</option>' + H.LOST_REASONS.map((r) => '<option>' + r + '</option>').join('') + '</select><div class="dnc-warn" data-dnc-warn hidden>' + ico('ban') + '<span>บันทึกแล้วรายชื่อนี้จะย้ายไปเมนู <b>ยกเลิกการติดต่อถาวร</b> นัดทั้งหมดจะถูกปิด และไม่ขึ้นในคิวโทรอีก (กู้คืนได้ภายหลัง)</span></div></div>' +
      '<div class="cd-row2"><label class="field"><span>วันและเวลาที่โทร</span><input class="in" type="datetime-local" name="at" value="' + nowLocal + '" max="' + nowLocal + '"></label>' +
      '<label class="field"><span>ระยะเวลา (นาที:วินาที)</span><input class="in" name="dur" placeholder="OneCall ใส่ให้อัตโนมัติ" inputmode="numeric" id="cd-dur"></label></div>' +
      '<div data-prod-home></div><div class="cd-prod"><div class="row between"><b class="small">รายละเอียดสินค้าที่ขาย / สนใจ</b><small class="muted" data-prod-hint>บันทึกเป็นคำสั่งซื้อเมื่อเลือก "ปิดการขายสำเร็จ" หรือ "รอชำระเงิน"</small></div>' +
      '<div class="field"><span>สินค้า</span>' + prodPick + '</div><div class="cd-prod-row"><div class="field pp-chosen"><span>ที่เลือก</span><div class="in ro" data-pp-label>ยังไม่ได้เลือก</div></div><label class="field"><span>จำนวน</span><input class="in" type="number" min="1" name="qty" value="1" data-cd-calc></label><label class="field"><span>ยอดรวม (บาท)</span><input class="in" type="number" min="0" name="amount" placeholder="0"></label></div></div>' +
      '<label class="field"><span>บันทึกการสนทนา</span><textarea class="in" name="note" rows="3" placeholder="เช่น ลูกค้าใช้มา 5 วัน สนใจสั่งเพิ่ม 1 กล่อง ขอให้โทรยืนยันวันอาทิตย์ช่วงเช้า"></textarea></label>' +
      '<div class="cd-next compact"><div class="cd-next-sum"><span class="cd-next-ico">' + ico('calendar') + '</span><div class="grow"><b>นัดถัดไป</b><div class="small muted" data-next-hint>เลือกผลการโทรแล้ว ระบบจะนัดให้อัตโนมัติตามรอบ T1 → T2 → T3</div></div>' +
      '<button type="button" class="chip" data-act="cd-next-edit">เปลี่ยนวัน</button><button type="button" class="chip" data-act="cd-quick" data-v="0">ไม่ต้องนัด</button></div>' +
      '<div class="cd-next-fields" data-next-fields hidden><div class="quick"><span class="small muted">นัดเร็ว</span>' + [[1, '+1 วัน'], [3, '+3 วัน'], [7, '+7 วัน'], [25, '+25 วัน : T3']].map(([n, l]) => '<button type="button" class="chip" data-act="cd-quick" data-v="' + n + '">' + l + '</button>').join('') + '</div>' +
      '<div class="cd-row2"><label class="field"><span>วันที่นัดหมาย</span><input class="in" type="date" name="nd" min="' + H.today() + '"></label><label class="field"><span>เวลา</span><input class="in" type="time" name="nt" value="10:30"></label></div>' +
      '<label class="field"><span>วัตถุประสงค์</span><input class="in" name="np" placeholder="เช่น ยืนยันคำสั่งซื้อ 1 กล่อง"></label></div></div>' +
      '<div class="cd-submit"><span class="small" style="color:var(--good)">' + ico('checkc') + ' บันทึกครั้งเดียว : นับ KPI และอัปเดตนัดหมายอัตโนมัติ</span><span class="grow"></span><button type="reset" class="btn">ยกเลิก</button><button class="btn primary">' + ico('check') + ' บันทึกการโทร</button></div></form>';
    const apptTab = apptForm(c) + (appts.length ? '<div class="section-t" style="margin-top:14px">นัดที่ยังไม่ได้โทร</div>' + apptList('cdappt', appts, '', true) : '');
    const dncBox = c.status === 'dnc' ? '<section class="dnc-alert">' + ico('ban') + '<div class="grow"><b>ยกเลิกการติดต่อถาวร</b><small>' + esc((c.dnc || {}).reason || '') + ((c.dnc || {}).at ? ' : ' + H.thDate(c.dnc.at, true) + ' โดย ' + esc(uname(c.dnc.by)) : '') + '</small></div>' + (canEdit ? '<button class="btn sm" data-act="dnc-restore" data-id="' + esc(c.id) + '">' + ico('refresh') + ' กู้คืน</button>' : '') + '</section>' : '';
    const mid = '<div class="cd-col">' + dncBox + (c.status === 'dnc' ? '' : banner) + (canEdit ? '<section class="card cd-work"><div class="cd-tabs"><button class="' + (ui.dTab !== 'appt' ? 'on' : '') + '" data-act="dtab" data-v="call">บันทึกการโทร</button><button class="' + (ui.dTab === 'appt' ? 'on' : '') + '" data-act="dtab" data-v="appt">นัดหมาย' + (appts.length ? ' (' + appts.length + ')' : '') + '</button></div>' + (ui.dTab === 'appt' ? apptTab : callTab) + '</section>' : '<section class="card"><div class="empty">ลูกค้ารายนี้อยู่กับ ' + esc(uname(c.owner)) + ' ดูได้อย่างเดียว</div></section>') + '</div>';
    const noise = (n) => /^(status|followup|distribute|note|assign\w*|owner|round)\s*(:|$)/i.test(String(n.text || '').trim()) || !String(n.text || '').trim();
    const allNotes = (c.notes || []).filter((n) => n.kind === 'call' || n.kind === 'sale' || !noise(n));
    if (ui.cdFor !== c.id) { ui.cdFor = c.id; ui.cdOPage = 1; ui.cdNPage = 1; }
    const cdOPg = Math.min(Math.max(1, ui.cdOPage || 1), Math.max(1, Math.ceil((c.orders || []).length / 10)));
    const nPages = Math.max(1, Math.ceil(allNotes.length / 10)), cdNPg = Math.min(Math.max(1, ui.cdNPage || 1), nPages);
    const notes = ui.cdAllNotes ? allNotes.slice((cdNPg - 1) * 10, cdNPg * 10) : allNotes.slice(0, 3);
    const right = '<div class="cd-col"><section class="card"><div class="row between"><h3 class="ct">ประวัติการติดต่อ</h3>' + (allNotes.length > 3 ? '<button class="link-plain small" data-act="cd-notes">' + (ui.cdAllNotes ? 'ย่อ' : 'ดูทั้งหมด (' + allNotes.length + ')') + '</button>' : '') + '</div>' +
      (notes.length ? '<div class="cd-tl">' + notes.map((n) => { const r = n.result ? resultOf(n.result) : null; return '<div class="cd-tli"><span class="b">' + ico(n.kind === 'call' ? 'phone' : n.kind === 'sale' ? 'bag' : n.kind === 'appt' ? 'calendar' : 'note') + '</span><div><small class="muted">' + H.thDate(n.at, true) + '</small><div class="row" style="gap:6px"><b>' + esc(r ? r.label : n.kind === 'sale' ? 'ปิดการขาย' : n.kind === 'appt' ? 'นัดหมาย' : n.kind === 'assign' ? 'มอบหมาย' : 'บันทึก') + '</b>' + (n.round ? '<span class="rtag">' + n.round + '</span>' : '') + '</div>' + (n.text && !noise(n) ? '<p>' + esc(n.text) + '</p>' : '') + '<small class="faint">' + esc(uname(n.by)) + (n.durationSec ? ' : ' + H.hms(n.durationSec).replace(/^00:/, '') + ' นาที' : '') + '</small></div></div>'; }).join('') + '</div>' + (ui.cdAllNotes && allNotes.length > 10 ? pagerHtml('cd-npage', cdNPg, nPages, allNotes.length, 10, 'รายการ') : '') : '<div class="empty">ยังไม่มีประวัติ</div>') +
      (canEdit ? '<form class="row" data-form="note" style="flex-wrap:nowrap;margin-top:10px"><input class="in" name="text" placeholder="เพิ่มโน้ตสั้น ๆ" aria-label="โน้ต"><button class="btn sm">บันทึก</button></form>' : '') + '</section>' +
      shipCard(c) + '<section class="card"><div class="row between"><h3 class="ct">ประวัติคำสั่งซื้อ</h3><span class="small" style="color:var(--accent)">' + (c.orders || []).length + ' รายการ</span></div>' +
      ((c.orders || []).length ? '<div class="cd-orders">' + c.orders.slice((cdOPg - 1) * 10, cdOPg * 10).map((o) => '<div class="cd-ord"><div class="row between"><span class="cd-oid">' + esc(o.extId ? o.extId.replace(/^pc:/, 'PC-').replace(/^legacy:/, '').slice(0, 18) : 'EH-' + String(o.id).slice(-6).toUpperCase()) + '</span><small class="muted">' + H.thDate(o.date) + '</small></div>' +
        '<div class="row between"><span class="one">' + esc((o.items || []).map((i) => i.name.replace(/ \([^)]*\)$/, '') + ' × ' + i.qty).join(', ') || 'คำสั่งซื้อ') + '</span><b>' + B(o.total) + '</b></div><small style="color:var(--good)">' + (o.status === 'cancelled' ? 'ยกเลิก' : o.status === 'awaiting_payment' ? 'รอชำระ' : 'สำเร็จ') + ' : ' + esc(srcLabel[o.source] || o.source) + (o.platform && o.platform !== 'evolution' ? ' : ' + esc((H.PLATFORMS[o.platform] || {}).label || o.platform) : '') + '</small>' + (o.ship ? shipLine(o.ship) : '') + '</div>').join('') + '</div>' +
        (c.orders.length > 10 ? pagerHtml('cd-opage', cdOPg, Math.ceil(c.orders.length / 10), c.orders.length, 10, 'คำสั่งซื้อ') : '') +
        '<div class="row between cd-sum"><span class="muted">ยอดซื้อรวม</span><b>' + B(H.customerTotal(c)) + '</b></div>' : '<div class="empty">ยังไม่มีคำสั่งซื้อ</div>') + '</section></div>';
    return top + head + '<div class="cd-grid">' + left + mid + right + '</div>';
  }

  const SHIP_TONE = { new: 'mute', wait: 'warn', pack: 'mute', ship: 'info', done: 'good', back: 'bad', cancel: 'mute' };
  function shipLine(sh) {
    return '<div class="ship-l"><span class="pill ' + (SHIP_TONE[sh.code] || 'info') + '">' + ico('send') + ' ' + esc(sh.label) + '</span>' +
      (sh.tracking ? '<span class="ship-tn"><small class="muted">' + esc(sh.carrier || 'เลขพัสดุ') + '</small><b>' + esc(sh.tracking) + '</b><button class="link-plain small" data-act="copy" data-v="' + esc(sh.tracking) + '">คัดลอก</button></span>' : '') +
      (sh.link ? '<a class="link-plain small" href="' + esc(sh.link) + '" target="_blank" rel="noopener">ติดตามพัสดุ ›</a>' : '') + '</div>';
  }
  // latest shipment on top of the customer page so telesales can answer "where is my parcel?" at a glance
  function shipCard(c) {
    const o = (c.orders || []).find((x) => x.ship && x.status !== 'cancelled'); if (!o) return '';
    const sh = o.ship, steps = [['pack', 'เตรียมส่ง'], ['ship', 'กำลังจัดส่ง'], ['done', 'ส่งถึงแล้ว']];
    const at = { new: 0, wait: 0, pack: 0, ship: 1, done: 2 }[sh.code];
    return '<section class="card ship-card"><div class="row between"><h3 class="ct">' + ico('send') + ' สถานะพัสดุล่าสุด</h3><small class="muted">ออเดอร์ ' + H.thDate(o.date) + '</small></div>' +
      (at != null ? '<div class="ship-steps">' + steps.map((x, i) => '<span class="' + (i < at ? 'done' : i === at ? 'on' : '') + '"><i></i>' + x[1] + '</span>').join('') + '</div>' : '<div class="ship-alert pill ' + SHIP_TONE[sh.code] + '">' + esc(sh.label) + '</div>') +
      '<dl class="kv ship-kv"><dt>สถานะ</dt><dd><b>' + esc(sh.label) + '</b>' + (sh.at ? ' <small class="muted">อัปเดต ' + H.thDate(sh.at, true) + '</small>' : '') + '</dd>' +
      '<dt>ขนส่ง</dt><dd>' + esc(sh.carrier || '-') + '</dd><dt>เลขพัสดุ</dt><dd>' + (sh.tracking ? '<b>' + esc(sh.tracking) + '</b> <button class="link-plain small" data-act="copy" data-v="' + esc(sh.tracking) + '">คัดลอก</button>' : '<span class="faint">ยังไม่มีเลขพัสดุ</span>') + '</dd></dl>' +
      (sh.link ? '<a class="btn sm" href="' + esc(sh.link) + '" target="_blank" rel="noopener">' + ico('right') + ' เปิดหน้าติดตามพัสดุ</a>' : '') + '</section>';
  }
  // ------------------------------------------------------------ HELP CENTER: tutorial videos + short guides (KPI logging is intentionally not taught)
  const HELP_VIDEOS = [
    { id: 'telesales', role: 'tele', t: 'สอนใช้งานสำหรับเทเลเซลล์', d: 'ตั้งแต่เข้าสู่ระบบ หน้าลูกค้าของฉัน บันทึกผลการโทร นัดหมาย ปฏิทิน รายชื่อใหม่ ยกเลิกการติดต่อ สถานะพัสดุ และส่งออก Excel', len: '' },
    { id: 'executive', role: 'boss', t: 'สอนใช้งานสำหรับผู้บริหาร', d: 'ภาพรวมทั้งหมด เทเลเซลล์ แอดมิน รายการขาย อัตรายกเลิก/ตีกลับ ลูกค้าซื้อซ้ำ รายชื่อลูกค้า ช่องทาง E-Commerce ตัวช่วย BigSeller และส่งออก Excel', len: '' },
  ];
  const HELP = [
    { id: 'login', role: 'all', t: 'เข้าสู่ระบบ', s: ['กด เข้าสู่ระบบ มุมขวาบน', 'เลือกชื่อของตัวเอง', 'ใส่รหัสผ่านของตัวเอง (รหัสของใครของคนนั้น) แล้วกด เข้าสู่ระบบ', 'จะออกจากระบบ กดชื่อมุมขวาบน แล้วเลือก ออกจากระบบ'] },
    { id: 'cust', role: 'tele', t: 'หน้าลูกค้าของฉัน', s: ['แท็บด้านบนแยก FB Page และ E-Commerce', 'แถบ ทั้งหมด / มาใหม่วันนี้ / นัดวันนี้ / เลยกำหนด ใช้กรองงาน ควรโทร มาใหม่วันนี้ และ เลยกำหนด ก่อน', 'ช่องค้นหาพิมพ์ชื่อ เบอร์ สินค้า หรือที่อยู่ได้', 'ตัวกรองด้านล่าง: สถานะ, รอบ T1/T2/T3 (FB) หรือ ช่องทาง Lazada/Shopee/TikTok (E-Commerce)', 'กดชื่อลูกค้าเพื่อเปิดหน้ารายละเอียด'] },
    { id: 'call', role: 'tele', t: 'บันทึกผลการโทร', s: ['เปิดหน้าลูกค้า ที่การ์ด บันทึกการโทร เลือกผล 1 ใน 3: ขายได้ / ยังไม่ซื้อ / ติดต่อไม่ได้', 'ขายได้: เลือกชำระแล้วหรือรอชำระ → เลือกสินค้าและขนาดแพ็ก (ไม่มีในรายการกด อื่น ๆ) ระบบคิดยอดให้ และสร้างคำสั่งซื้อให้อัตโนมัติ', 'ยังไม่ซื้อ: เลือกคำตอบของลูกค้า ถ้าไม่ต้องการให้โทรอีกเลือก ยกเลิกถาวร แล้วเลือกเหตุผล', 'ติดต่อไม่ได้: ระบบนัดโทรซ้ำให้เอง', 'นัดถัดไประบบตั้งให้ตามรอบ กด เปลี่ยนวัน ถ้าอยากเปลี่ยน แล้วกด บันทึกการโทร'] },
    { id: 'appt', role: 'tele', t: 'นัดหมายและปฏิทิน', s: ['นัดเอง: หน้าลูกค้า → แท็บ นัดหมาย → เลือกวันเวลา ใส่เรื่องที่นัด → บันทึกนัด', 'เมนู ปฏิทินนัดหมาย แสดงนัดทั้งเดือน กดวันที่เพื่อดูรายการด้านขวา', 'แถบด้านบนเตือนนัดที่เลยกำหนด กดเพื่อดูทั้งหมด', 'ในรายการนัดกด บันทึกการโทร หรือ เลื่อน ได้เลย'] },
    { id: 'leads', role: 'tele', t: 'รายชื่อใหม่ที่ระบบแจก', s: ['แอดมินปิดการขายบน FB Page แล้ว ระบบแจกให้เทเลเซลล์เท่า ๆ กันอัตโนมัติ ไม่ต้องกดรับ', 'ลูกค้า E-Commerce ใหม่ก็แจกให้เท่า ๆ กันเช่นกัน', 'ดูได้ที่เมนู รายชื่อใหม่ และแท็บ มาใหม่วันนี้ ในหน้าลูกค้า', 'ทุกรายชื่อมีนัดโทรต้อนรับ T1 ให้แล้ว'] },
    { id: 'owner', role: 'all', t: 'เปลี่ยนผู้ดูแลลูกค้า', s: ['หน้ารายชื่อ กดปุ่ม ⋯ ท้ายแถว → เปลี่ยนผู้ดูแล', 'หรือในหน้าลูกค้า กด เปลี่ยนผู้ดูแล', 'นัดที่ยังไม่ได้โทรจะย้ายไปให้คนใหม่ด้วย'] },
    { id: 'dnc', role: 'all', t: 'ยกเลิกการติดต่อถาวร และกู้คืน', s: ['หน้ารายชื่อ กด ⋯ → ยกเลิกการติดต่อ แล้วเลือกเหตุผล', 'รายชื่อจะย้ายไปเมนู ยกเลิกการติดต่อถาวร และไม่มีนัดค้าง', 'ถ้ายกเลิกผิด เข้าเมนูนั้นแล้วกด กู้คืน'] },
    { id: 'ship', role: 'all', t: 'สถานะพัสดุและเลขพัสดุ', s: ['หน้าลูกค้ามีการ์ด สถานะพัสดุล่าสุด: เตรียมส่ง → กำลังจัดส่ง → ส่งถึงแล้ว', 'แสดงชื่อขนส่งและเลขพัสดุ กด คัดลอก เพื่อส่งให้ลูกค้า หรือกด เปิดหน้าติดตามพัสดุ', 'ประวัติคำสั่งซื้อแสดงสถานะของทุกออเดอร์ รวมถึงตีกลับหรือยกเลิก', 'ข้อมูลมาจาก Pancake ทุก 3 นาที และจาก BigSeller สำหรับ E-Commerce'] },
    { id: 'excel', role: 'all', t: 'ส่งออก Excel', s: ['ทุกรายการมีแถบ ส่งออก Excel ด้านบน', 'ติ๊กเลือกทีละรายการ หรือติ๊ก เลือกทั้งหมด', 'กด ส่งออก Excel: ถ้าไม่ได้เลือกอะไร จะส่งออกทั้งหมดตามตัวกรองที่ใช้อยู่'] },
    { id: 'page10', role: 'all', t: 'การแบ่งหน้า', s: ['ทุกรายการแสดงหน้าละ 10 รายการ', 'กดเลขหน้า 1 2 3 ด้านล่างเพื่อไปหน้าถัดไป'] },
    { id: 'teamov', role: 'tele', t: 'ภาพรวมทีม และรายการขายของฉัน', s: ['เมนู ภาพรวมทีม ดูยอดขายและผลงานของทีม', 'เลือกช่วงวันที่ได้จากปุ่มด้านบน (วันนี้ / 7 วัน / เดือนนี้ ...)', 'เลื่อนลงล่างสุดเพื่อดู รายการขายของฉัน ทีละออเดอร์'] },
    { id: 'ov', role: 'boss', t: 'ภาพรวมทั้งหมด', s: ['ยอดรวม Telesales + Admin, เทียบเป้าเดือน', 'กราฟวงกลมสัดส่วนทีมและสินค้า, กราฟเส้นยอดรายวัน, เทียบทีมตามวันในสัปดาห์', 'การ์ด ต้องติดตาม: นัดเลยกำหนด ลูกค้าเงียบ และลูกค้า E-Commerce แยกช่องทาง', 'เลือกช่วงวันที่ได้จากปุ่มด้านบน'] },
    { id: 'ovtele', role: 'boss', t: 'ภาพรวมเทเลเซลล์', s: ['ตาราง KPI รายคนเทียบเป้า (✓ ครบ เมื่อถึงเป้า)', 'Funnel การโทร และช่วงเวลาที่ขายดี', 'รายการขายของเทเลเซลล์ทีละออเดอร์ เลือกดูทีละคนได้'] },
    { id: 'ovadmin', role: 'boss', t: 'ภาพรวมแอดมิน', s: ['อันดับแอดมินตามยอดปิดการขาย', 'อัตรายกเลิกและตีกลับ แยกตามแอดมินหรือเพจ (สีแดง = สูงกว่าค่าเฉลี่ยชัดเจน)', 'เพจที่ได้ลูกค้าซื้อซ้ำ: เพจไหนให้ลูกค้าคุณภาพที่สุด', 'รายการขายแอดมินแบบละเอียด ค้นหา กรองแอดมิน/เพจ ได้'] },
    { id: 'custtree', role: 'boss', t: 'รายชื่อลูกค้า', s: ['รายชื่อลูกค้าทั้งหมด: ดูได้ทุกคน กรองผู้ดูแลได้', 'รายชื่อลูกค้าที่ถูกแจก: ใครได้รายชื่อไหน วันนี้หรือ 7 วันล่าสุด', 'รายชื่อลูกค้าที่ยกเลิกการติดต่อ: พร้อมเหตุผลและกู้คืนได้'] },
    { id: 'bigseller', role: 'boss', t: 'ตัวช่วย BigSeller (แยก Lazada / Shopee / TikTok)', s: ['ตั้งค่า → การเชื่อมต่อระบบ → BigSeller → ติดตั้งตัวช่วย แล้วกด Install ใน Tampermonkey (ทำครั้งเดียว)', 'เปิดหน้าออเดอร์ BigSeller ไว้ จะมีป้าย Evolution Hub มุมขวาล่างบอกจำนวนที่ส่งแล้ว', 'ระบบระบุช่องทาง เลขพัสดุ และแจกลูกค้าใหม่ให้เอง'] },
    { id: 'conn', role: 'boss', t: 'การเชื่อมต่อระบบ', s: ['ตั้งค่า → การเชื่อมต่อระบบ ดูสถานะ Pancake, OneCall, E-Commerce และ BigSeller', 'กด ดึงตอนนี้ เพื่อดึงข้อมูลทันที'] },
  ];
  function pageHelp() {
    const isBoss = boss(), mine = (r) => r === 'all' || (isBoss ? r === 'boss' : r === 'tele') || (isBoss && r === 'tele');
    const vids = HELP_VIDEOS.filter((v) => (isBoss ? true : v.role === 'tele')).sort((a, b) => (isBoss ? (a.role === 'boss' ? -1 : 1) : 0));
    const q = (ui.helpQ || '').trim().toLowerCase();
    const topics = HELP.filter((h) => mine(h.role) && (!q || (h.t + ' ' + h.s.join(' ')).toLowerCase().includes(q)));
    const vcard = (v) => '<article class="hv-card"><div class="hv-media">' + (DEMO ? '<div class="hv-demo">' + ico('play') + '<small>เปิดดูวิดีโอได้ในระบบจริง</small></div>' : '<video controls preload="metadata" playsinline poster="/help/' + v.id + '.jpg" src="/help/' + v.id + '.mp4"></video>') + '</div>' +
      '<div class="hv-b"><span class="pill ' + (v.role === 'boss' ? 'info' : 'good') + '">' + (v.role === 'boss' ? 'ผู้บริหาร' : 'เทเลเซลล์') + '</span><h3>' + v.t + '</h3><p>' + v.d + '</p></div></article>';
    const topic = (h) => { const open = ui.helpOpen === h.id || !!q; return '<div class="hg' + (open ? ' open' : '') + '"><button class="hg-h" data-act="help-open" data-v="' + h.id + '"><span>' + esc(h.t) + '</span>' + ico('down') + '</button>' + (open ? '<ol class="hg-s">' + h.s.map((x) => '<li>' + esc(x) + '</li>').join('') + '</ol>' : '') + '</div>'; };
    const [rows, pager] = pg10('help', topics, 'หัวข้อ');
    return '<section class="banner hv-banner"><div class="grow"><h1>คู่มือการใช้งาน</h1><p>วิดีโอสอนใช้งานและคู่มือทีละขั้นตอนทุกเมนู ดูซ้ำได้ตลอด</p></div><span class="hv-ico">' + ico('help') + '</span></section>' +
      '<div class="section-t" style="margin:18px 0 10px">วิดีโอสอนใช้งาน</div><div class="hv-grid">' + vids.map(vcard).join('') + '</div>' +
      '<section class="card" style="margin-top:18px"><div class="card-h"><span class="card-ico">' + ico('note') + '</span><div class="ttl"><h2>คู่มือทีละขั้นตอน</h2><small>กดหัวข้อเพื่อดูวิธีทำ</small></div></div>' +
      '<label class="search" style="margin-bottom:12px"><span class="s-ico">' + ico('search') + '</span><input class="in" placeholder="ค้นหาวิธีใช้ เช่น นัดหมาย พัสดุ Excel" value="' + esc(ui.helpQ || '') + '" data-act-change="help-q" aria-label="ค้นหาคู่มือ"></label>' +
      (rows.length ? '<div class="hg-list">' + rows.map(topic).join('') + '</div>' + pager : '<div class="empty">ไม่พบหัวข้อที่ค้นหา</div>') + '</section>';
  }
  // ------------------------------------------------------------ CALENDAR (v2: banner, week strip, month grid, day panel)
  const DOW_MON = ['จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.', 'อา.'];
  const DOW_FULL_MON = ['จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์', 'อาทิตย์'];
  const monOf = (d) => H.addDays(d, -((new Date(d + 'T00:00:00Z').getUTCDay() + 6) % 7));
  const CAL_ST = [{ v: 'all', l: 'ทั้งหมด' }, { v: 'open', l: 'รอดำเนินการ' }, { v: 'done', l: 'เสร็จแล้ว' }, { v: 'late', l: 'เลยกำหนด' }];
  function pageCalendar() {
    const v = V(), T = H.today(), now = Date.now();
    if (ui.calV !== 3) { ui.calView = 'month'; ui.calV = 3; remember(); }
    ui.calView = ui.calView || 'month'; ui.calSt = ui.calSt || 'all';
    let appts = (v.appointments || []);
    if (boss() && ui.calOwner !== 'all') appts = appts.filter((a) => a.owner === ui.calOwner);
    if (!boss()) appts = appts.filter((a) => a.owner === S.me.id);
    const isLate = (a) => !a.done && (noTime(a) ? H.dayKey(a.at) < T : Date.parse(a.at) < now - 3600000);
    const pass = (a) => ui.calSt === 'all' || (ui.calSt === 'done' ? a.done : ui.calSt === 'late' ? isLate(a) : !a.done && !isLate(a));
    const shown = appts.filter(pass);
    const byDay = {}; for (const a of shown) { const d = H.dayKey(a.at); (byDay[d] = byDay[d] || []).push(a); }
    Object.values(byDay).forEach((l) => l.sort((a, b) => Date.parse(a.at) - Date.parse(b.at)));
    const allByDay = {}; for (const a of appts) { const d = H.dayKey(a.at); (allByDay[d] = allByDay[d] || []).push(a); }
    const lateAll = appts.filter(isLate).sort((a, b) => Date.parse(a.at) - Date.parse(b.at));
    const lateBefore = lateAll.filter((a) => H.dayKey(a.at) < T).length, lateToday = lateAll.length - lateBefore;
    const cname = (a) => ((H.findCustomer(S.full || v, a.customerId) || {}).name || 'ลูกค้า');
    const first = (s) => String(s).split(' ')[0];
    const chip = (a) => '<button class="ev ' + (a.done ? 'done' : isLate(a) ? 'late' : '') + '" data-act="cal-pick" data-v="' + H.dayKey(a.at) + '" title="' + esc(cname(a) + ' : ' + a.purpose) + '"><span class="one">' + (noTime(a) ? '' : H.thTime(a.at) + ' ') + esc(first(cname(a))) + '</span>' + (a.round ? '<i>' + a.round + '</i>' : '') + '</button>';
    const daySum = (l) => { if (!l || !l.length) return ''; const late = l.filter(isLate).length; return l.every((a) => a.done) ? '<small class="ok">เสร็จแล้วทั้งหมด</small>' : late ? '<small class="bad">เลยกำหนด ' + late + ' นัด</small>' : ''; };
    const tele = H.teles(S.full || v);
    const banner = lateAll.length ? '<div class="cal-banner"><span class="cb-ico">' + ico('clock') + '</span><b>เลยกำหนด ' + lateAll.length + ' นัดหมาย</b><span class="muted one">จากวันก่อน ' + lateBefore + ' นัด : วันนี้ ' + lateToday + ' นัด : ติดตามหรือเลื่อนนัดเพื่อไม่ให้พลาดลูกค้า</span><span class="grow"></span><button class="link-plain" data-act="cal-late">ดูนัดที่เลยกำหนด ' + ico('right') + '</button></div>' : '';
    // week strip (kept from the previous version)
    const wk0 = monOf(ui.calDay);
    const info = (d) => { const l = allByDay[d] || []; return { n: l.length, open: l.filter((a) => !a.done).length, late: l.filter(isLate).length }; };
    const strip = '<div class="wk">' + Array.from({ length: 7 }, (_, i) => { const d = H.addDays(wk0, i), x = new Date(d + 'T00:00:00Z'), f = info(d);
      return '<button class="wk-day' + (d === ui.calDay ? ' sel' : '') + (d === T ? ' today' : '') + '" data-act="cal-pick" data-v="' + d + '"><span class="wk-dow">' + DOW_MON[i] + '</span><b>' + x.getUTCDate() + '</b><span class="wk-n ' + (f.late ? 'late' : f.open ? 'open' : f.n ? 'done' : 'none') + '">' + (f.n ? (f.open ? f.open + ' นัด' : 'โทรครบ') : '-') + '</span></button>'; }).join('') + '</div>';
    // grid
    let grid = '';
    const [y, m] = ui.calMonth.split('-').map(Number);
    if (ui.calView === 'month') {
      const start = monOf(ui.calMonth + '-01');
      grid = '<div class="cm">' + DOW_FULL_MON.map((d) => '<div class="cm-h">' + d + '</div>').join('');
      for (let i = 0; i < 42; i++) {
        const d = H.addDays(start, i); if (i >= 35 && d.slice(0, 7) !== ui.calMonth) break;
        const l = byDay[d] || [];
        grid += '<div class="cm-d' + (d.slice(0, 7) !== ui.calMonth ? ' out' : '') + (d === ui.calDay ? ' sel' : '') + (d === T ? ' today' : '') + '" data-act="cal-pick" data-v="' + d + '"><div class="cm-n"><span>' + Number(d.slice(8)) + '</span>' + (d === T ? '<small>วันนี้</small>' : '') + '</div>' +
          l.slice(0, 2).map(chip).join('') + (l.length > 2 ? '<small class="more">+ อีก ' + (l.length - 2) + ' นัด</small>' : daySum(l)) + '</div>';
      }
      grid += '</div>';
    } else if (ui.calView === 'week') {
      grid = '<div class="cw">' + Array.from({ length: 7 }, (_, i) => { const d = H.addDays(wk0, i), l = byDay[d] || []; return '<div class="cw-col' + (d === ui.calDay ? ' sel' : '') + '" data-act="cal-pick" data-v="' + d + '"><div class="cm-h">' + DOW_FULL_MON[i] + ' ' + Number(d.slice(8)) + '</div>' + (l.length ? l.slice(0, 8).map(chip).join('') + (l.length > 8 ? '<small class="more">+ อีก ' + (l.length - 8) + ' นัด</small>' : daySum(l)) : '<small class="faint">ไม่มีนัด</small>') + '</div>'; }).join('') + '</div>';
    } else {
      grid = '<div class="cday">' + dayPanelBody((byDay[ui.calDay] || []), isLate, cname) + '</div>';
    }
    const title = ui.calView === 'week' ? H.thDate(wk0).replace(/ \d{4}$/, '') + ' - ' + H.thDate(H.addDays(wk0, 6)) : ui.calView === 'day' ? longDay(ui.calDay) : TH_MON_FULL[m - 1] + ' ' + (y + 543);
    const ownerOpts = [{ v: 'all', l: 'ทุกคน' }].concat(tele.map((u) => ({ v: u.id, l: u.name })));
    const left = '<section class="card cal-main"><div class="cal-bar"><div class="row" style="gap:8px"><h2>' + title + '</h2><button class="icon-btn sm" data-act="cal-nav" data-v="-1" aria-label="ก่อนหน้า">' + ico('left') + '</button><button class="icon-btn sm" data-act="cal-nav" data-v="1" aria-label="ถัดไป">' + ico('right') + '</button><button class="btn sm" data-act="cal-today">วันนี้</button></div>' +
      '<div class="seg">' + [['month', 'เดือน'], ['week', 'สัปดาห์'], ['day', 'วัน']].map(([k, l]) => '<button class="' + (ui.calView === k ? 'on' : '') + '" data-act="cal-view" data-v="' + k + '">' + l + '</button>').join('') + '</div></div>' +
      '<div class="flt"><span class="flt-ico">' + ico('gear') + '</span>' + (boss() ? ddBtn('calowner', { label: 'ผู้ดูแล', options: ownerOpts, value: ui.calOwner, onPick: (x) => { ui.calOwner = x; render(); } }) : '') +
      ddBtn('calst', { label: 'สถานะ', options: CAL_ST, value: ui.calSt, onPick: (x) => { ui.calSt = x; render(); } }) + '<span class="grow"></span><span class="small muted hide-sm">' + (boss() ? 'มุมมองผู้จัดการ' : 'มุมมองเซลล์') + '</span></div>' +
      strip + grid + '<div class="legend cal-legend"><span><i style="background:var(--info)"></i>รอดำเนินการ</span><span><i style="background:var(--good)"></i>เสร็จแล้ว</span><span><i style="background:var(--bad)"></i>เลยกำหนด</span><span class="grow"></span><span class="faint">เลือกวันที่เพื่อดูนัดหมาย</span></div></section>';
    // right panel
    let panel;
    if (ui.calPanel === 'late') {
      panel = '<aside class="card cal-panel"><div class="cp-h"><div><h3>นัดที่เลยกำหนด</h3><small class="muted">' + lateAll.length + ' นัดหมาย : เรียงจากเก่าสุด</small></div><button class="link-plain small" data-act="cal-panel-day">กลับไปวันที่เลือก</button></div>' + dayPanelBody(lateAll, isLate, cname, true) + '</aside>';
    } else {
      const l = byDay[ui.calDay] || [], all = allByDay[ui.calDay] || [];
      const dx = new Date(ui.calDay + 'T00:00:00Z');
      panel = '<aside class="card cal-panel"><div class="cp-h"><div><h3>' + TH_DAYS_FULL[dx.getUTCDay()] + ' ' + dx.getUTCDate() + ' ' + TH_MON_FULL[dx.getUTCMonth()] + '</h3><small class="muted">' + all.length + ' นัดหมาย : เสร็จแล้ว ' + all.filter((a) => a.done).length + ' : เลยกำหนด ' + all.filter(isLate).length + '</small></div>' + (ui.calDay === T ? '<span class="pill info">วันนี้</span>' : '') + '</div>' +
        dayPanelBody(l, isLate, cname) + '<div class="cp-foot small muted">T1 ต้อนรับ / ยืนยันออเดอร์ : T2 ผลการใช้ / ซื้อเพิ่ม : T3 ติดตามซื้อซ้ำ</div></aside>';
    }
    return pageHead('ปฏิทินนัดโทรลูกค้า', 'วางแผนการโทร ติดตามนัดหมาย และดูตารางงานของทีมได้จากที่เดียว', '<button class="btn primary" data-act="new-appt">' + ico('plus') + ' เพิ่มนัดหมาย</button>') +
      banner + '<div class="cal-grid">' + left + panel + '</div>';
  }
  function dayPanelBody(list, isLate, cname, showDate) {
    if (!list.length) return '<div class="empty">ไม่มีนัดหมาย</div>';
    const nextOpen = list.find((a) => !a.done && !isLate(a));
    const page = ls('calpanel');
    const per = 10, pages = Math.ceil(list.length / per); if (page.page > pages) page.page = 1;
    const slice = list.slice((page.page - 1) * per, page.page * per);
    xReg('cal', 'นัดหมาย', list, (a) => a.id, apptCols());
    return xBar('cal', 'นัด') + '<div class="cp-list">' + slice.map((a) => {
      const c = H.findCustomer(S.full || V(), a.customerId) || {};
      const st = a.done ? ['good', 'เสร็จแล้ว'] : isLate(a) ? ['bad', 'เลยกำหนด'] : a === nextOpen ? ['info', 'นัดถัดไป'] : ['mute', 'รอดำเนินการ'];
      const u = user(a.owner);
      return '<div class="cp-item' + (a === nextOpen ? ' next' : '') + '"><div class="row between"><b class="cp-time ' + st[0] + '">' + ico(a.done ? 'checkc' : 'clock') + ' ' + (noTime(a) ? 'ไม่ระบุเวลา' : H.thTime(a.at) + ' น.') + (showDate ? ' <small>' + H.thDate(a.at).replace(/ \d{4}$/, '') + '</small>' : '') + '</b><span class="pill ' + st[0] + '">' + st[1] + '</span></div>' +
        '<div class="row between"><span class="cp-nm">' + xCk('cal', a.id) + '<b class="cp-name one link" data-open="' + esc(c.id || '') + '">' + esc(c.name || 'ลูกค้า') + '</b></span>' + (a.round ? '<span class="rtag">' + a.round + '</span>' : '') + '</div>' +
        '<div class="small muted one">' + esc(a.purpose) + '</div>' +
        '<div class="row between"><span class="who small"><span class="mini">' + esc((u || {}).initial || '') + '</span>ผู้ดูแล : ' + esc(uname(a.owner)) + '</span>' +
        (a.done ? '<small class="faint">โทรแล้ว ' + (a.doneAt ? H.thTime(a.doneAt) : '') + '</small>' : '<span class="row" style="gap:4px"><button class="link-plain small" data-open="' + esc(c.id || '') + '" data-tab="call">บันทึกการโทร →</button><button class="dots" data-act="appt-menu" data-id="' + a.id + '" aria-label="เมนูนัดหมาย">⋯</button></span>') + '</div></div>';
    }).join('') + '</div>' + (pages > 1 ? '<div class="cp-pager"><small class="muted">' + ((page.page - 1) * per + 1) + '–' + Math.min(page.page * per, list.length) + ' จาก ' + list.length + ' นัด</small><div class="pages"><button data-act="cp-page" data-v="' + Math.max(1, page.page - 1) + '"' + (page.page === 1 ? ' disabled' : '') + ' aria-label="ก่อนหน้า">‹</button>' + Array.from({ length: pages }, (_, i) => i + 1).filter((n) => pages <= 7 || n === 1 || n === pages || Math.abs(n - page.page) <= 1).map((n, i, a) => (i && n - a[i - 1] > 1 ? '<span class="faint">…</span>' : '') + '<button class="' + (page.page === n ? 'on' : '') + '" data-act="cp-page" data-v="' + n + '">' + n + '</button>').join('') + '<button data-act="cp-page" data-v="' + Math.min(pages, page.page + 1) + '"' + (page.page === pages ? ' disabled' : '') + ' aria-label="ถัดไป">›</button></div></div>' : '');
  }
  const apptCols = () => [['วันที่', (a) => H.thDate(a.at)], ['เวลา', (a) => (noTime(a) ? 'ไม่ระบุ' : H.thTime(a.at))], ['ลูกค้า', (a) => (H.findCustomer(S.full || V(), a.customerId) || {}).name], ['เบอร์', (a) => H.fmtPhone((H.findCustomer(S.full || V(), a.customerId) || {}).phone || '')], ['รอบ', (a) => a.round], ['เรื่อง', (a) => a.purpose], ['ผู้ดูแล', (a) => uname(a.owner)], ['สถานะ', (a) => (a.done ? 'โทรแล้ว' : Date.parse(a.at) < Date.now() - 3600000 ? 'เลยกำหนด' : 'รอโทร')]];
  function apptList(key, list, emptyMsg, showDate) {
    return listView({
      key, items: list, id: (a) => a.id, rows: true, empty: emptyState(emptyMsg || 'ไม่มีนัด'), unit: 'นัด',
      xl: { name: 'นัดหมาย', cols: apptCols() },
      actions: [{ act: 'appt-done-sel', label: 'โทรแล้ว', icon: 'check' }, { act: 'appt-shift-sel', label: 'เลื่อน +1 วัน' }, { act: 'appt-del-sel', label: 'ลบ', icon: 'x', danger: true }],
      card: (a) => '<div class="ap-time"><b>' + H.thTime(a.at) + '</b>' + (showDate ? '<small>' + H.thDate(a.at).replace(/ \d{4}$/, '') + '</small>' : '') + '</div><div class="ap-main"><div class="ap-why one">' + roundTag(a.round) + ' ' + esc(a.purpose) + '</div></div>' +
        '<div class="ap-act"><button class="btn sm good" data-act="appt-done" data-id="' + a.id + '" aria-label="โทรแล้ว">' + ico('check') + '</button><button class="btn sm" data-act="appt-shift" data-id="' + a.id + '">+1 วัน</button><button class="x" data-act="appt-del-one" data-key="' + key + '" data-id="' + a.id + '" aria-label="ลบนัด">' + ico('x') + '</button></div>',
    });
  }

  // ------------------------------------------------------------ ticket drawer
  function drawerHtml() {
    if (!ui.drawer) return '';
    const st = S.full || V();
    const c = H.findCustomer(st, ui.drawer);
    if (!c) return '';
    const canEdit = boss() || c.owner === S.me.id;
    const total = H.customerTotal(c);
    const tab = (k, l, i) => '<button class="' + (ui.dTab === k ? 'on' : '') + '" data-act="dtab" data-v="' + k + '">' + ico(i) + ' ' + l + '</button>';
    const appts = (st.appointments || []).filter((a) => a.customerId === c.id && !a.done).sort((a, b) => Date.parse(a.at) - Date.parse(b.at));
    let form = '';
    if (canEdit) {
      if (ui.dTab === 'call') form = callForm(c);
      else if (ui.dTab === 'appt') form = apptForm(c);
      else if (ui.dTab === 'order') form = orderForm(c);
      else if (ui.dTab === 'edit') form = editForm(c);
    }
    return '<div class="scrim" data-act="close-drawer"></div><aside class="drawer" role="dialog" aria-label="Ticket ลูกค้า">' +
      '<div class="drawer-h"><div style="flex:1;min-width:0"><div class="row" style="gap:8px;margin-bottom:6px">' + (c.channel === 'fb' ? '<span class="pill info">FB Page</span>' + roundTag(c.round) : '<span class="pill warn">E-Commerce</span>' + platformTag(c.platform)) + statusPill(c.status) + '</div>' +
      '<h2>' + esc(c.name || 'ไม่ระบุชื่อ') + '</h2><div class="row" style="gap:8px;margin-top:4px"><span class="phone-big">' + H.fmtPhone(c.phone) + '</span><button class="copy" data-act="copy" data-text="' + esc(H.normPhone(c.phone)) + '">คัดลอก</button></div></div>' +
      '<button class="icon-btn" data-act="close-drawer" aria-label="ปิด">' + ico('x') + '</button></div>' +
      '<div class="drawer-b">' +
      '<section class="card"><dl class="kv"><dt>ที่อยู่</dt><dd>' + (c.address ? esc(c.address) + ' <button class="copy" data-act="copy" data-text="' + esc(c.address) + '">คัดลอก</button>' : '<span class="faint">ยังไม่มีที่อยู่</span>') + '</dd>' +
      '<dt>เซลล์ผู้ดูแล</dt><dd>' + (c.owner ? esc(uname(c.owner)) : '<span class="pill warn">ยังไม่แจก</span>') + '</dd>' +
      (c.page ? '<dt>เพจ</dt><dd>' + esc(c.page) + '</dd>' : '') + (c.closerName ? '<dt>แอดมินที่ปิด</dt><dd>' + esc(c.closerName) + '</dd>' : '') +
      '<dt>ยอดซื้อรวม</dt><dd><b>' + B(total) + '</b> จาก ' + (c.orders || []).length + ' ออเดอร์</dd>' +
      '<dt>นัดถัดไป</dt><dd>' + (appts.length ? appts.map((a) => H.thDate(a.at, true) + ' : ' + esc(a.purpose)).join('<br>') : '<span class="faint">ไม่มีนัด</span>') + '</dd>' +
      '<dt>โทรไปแล้ว</dt><dd>' + (c.callCount || 0) + ' ครั้ง' + (c.lastContactAt ? ' : ล่าสุด ' + H.thDate(c.lastContactAt, true) : '') + '</dd>' +
      (c.channel === 'fb' && c.round ? '<dt>เป้ารอบ ' + c.round + '</dt><dd class="small muted">' + esc(H.ROUNDS[c.round]) + '</dd>' : '') + '</dl></section>' +
      (canEdit ? '<div class="seg">' + tab('call', 'บันทึกการโทร', 'phone') + tab('appt', 'นัดหมาย', 'calendar') + tab('order', 'เพิ่มออเดอร์', 'bag') + tab('edit', 'แก้ไขข้อมูล', 'note') + '</div>' + '<section class="card">' + form + '</section>' : '<div class="small muted">ลูกค้ารายนี้อยู่กับ ' + esc(uname(c.owner)) + ' ดูได้อย่างเดียว</div>') +
      '<div class="section-t">ประวัติการสั่งซื้อ <span class="small muted">ล่าสุด → เก่าสุด</span></div>' +
      ((c.orders || []).length ? '<div class="orders">' + c.orders.map((o, i) => '<div class="order ' + (i === 0 ? 'latest' : '') + '"><div class="oh"><span>' + (i === 0 ? '<span class="pill info">ล่าสุด</span> ' : '') + H.thDate(o.date, true) + '</span><b>' + B(o.total) + '</b></div>' +
        '<div class="row small muted" style="gap:6px"><span class="tag">' + esc(srcLabel[o.source] || o.source) + '</span>' + (o.platform ? platformTag(o.platform) : '') + (o.status === 'awaiting_payment' ? '<span class="pill warn">รอชำระ</span>' : o.status === 'cancelled' ? '<span class="pill bad">ยกเลิก</span>' : '') + (o.by ? '<span>โดย ' + esc(uname(o.by)) + '</span>' : '') + '</div>' +
        ((o.items || []).length ? '<ul>' + o.items.map((it) => '<li><span>' + esc(it.name) + ' x' + it.qty + '</span><span>' + (it.price ? B(it.price * it.qty) : '') + '</span></li>').join('') + '</ul>' : '') + (o.note ? '<div class="small faint">' + esc(o.note) + '</div>' : '') + '</div>').join('') + '</div>' : '<div class="empty">ยังไม่มีประวัติการสั่งซื้อ</div>') +
      '<div class="section-t">บันทึกการติดต่อ</div>' +
      ((c.notes || []).length ? '<div class="timeline">' + c.notes.slice(0, 40).map((n) => '<div class="tl ' + (n.kind === 'sale' || n.amount ? 'sale' : n.kind === 'appt' ? 'appt' : '') + '"><span class="b">' + ico(n.kind === 'call' ? 'phone' : n.kind === 'appt' ? 'calendar' : n.kind === 'sale' ? 'bag' : n.kind === 'assign' ? 'send' : 'note') + '</span><div><div>' + esc(n.text) + (n.durationSec ? ' <span class="faint">(' + H.hms(n.durationSec) + ')</span>' : '') + '</div><small>' + H.thDate(n.at, true) + ' : ' + esc(uname(n.by)) + (n.round ? ' : ' + n.round : '') + '</small></div></div>').join('') + '</div>' : '<div class="empty">ยังไม่มีบันทึก</div>') +
      (canEdit ? '<form class="row" data-form="note" style="flex-wrap:nowrap"><input class="in" name="text" placeholder="พิมพ์โน้ตสั้น ๆ เกี่ยวกับลูกค้า" aria-label="โน้ต"><button class="btn sm">บันทึก</button></form>' : '') +
      '</div></aside>';
  }
  function callForm(c) {
    const res = H.RESULTS.map((r) => '<button type="button" data-act="pick-result" data-v="' + r.id + '"><b>' + esc(r.label) + '</b><small>' + esc(r.group) + '</small></button>').join('');
    return '<form class="form" data-form="call" data-id="' + c.id + '"><input type="hidden" name="result">' +
      '<div class="field"><span>ผลการโทร <em>*</em></span><div class="result-grid">' + res + '</div></div>' +
      '<div class="field" data-show="lost" hidden><span>เหตุผลที่ปฏิเสธ <em>*</em></span><select class="in" name="lostReason"><option value="">เลือกเหตุผล</option>' + H.LOST_REASONS.map((r) => '<option>' + r + '</option>').join('') + '</select></div>' +
      '<div class="f2"><div class="field"><span>เวลาคุย</span>' + timerHtml('d') + hmsInputs('d') + '</div>' +
      (c.channel === 'fb' ? '<div class="field"><span>รอบการโทร</span><select class="in" name="round">' + ['T1', 'T2', 'T3'].map((r) => '<option' + (c.round === r ? ' selected' : '') + '>' + r + '</option>').join('') + '</select><small class="muted small" data-round-hint>' + esc(H.ROUNDS[c.round || 'T1']) + '</small></div>' : '<div></div>') + '</div>' +
      '<div data-show="sold" hidden class="form">' + itemsEditor('call-items') + '<div class="field"><span>ยอดขาย (บาท)</span><input class="in" name="amount" type="number" min="0" data-total-for="call-items" placeholder="คำนวณจากสินค้าให้อัตโนมัติ"></div></div>' +
      '<div class="field"><span>โน้ตการคุย</span><textarea class="in" name="note" placeholder="เช่น ลูกค้าใช้ครบ 1 กล่องแล้ว สนใจเซ็ต 2 กล่อง"></textarea></div>' +
      '<div class="field"><span>นัดโทรครั้งถัดไป</span><div class="quick">' + [[1, '+1 วัน'], [3, '+3 วัน'], [7, '+7 วัน (T2)'], [25, '+25 วัน (T3)']].map(([n, l]) => '<button type="button" class="chip" data-act="quick-next" data-v="' + n + '">' + l + '</button>').join('') + '</div>' +
      '<div class="f2"><input class="in" type="datetime-local" name="nextAt" aria-label="วันเวลานัด"><input class="in" name="nextPurpose" placeholder="นัดเพื่อ เช่น T2 ถามผลการใช้" aria-label="นัดเพื่อ"></div></div>' +
      prodDatalist() + '<button class="btn primary lg">' + ico('check') + ' บันทึกการโทร (นับ KPI ให้อัตโนมัติ)</button></form>';
  }
  function apptForm(c) {
    return '<form class="form" data-form="appt" data-id="' + c.id + '"><div class="quick">' + [[0, 'วันนี้'], [1, 'พรุ่งนี้'], [3, '+3 วัน'], [7, '+7 วัน'], [25, '+25 วัน']].map(([n, l]) => '<button type="button" class="chip" data-act="quick-appt" data-v="' + n + '">' + l + '</button>').join('') + '</div>' +
      '<div class="f2"><label class="field"><span>วันเวลานัด <em>*</em></span><input class="in" type="datetime-local" name="at" required></label><label class="field"><span>รอบ</span><select class="in" name="round"><option value="">-</option><option>T1</option><option>T2</option><option>T3</option></select></label></div>' +
      '<label class="field"><span>นัดเพื่อ</span><input class="in" name="purpose" placeholder="เช่น โทรกลับตามที่ลูกค้าขอ"></label><button class="btn primary">' + ico('calendar') + ' บันทึกนัด</button></form>';
  }
  function orderForm(c) {
    return '<form class="form" data-form="order" data-id="' + c.id + '">' + itemsEditor('order-items') + '<div class="f2"><label class="field"><span>วันที่สั่งซื้อ</span><input class="in" type="datetime-local" name="date" value="' + localInput(new Date().toISOString()) + '"></label>' +
      '<label class="field"><span>ยอดรวม (บาท)</span><input class="in" type="number" min="0" name="total" data-total-for="order-items" placeholder="คำนวณอัตโนมัติ"></label></div>' +
      '<label class="field"><span>สถานะ</span><select class="in" name="status"><option value="paid">ชำระแล้ว</option><option value="awaiting_payment">รอชำระ</option><option value="cancelled">ยกเลิก</option></select></label>' +
      '<label class="field"><span>หมายเหตุ</span><input class="in" name="note"></label>' + prodDatalist() + '<button class="btn primary">' + ico('bag') + ' เพิ่มออเดอร์</button><div class="small muted">ใช้สำหรับเพิ่มประวัติย้อนหลัง ยอดขายของ Telesales ให้บันทึกผ่าน "บันทึกการโทร" เพื่อให้นับ KPI</div></form>';
  }
  function editForm(c) {
    const teleOpts = H.teles(S.full || V()).map((u) => '<option value="' + u.id + '"' + (c.owner === u.id ? ' selected' : '') + '>' + esc(u.name) + '</option>').join('');
    return '<form class="form" data-form="edit" data-id="' + c.id + '"><div class="f2"><label class="field"><span>ชื่อ-นามสกุล</span><input class="in" name="name" value="' + esc(c.name) + '"></label><label class="field"><span>เบอร์ติดต่อ</span><input class="in" name="phone" inputmode="tel" value="' + esc(c.phone) + '"></label></div>' +
      '<label class="field"><span>ที่อยู่</span><textarea class="in" name="address">' + esc(c.address) + '</textarea></label>' +
      '<div class="f2"><label class="field"><span>สถานะ</span><select class="in" name="status">' + Object.entries(H.STATUS).map(([k, s]) => '<option value="' + k + '"' + (c.status === k ? ' selected' : '') + '>' + s.label + '</option>').join('') + '</select></label>' +
      (c.channel === 'fb' ? '<label class="field"><span>รอบ</span><select class="in" name="round">' + ['T1', 'T2', 'T3'].map((r) => '<option' + (c.round === r ? ' selected' : '') + '>' + r + '</option>').join('') + '</select></label>' : '<div></div>') + '</div>' +
      (boss() ? '<label class="field"><span>ย้ายให้เซลล์</span><select class="in" name="owner"><option value="">ยังไม่แจก</option>' + teleOpts + '</select></label>' : '') +
      '<button class="btn primary">บันทึกข้อมูลลูกค้า</button></form>';
  }

  // ------------------------------------------------------------ KPI (manual log)
  function pageKpi() {
    const v = V();
    const tele = H.teles(S.full || v);
    const who = boss() ? (ui.kpiUser && tele.find((u) => u.id === ui.kpiUser) ? ui.kpiUser : tele[0] && tele[0].id) : S.me.id;
    const date = ui.kpiDate || H.today();
    const k = H.teleKpi(v, who, date, date);
    const entries = (v.kpi || []).filter((x) => x.user === who && x.date === date).sort((a, b) => Date.parse(b.at) - Date.parse(a.at));
    const myCustomers = (v.customers || []).filter((c) => c.owner === who);
    const resOpts = H.RESULTS.map((r) => '<option value="' + r.id + '">' + esc(r.label) + '</option>').join('');
    const common = '<div class="f2"><label class="field"><span>วันที่</span><input class="in" type="date" name="date" value="' + date + '" max="' + H.today() + '"></label>' +
      '<div class="field"><span>ช่องทาง</span><select class="in" name="channel" data-act-change="kpi-channel"><option value="fb">FB Page (Pancake)</option><option value="mkt">Marketplace (Lazada / Shopee / TikTok / E-Commerce)</option></select></div></div>' +
      '<div class="field" data-round-field><span>รอบ</span><div class="seg" data-seg="round">' + ['T1', 'T2', 'T3'].map((r, i) => '<button type="button" class="' + (i === 0 ? 'on' : '') + '" data-act="seg-pick" data-v="' + r + '">' + r + '</button>').join('') + '</div><input type="hidden" name="round" value="T1"><small class="small muted" data-round-hint>' + esc(H.ROUNDS.T1) + '</small></div>';
    const callForm = '<form class="form" data-form="kpi-call">' + common +
      '<div class="f2"><label class="field"><span>เบอร์ที่โทร <em>*</em></span><input class="in" name="phone" inputmode="tel" list="kpi-phones" placeholder="08x-xxx-xxxx" required data-act-input="kpi-phone"></label><label class="field"><span>ชื่อลูกค้า</span><input class="in" name="name" placeholder="เติมให้อัตโนมัติถ้ามีในระบบ"></label></div>' +
      '<datalist id="kpi-phones">' + myCustomers.slice(0, 400).map((c) => '<option value="' + esc(c.phone) + '">' + esc(c.name) + '</option>').join('') + '</datalist>' +
      '<div class="field"><span>เวลาที่โทรติดต่อลูกค้า (ชั่วโมง / นาที / วินาที)</span>' + timerHtml('d') + hmsInputs('d') + '</div>' +
      '<label class="field"><span>ผลการโทร <em>*</em></span><select class="in" name="result" required><option value="">เลือกผลการโทร</option>' + resOpts + '</select></label>' +
      itemsEditor('kpi-items', [{}]) + '<label class="field"><span>ยอดขาย (บาท)</span><input class="in" type="number" min="0" name="amount" data-total-for="kpi-items" placeholder="0 ถ้าไม่ได้ขาย"></label>' +
      '<label class="field"><span>หมายเหตุ</span><input class="in" name="note" placeholder="เช่น ลูกค้าขอให้โทรกลับหลัง 18:00"></label>' + prodDatalist() +
      '<button class="btn primary lg">' + ico('send') + ' บันทึกสายนี้ ส่งเข้า Dashboard</button></form>';
    const sumForm = '<form class="form" data-form="kpi-sum">' + common +
      '<div class="f3"><label class="field"><span>โทรทั้งหมด (สาย) <em>*</em></span><input class="in" type="number" min="0" name="calls" required></label><label class="field"><span>ได้คุย (สาย)</span><input class="in" type="number" min="0" name="talkedCount"></label><label class="field"><span>จำนวนออเดอร์ที่ปิด</span><input class="in" type="number" min="0" name="orders"></label></div>' +
      '<div class="field"><span>เวลาคุยรวมทั้งวัน (ชั่วโมง / นาที / วินาที)</span>' + hmsInputs('d') + '</div>' +
      itemsEditor('sum-items', [{}]) + '<label class="field"><span>ยอดขายรวม (บาท)</span><input class="in" type="number" min="0" name="amount" data-total-for="sum-items"></label>' +
      '<label class="field"><span>หมายเหตุ</span><input class="in" name="note" placeholder="เช่น ลูกค้าไม่รับสายเยอะ ระบบมีปัญหาช่วงบ่าย"></label>' + prodDatalist() +
      '<button class="btn primary lg">' + ico('send') + ' บันทึกยอดรวมทั้งวัน</button></form>';
    const teleOpts = tele.map((u) => '<option value="' + u.id + '"' + (who === u.id ? ' selected' : '') + '>' + esc(u.name) + '</option>').join('');
    const left = '<section class="card"><div class="card-h"><span class="card-ico">' + ico('clip') + '</span><div class="ttl"><h2>บันทึก KPI แบบ Manual</h2><small>กรอกทีละสาย หรือกรอกยอดรวมทั้งวันทีเดียว ตัวเลขขึ้น Dashboard ผู้บริหารทันที</small></div></div>' +
      (boss() ? '<div class="f2" style="margin-bottom:12px"><div class="field"><span>Telesales</span>' + segF('', 'kpi-user', tele.map((u) => ({ v: u.id, l: u.name })), who) + '</div><label class="field"><span>ดูวันที่</span><input class="in" type="date" data-act="kpi-date" value="' + date + '" max="' + H.today() + '"></label></div>' : '') +
      '<div class="seg" style="margin-bottom:14px"><button class="' + (ui.kpiMode === 'call' ? 'on' : '') + '" data-act="kpi-mode" data-v="call">' + ico('phone') + ' ทีละสาย</button><button class="' + (ui.kpiMode === 'sum' ? 'on' : '') + '" data-act="kpi-mode" data-v="sum">' + ico('clip') + ' สรุปทั้งวัน</button></div>' +
      (ui.kpiMode === 'call' ? callForm : sumForm) + '<div class="small muted" style="margin-top:10px">เคล็ดลับ : ถ้าโทรจากหน้า Ticket ลูกค้า กด "บันทึกการโทร" ที่นั่นได้เลย ระบบนับ KPI ให้โดยไม่ต้องกรอกซ้ำ</div></section>';
    const checks = '<div class="alerts">' + k.checks.map((c) => '<div class="alert-row" style="cursor:default"><span class="check ' + (c.ok ? 'ok' : 'no') + '">' + ico(c.ok ? 'checkc' : 'x') + '</span><span class="t"><b>' + c.label + '</b><small>' + (c.time ? Math.round(c.value / 60) + ' / ' + Math.round(c.target / 60) + ' นาที' : c.money ? B(c.value) + ' / ' + B(c.target) : c.value + ' / ' + c.target + ' สาย') + '</small></span><span class="pill ' + (c.ok ? 'good' : 'bad') + '">' + (c.ok ? 'ครบ' : 'ขาด ' + (c.time ? Math.ceil((c.target - c.value) / 60) + ' น.' : c.money ? B(c.target - c.value) : (c.target - c.value) + ' สาย')) + '</span></div>').join('') + '</div>';
    const kpiList = listView({
      key: 'kpi', items: entries, id: (e) => e.id, empty: emptyState('ยังไม่มีรายการในวันนี้'),
      xl: { name: 'รายการโทร', cols: [['วันที่', (e) => H.thDate(e.date)], ['เวลา', (e) => H.thTime(e.at)], ['Telesales', (e) => uname(e.user)], ['ช่องทาง', (e) => (e.channel === 'fb' ? 'FB ' + (e.round || '') : 'E-Commerce')], ['ลูกค้า', (e) => e.name], ['เบอร์', (e) => H.fmtPhone(e.phone || '')], ['ผล', (e) => (resultOf(e.result) || {}).label], ['ได้คุย', (e) => (e.talked ? 'ใช่' : 'ไม่')], ['เวลาคุย (วินาที)', (e) => e.durationSec || 0], ['ยอด', (e) => e.amount || 0]] },
      head: [{ h: 'เวลา' }, { h: 'ช่องทาง' }, { h: 'ลูกค้า' }, { h: 'ผล' }, { h: 'เวลาคุย', cls: 'n' }, { h: 'ยอด', cls: 'n' }],
      actions: [{ act: 'kpi-del-sel', label: 'ลบ', icon: 'x', danger: true }],
      rowDelete: (e) => boss() || e.date === H.today(), rowDeleteAct: 'kpi-del-one',
      row: (e) => { const r = resultOf(e.result); return ['<td>' + H.thTime(e.at) + '</td>', '<td>' + (e.channel === 'fb' ? 'FB ' + roundTag(e.round) : 'Marketplace') + '</td>',
        '<td>' + (e.mode === 'summary' ? '<b>สรุปทั้งวัน</b><div class="small muted">' + e.calls + ' สาย : คุย ' + e.talkedCount + '</div>' : '<span class="cust-name"><b class="one">' + esc(e.name || '-') + '</b><small>' + H.fmtPhone(e.phone) + '</small></span>') + '</td>',
        '<td>' + (r ? '<span class="pill ' + r.tone + '">' + esc(r.group) + '</span>' : '-') + '</td>', '<td class="n">' + H.hms(e.durationSec) + '</td>', '<td class="n">' + (e.amount ? B(e.amount) : '-') + '</td>']; },
    });
    const right = '<div class="grid" style="align-content:start"><section class="card"><div class="card-h"><span class="card-ico">' + ico('chart') + '</span><div class="ttl"><h2>สิ่งที่ผู้บริหารเห็น : ' + esc(uname(who)) + '</h2><small>' + H.thDate(date) + ' : ' + KSTAT[k.status][1] + '</small></div><span class="pill ' + KSTAT[k.status][0] + '">' + k.passed + '/4</span></div>' + checks +
      '<div class="row small muted" style="margin-top:12px;gap:14px"><span>ได้คุย <b style="color:var(--text)">' + k.talked + '/' + k.calls + '</b></span><span>ปิดได้ <b style="color:var(--text)">' + k.orders + '</b></span><span>เวลาคุย <b style="color:var(--text)">' + H.hms(k.talkSec) + '</b></span><span>OneCall <b style="color:var(--text)">' + k.oc.calls + ' สาย</b></span></div></section>' +
      '<section class="card"><div class="card-h"><span class="card-ico">' + ico('note') + '</span><div class="ttl"><h2>รายการที่บันทึก</h2><small>' + entries.length + ' รายการ : ลบได้เฉพาะของวันนี้</small></div></div>' +
      kpiList + '</section></div>';
    return '<div class="grid g-kpi">' + left + right + '</div>';
  }

  // ------------------------------------------------------------ CLOSE (Admin Sales)
  const KNOWN_PAGES = ['Gluta Alpha X Yanhee ของแท้100% จากยันฮี', 'Yanhee Fozinnia วิตามินฟื้นฟูวัยทอง ปรับสมดุลการนอน', 'Yanhee Neck Cream ครีมบำรุงคอพร้อมหัวกัวซา แก้คอหย่อน', 'เซรั่มปลูกผม บำรุงหนังศีรษะ ยันฮี ทีเซอร์', 'Yanhee Eye Serum Thailand', 'Yanhee Anti-Aging ชะลอวัยสูตรเฉพาะจากยันฮี', 'Yanhee Daily Vitamin วิตามินรวมสูตรเฉพาะยันฮี'];
  function nextPreview() {
    if (V().nextFb) return V().nextFb;
    const st = S.full; if (!st) return null;
    const copy = { ...st, settings: { ...st.settings, rr: { ...(st.settings.rr || {}) } } };
    return H.nextTele(copy, 'fb');
  }
  // overview numbers: computed here for executives/demo, fetched from the server for telesales (they only hold their own records)
  const DASH = {};
  const fullView = () => DEMO || boss();
  function dashFor(from, to) {
    const st = S.full || V();
    if (fullView()) return H.dashboard(st, from, to);
    const k = from + '|' + to, hit = DASH[k];
    if (hit && hit.at > Date.now() - 60000) return hit.d;
    if (!hit || !hit.loading) {
      DASH[k] = Object.assign(hit || {}, { loading: true });
      fetch('/api/dashboard?from=' + from + '&to=' + to, { credentials: 'same-origin' }).then((r) => r.json()).then((j) => { DASH[k] = { d: j.d, split: j.split, dist: j.dist, at: Date.now() }; DASH._split = j.split; if (['overview', 'ovtele', 'ovadmin'].includes(S.page)) render(); }).catch(() => { DASH[k].loading = false; });
    }
    return hit ? hit.d : null;
  }
  function todaySplit() {
    if (!fullView() && DASH._split) return DASH._split;
    const T = H.today(), cnt = {};
    for (const u of H.teles(S.full || V())) cnt[u.id] = 0;
    for (const a of (V().approvals || [])) if (H.dayKey(a.at) === T && a.status !== 'rejected' && a.status !== 'history') { const who = a.assigned || a.proposed; if (who in cnt) cnt[who]++; }
    return cnt;
  }
  function splitBar(cnt) {
    const ids = Object.keys(cnt), tot = ids.reduce((s, k) => s + cnt[k], 0) || 1;
    const col = ['var(--c-tele)', '#d6457a'];
    return '<div class="ratio">' + ids.map((k, i) => '<i style="width:' + (cnt[k] / tot * 100) + '%;background:' + col[i % 2] + '"></i>').join('') + '</div><div class="row between small" style="margin-top:6px">' + ids.map((k, i) => '<span><i style="display:inline-block;width:9px;height:9px;border-radius:3px;background:' + col[i % 2] + ';margin-right:6px"></i>' + esc(uname(k)) + ' <b>' + cnt[k] + '</b></span>').join('') + '</div>';
  }
  function pageClose() {
    const v = V(), T = H.today();
    const next = nextPreview();
    const admins = H.admins(S.full || v);
    let closes = (v.approvals || []).filter((a) => H.dayKey(a.at) === T && a.status !== 'history');
    if (boss() && ui.closeAdmin !== 'all') closes = closes.filter((a) => a.closer === ui.closeAdmin);
    closes.sort((a, b) => Date.parse(b.at) - Date.parse(a.at));
    const myRev = closes.reduce((s, a) => s + (a.total || 0), 0);
    const sync = (v.sync || {}).pancake || {};
    const form = '<form class="form" data-form="close"><div class="f2"><label class="field"><span>ชื่อ-นามสกุลลูกค้า <em>*</em></span><input class="in" name="name" required autocomplete="off"></label>' +
      '<label class="field"><span>เบอร์ติดต่อ <em>*</em></span><input class="in" name="phone" inputmode="tel" required placeholder="08x-xxx-xxxx" data-act-input="close-phone"></label></div><div class="small" data-close-hint></div>' +
      '<label class="field"><span>ที่อยู่จัดส่ง</span><textarea class="in" name="address" placeholder="บ้านเลขที่ ถนน ตำบล อำเภอ จังหวัด รหัสไปรษณีย์"></textarea></label>' +
      '<div class="f2"><label class="field"><span>เพจที่ปิดการขาย</span><select class="in" name="page"><option value="">เลือกเพจ</option>' + KNOWN_PAGES.map((p) => '<option>' + esc(p) + '</option>').join('') + '</select></label>' +
      (boss() ? '<label class="field"><span>แอดมินที่ปิด</span><select class="in" name="closer">' + admins.map((u) => '<option value="' + u.id + '">' + esc(u.name) + '</option>').join('') + '</select></label>' : '<div></div>') + '</div>' +
      itemsEditor('close-items') + '<div class="total-line"><span>ยอดรวม</span><b data-sum-of="close-items">฿0</b></div>' +
      '<label class="field"><span>ยอดที่ลูกค้าจ่ายจริง (ถ้ามีส่วนลด)</span><input class="in" type="number" min="0" name="total" placeholder="เว้นว่าง = ใช้ยอดรวมด้านบน"></label>' +
      '<label class="field"><span>หมายเหตุถึง Telesales</span><input class="in" name="note" placeholder="เช่น ลูกค้าสะดวกรับสายหลัง 17:00"></label>' + prodDatalist() +
      '<button class="btn primary lg">' + ico('send') + ' บันทึกและส่งรายชื่อให้ Telesales</button></form>';
    const canCancel = (a) => boss() || (a.status === 'pending' && a.closer === S.me.id);
    const list = listView({
      key: 'close', items: closes, id: (a) => a.id, empty: emptyState('ยังไม่มีการปิดการขายวันนี้'),
      xl: { name: 'ปิดการขาย', cols: [['เวลา', (a) => H.thDate(a.at, true)], ['ลูกค้า', (a) => (H.findCustomer(S.full || V(), a.customerId) || {}).name], ['สินค้า', (a) => (a.items || []).map((i) => i.name + ' x' + i.qty).join(', ')], ['ยอด', (a) => a.total], ['ปิดโดย', (a) => a.closerName || uname(a.closer)], ['ส่งให้', (a) => uname(a.assigned || a.proposed)]] },
      head: [{ h: 'เวลา' }, { h: 'ลูกค้า' }, { h: 'ยอด', cls: 'n' }, { h: 'สถานะ' }],
      actions: [{ act: 'close-del-sel', label: 'ยกเลิกรายการ', icon: 'x', danger: true }],
      rowDelete: canCancel, rowDeleteAct: 'close-del-one',
      row: (a) => { const c = H.findCustomer(S.full || v, a.customerId) || {}; return ['<td><b>' + H.thTime(a.at) + '</b></td>',
        '<td class="cust-name"><b class="one">' + esc(c.name || '-') + '</b><small class="one" style="display:block;max-width:240px;font-family:var(--font)">' + esc((a.items || []).map((i) => i.name + ' x' + i.qty).join(', ')) + (boss() ? ' : ' + esc(a.closerName) : '') + (a.returning ? ' : ลูกค้าเก่า' : '') + '</small></td>',
        '<td class="n"><b>' + B(a.total) + '</b></td>',
        '<td>' + (a.status === 'pending' ? '<span class="pill warn">รอ → ' + esc(uname(a.proposed)) + '</span>' : a.status === 'rejected' ? '<span class="pill bad">ไม่ส่ง</span>' : '<span class="pill good">' + esc(uname(a.assigned)) + '</span>') + '</td>']; },
    });
    return '<div class="grid g-main">' + card('cart', 'บันทึกการปิดการขาย', 'กรอกเมื่อปิดการขายได้ ระบบจะส่งรายชื่อให้ Telesales แบบ 50:50 ทันที', form) +
      '<div class="grid" style="align-content:start">' +
      card('send', 'รายชื่อถัดไปจะส่งให้', 'แบ่งเท่ากัน 50:50 ทุกครั้ง : ลูกค้าเก่าส่งกลับให้เซลล์คนเดิม', '<div class="row" style="gap:14px;margin-bottom:14px">' + (next ? av(user(next), 'lg') + '<div><b style="font-size:18px">' + esc(uname(next)) + '</b><div class="small muted">' + 'ส่งถึงเซลล์ทันทีอัตโนมัติ' + '</div></div>' : '<span class="muted">ไม่มี Telesales ที่พร้อมรับ</span>') + '</div><div class="section-t" style="margin-bottom:8px">รายชื่อที่แจกวันนี้</div>' + splitBar(todaySplit())) +
      card('link', 'ดึงจาก Pancake อัตโนมัติ', 'ออเดอร์ที่ปิดใน Pancake POS เข้าระบบเองทุก 3 นาที ไม่ต้องกรอกซ้ำ', '<dl class="kv"><dt>ล่าสุด</dt><dd>' + (sync.lastRun ? H.thDate(sync.lastRun, true) : 'ยังไม่เคยดึง') + '</dd><dt>รอบล่าสุด</dt><dd>' + (sync.lastAdded || 0) + ' ออเดอร์ใหม่</dd>' + (sync.lastError ? '<dt>สถานะ</dt><dd style="color:var(--bad)">' + esc(sync.lastError) + '</dd>' : '') + '</dl>', '<button class="btn sm" data-act="sync-pancake">' + ico('refresh') + ' ดึงตอนนี้</button>') +
      '<section class="card"><div class="card-h"><span class="card-ico">' + ico('bag') + '</span><div class="ttl"><h2>ปิดการขายวันนี้</h2><small>' + closes.length + ' ออเดอร์ : ' + B(myRev) + '</small></div>' + (boss() ? segF('', 'close-admin', [{ v: 'all', l: 'ทั้งหมด' }].concat(admins.map((u) => ({ v: u.id, l: u.name }))), ui.closeAdmin) : '') + '</div>' + list + '</section></div></div>';
  }

  // ------------------------------------------------------------ APPROVALS
  function pageApprovals() {
    const v = V(), T = H.today(), st = S.full || v;
    const range = ui.apTab === 'week' ? 7 : 1, from = H.addDays(T, -(range - 1));
    const mine = (a) => boss() || a.assigned === S.me.id;
    const all = (v.approvals || []).filter((a) => a.status === 'approved' && mine(a) && H.dayKey(a.decidedAt || a.at) >= from).sort((a, b) => Date.parse(b.decidedAt || b.at) - Date.parse(a.decidedAt || a.at));
    const todayList = (v.approvals || []).filter((a) => a.status === 'approved' && mine(a) && H.dayKey(a.decidedAt || a.at) === T);
    const cust = (a) => H.findCustomer(st, a.customerId) || {};
    const notCalled = (a) => cust(a).status === 'new';
    const prodName = (n) => { const p = products().find((x) => x.code === n || x.name === n); return p ? p.name : String(n).replace(/\s*\([^)]*\)$/, ''); };
    const sumToday = todayList.reduce((t, a) => t + (a.total || 0), 0), waiting = todayList.filter(notCalled).length;
    const tiles = '<div class="ap-tiles">' +
      '<div class="ap-tile good"><span class="ap-ti">' + ico('inbox') + '</span><div><small>' + (boss() ? 'แจกแล้ววันนี้' : 'ได้รับวันนี้') + '</small><b>' + N(todayList.length) + ' <span>รายชื่อ</span></b><em>' + B(sumToday) + '</em></div></div>' +
      '<div class="ap-tile warn"><span class="ap-ti">' + ico('phone') + '</span><div><small>ยังไม่ได้โทร</small><b>' + N(waiting) + ' <span>รายชื่อ</span></b><em>' + (waiting ? 'โทร T1 ต้อนรับภายใน 2 ชม.' : 'โทรครบแล้ว') + '</em></div></div>' +
      '<div class="ap-tile split"><div class="grow"><small>สัดส่วนวันนี้ (แจกอัตโนมัติ 50:50)</small>' + splitBar(todaySplit()) + '</div></div></div>';
    xReg('ap', 'รายชื่อที่ถูกแจก', all, (a) => a.id, [['วันที่แจก', (a) => H.thDate(a.decidedAt || a.at, true)], ['ลูกค้า', (a) => cust(a).name], ['เบอร์', (a) => H.fmtPhone(cust(a).phone || '')], ['สินค้า', (a) => (a.items || []).map((i) => prodName(i.name) + ' x' + i.qty).join(', ')], ['ยอดออเดอร์', (a) => a.total || 0], ['ปิดโดย', (a) => a.closerName || uname(a.closer)], ['เพจ', (a) => a.page || cust(a).page], ['ส่งให้', (a) => uname(a.assigned)], ['ลูกค้าเก่า', (a) => (a.returning ? 'ใช่' : '')], ['สถานะ', (a) => (notCalled(a) ? 'ยังไม่ได้โทร' : 'โทรแล้ว')]]);
    const card = (a) => {
      const c = cust(a);
      const nm = c.name && c.name !== '-' ? c.name : '', ph = c.phone ? H.fmtPhone(c.phone) : '';
      const tu = user(a.assigned), called = !notCalled(a);
      const items = (a.items || []).map((i) => '<span class="ap-item">' + esc(prodName(i.name)) + ' <b>×' + i.qty + '</b></span>').join('') || '<span class="faint small">ไม่ระบุสินค้า</span>';
      return '<article class="ap-card' + (called ? ' done' : '') + '">' +
        '<div class="ap-who">' + xCk('ap', a.id) + '<span class="ap-av' + (nm ? '' : ' none') + '">' + esc(nm ? nm.trim()[0] : '?') + '</span><div class="ap-id"><b class="' + (c.id ? 'link' : '') + '"' + (c.id ? ' data-open="' + esc(c.id) + '"' : '') + '>' + esc(nm || 'ลูกค้าไม่ระบุชื่อ') + '</b>' +
          '<small>' + (ph ? ico('phone') + ' ' + ph : '<span class="faint">ไม่มีเบอร์ในออเดอร์</span>') + (a.returning ? ' <span class="pill info">ลูกค้าเก่า</span>' : '') + '</small></div></div>' +
        '<div class="ap-items">' + items + '</div>' +
        '<div class="ap-col ap-amt"><small>ยอดออเดอร์</small><b>' + B(a.total) + '</b></div>' +
        '<div class="ap-col"><small>ปิดโดย</small><b class="one">' + esc(a.closerName || uname(a.closer) || '-') + '</b><span class="muted small">' + (range > 1 ? H.thDate(a.at).replace(/ \d{4}$/, '') + ' ' : '') + H.thTime(a.at) + ' น.</span></div>' +
        '<div class="ap-to"><div class="ap-col"><small>ส่งให้ (อัตโนมัติ)</small><span class="ap-me">' + (tu ? av(tu, 'sm') : '') + '<b>' + esc(uname(a.assigned)) + '</b></span></div></div>' +
        '<div class="ap-act">' + (called ? '<span class="pill good ap-st">' + ico('check') + ' โทรแล้ว</span>' : '<span class="pill warn ap-st">ยังไม่ได้โทร</span>') + '</div>' +
        '</article>';
    };
    const tabs = '<div class="ap-bar"><div class="qtabs"><button class="qtab' + (range === 1 ? ' on' : '') + '" data-act="ap-tab" data-v="today">วันนี้ <span>' + todayList.length + '</span></button><button class="qtab' + (range === 7 ? ' on' : '') + '" data-act="ap-tab" data-v="week">7 วันล่าสุด</button></div><span class="small muted">' + ico('refresh') + ' แจกอัตโนมัติทันทีที่แอดมินปิดการขาย</span></div>';
    const empty = '<div class="ap-empty"><span>' + ico('inbox') + '</span><b>' + (range === 1 ? 'ยังไม่มีรายชื่อวันนี้' : 'ยังไม่มีรายชื่อใน 7 วัน') + '</b><small>เมื่อแอดมินปิดการขายบน FB Page ระบบจะแจกรายชื่อให้ Telesales ทันที 50:50</small></div>';
    const side = boss() ? '<section class="card ap-side"><h3 class="ct">' + ico('refresh') + ' แจกอัตโนมัติ</h3><ol class="ap-steps"><li><b>แอดมินปิดการขาย</b><span>จาก Pancake หรือหน้าปิดการขาย</span></li><li><b>ระบบส่งให้ Telesales 50:50</b><span>ลูกค้าเก่าส่งกลับให้เซลล์คนเดิม ข้ามคนที่ลาวันนี้</span></li><li><b>สร้างนัด T1 ให้อัตโนมัติ</b><span>เซลล์โทรต้อนรับภายใน 2 ชม.</span></li></ol><p class="small muted">ต้องการย้ายรายชื่อ ใช้ "เปลี่ยนผู้ดูแล" ในหน้าลูกค้า : ตั้งค่าคนลาได้ที่หน้าตั้งค่า</p></section>'
      : '<section class="card ap-side"><h3 class="ct">' + ico('phone') + ' รายชื่อใหม่ทำอะไรต่อ</h3><ol class="ap-steps"><li><b>อยู่ใน "ลูกค้าของฉัน" แล้ว</b><span>แท็บ FB Page</span></li><li><b>มีนัด T1 ให้อัตโนมัติ</b><span>โทรต้อนรับ ยืนยันออเดอร์ภายใน 2 ชม.</span></li><li><b>โทรจาก "ลูกค้าของฉัน → มาใหม่วันนี้"</b><span>บันทึกผลแล้วระบบนัด T2 ให้ต่อ</span></li></ol></section>';
    return tiles + '<div class="ap-grid"><section class="card ap-main">' + tabs + (all.length ? xBar('ap', 'รายชื่อ') + (() => { const per = 10, pages = Math.ceil(all.length / per), pg = Math.min(Math.max(1, ui.apPage || 1), pages); return '<div class="ap-list">' + all.slice((pg - 1) * per, pg * per).map(card).join('') + '</div>' + pagerHtml('ap-page', pg, pages, all.length, per, 'รายชื่อ'); })() : empty) + '</section>' + side + '</div>';
  }

  // ------------------------------------------------------------ SETTINGS
  function pageSettings() {
    const st = S.full || V(), t = st.settings.targets, sy = st.sync || {};
    const tf = (k, l, suf) => '<label class="field"><span>' + l + '</span><input class="in" type="number" min="0" name="' + k + '" value="' + t[k] + '"' + (suf ? ' placeholder="' + suf + '"' : '') + '></label>';
    const targets = card('chart', 'เป้า KPI', 'ใช้คำนวณ "ครบ KPI" ใน Dashboard ผู้บริหาร', '<form class="form" data-form="targets"><div class="f3">' + tf('fbCalls', 'โทร FB / คน / วัน') + tf('t1', 'ในนั้นเป็น T1') + tf('t2', 'T2') + tf('t3', 'T3') + tf('mktCalls', 'โทร Marketplace / คน / วัน') + tf('talkMinutes', 'เวลาคุย (นาที) / คน / วัน') + tf('teleRevenue', 'ยอดขาย Telesales / คน / วัน') + tf('teamRevenueMonth', 'เป้ายอดรวมทั้งทีม / เดือน') + '</div>' +
      '<div class="f2"><label class="field"><span>FB เงียบเกินกี่วันถือว่าเลยกำหนด</span><input class="in" type="number" min="1" name="staleFb" value="' + st.settings.staleDays.fb + '"></label><label class="field"><span>Marketplace เงียบเกินกี่วัน</span><input class="in" type="number" min="1" name="staleEcom" value="' + st.settings.staleDays.ecom + '"></label></div>' +
      '<button class="btn primary">บันทึกเป้า</button></form>');
    const users = card('users', 'ทีมงานและสิทธิ์', 'ตั้งชื่อ แจ้งลา และจับคู่ชื่อแอดมินใน Pancake', '<div class="tbl-wrap"><table class="tbl"><thead><tr><th>ชื่อ</th><th>ฝ่าย</th><th>ตั้งค่า</th><th></th></tr></thead><tbody>' + st.users.map((u) => '<tr data-user-row="' + u.id + '"><td><div class="row" style="flex-wrap:nowrap">' + av(u, 'sm') + '<input class="in" data-u="name" value="' + esc(u.name) + '" style="min-width:110px" aria-label="ชื่อ"></div></td><td><span class="small">' + esc(H.ROLES[u.role].label) + '</span>' + (u.id === 'mo' ? '<div class="small muted">ใช้สิทธิ์ผู้บริหารได้</div>' : '') + '</td>' +
      '<td>' + (u.role === 'tele' ? '<label class="switch small"><input type="checkbox" data-u="off"' + (u.off ? ' checked' : '') + '><span>ลาวันนี้ (ไม่รับรายชื่อ)</span></label>' : u.role === 'admin' ? '<input class="in" data-u="pancakeName" value="' + esc(u.pancakeName || '') + '" placeholder="ชื่อใน Pancake เช่น Chonlakarn Eadnai" aria-label="ชื่อใน Pancake">' : '<span class="faint small">-</span>') + '</td>' +
      '<td><button class="btn sm" data-act="save-user" data-id="' + u.id + '">บันทึก</button></td></tr>').join('') + '</tbody></table></div><div class="small muted" style="margin-top:8px">ชื่อแอดมินที่พบใน Pancake ช่วง 3 สัปดาห์ล่าสุด : Chonlakarn Eadnai, ชาเย็น ไม่หวาน, ณิชาภา ศรีวัฒนกุล, สมร นอนน้อย, Numwhan Yanhee : จับคู่แล้วยอดจะรวมเข้าชื่อในระบบ</div>');
    const prods = card('bag', 'รายการสินค้าและราคา', 'ใช้ในช่องเลือกสินค้าทุกฟอร์ม', '<div class="items" id="prod-edit">' + st.settings.products.map((p) => '<div class="item-row" style="grid-template-columns:110px minmax(0,1fr) 90px 32px"><input class="in" data-p="code" value="' + esc(p.code) + '" aria-label="รหัส"><input class="in" data-p="name" value="' + esc(p.name) + '" aria-label="ชื่อสินค้า"><input class="in" type="number" data-p="price" value="' + p.price + '" aria-label="ราคา"><button type="button" class="x" data-act="item-del" aria-label="ลบ">' + ico('x') + '</button></div>').join('') + '</div>' +
      '<div class="row" style="margin-top:10px"><button class="btn sm" data-act="prod-add">' + ico('plus') + ' เพิ่มสินค้า</button><button class="btn primary sm" data-act="prod-save">บันทึกรายการสินค้า</button></div>');
    const ints = S.integrations || {};
    const conn = (name, ok, last, desc, btn) => '<div class="alert-row" style="cursor:default"><span class="pill ' + (ok ? 'good' : 'warn') + '">' + (ok ? 'เชื่อมต่อ' : 'ยังไม่ตั้งค่า') + '</span><span class="t"><b>' + name + '</b><small>' + desc + (last ? ' : ล่าสุด ' + H.thDate(last, true) : '') + '</small></span>' + (btn || '') + '</div>';
    const integrations = card('link', 'การเชื่อมต่อระบบ', 'ข้อมูลไหลเข้าเองอัตโนมัติ ไม่ต้องกรอกซ้ำ', '<div class="alerts">' +
      conn('Pancake POS (FB Page)', ints.pancake, sy.pancake && sy.pancake.lastRun, 'ออเดอร์ที่แอดมินปิดเข้าคิวแจก 50:50 ทุก 3 นาที' + (sy.pancake && sy.pancake.lastError ? ' : <span style="color:var(--bad)">' + esc(sy.pancake.lastError) + '</span>' : ''), '<button class="btn sm" data-act="sync-pancake">ดึงตอนนี้</button>') +
      conn('OneCall (บันทึกเสียงสาย)', ints.onecall, sy.onecall && sy.onecall.lastRun, 'ทุกสายที่โทรออกนับเข้า KPI ให้อัตโนมัติทุก 5 นาที' + (sy.onecall && sy.onecall.lastError ? ' : <span style="color:var(--bad)">' + esc(sy.onecall.lastError) + '</span>' : ''), '<button class="btn sm" data-act="sync-onecall">ดึงตอนนี้</button>') +
      conn('E-Commerce (Evolution / BigSeller)', !!(sy.bigseller && sy.bigseller.lastRun && !sy.bigseller.lastError), sy.bigseller && sy.bigseller.lastRun, 'ลูกค้าใหม่เข้าเองทุก 5 นาที แจก Telesales เท่ากัน' + (sy.bigseller && sy.bigseller.lastError ? ' : <span style="color:var(--bad)">' + esc(sy.bigseller.lastError) + '</span>' : sy.bigseller && sy.bigseller.lastAdded != null ? ' : รอบล่าสุดได้ลูกค้าใหม่ ' + N(sy.bigseller.lastAdded) + ' ราย' : ''), '<button class="btn sm" data-act="sync-evo">ดึงตอนนี้</button>') +
      conn('BigSeller : แยกช่องทาง Lazada / Shopee / TikTok', !!(sy.bstab && sy.bstab.lastRun), sy.bstab && sy.bstab.lastRun, 'ส่งข้อมูลจากแท็บ BigSeller ที่ล็อกอินไว้ : ช่องทาง เลขพัสดุ สถานะจัดส่ง และลูกค้าใหม่' + (sy.bstab ? ' : รวม ' + N(sy.bstab.totalRows || 0) + ' รายการ : ลูกค้าใหม่ ' + N(sy.bstab.totalAdded || 0) + ' : ระบุช่องทาง ' + N(sy.bstab.totalTagged || 0) : ''), '<button class="btn sm" data-act="bs-install">ติดตั้งตัวช่วย</button>') +
      conn('ระบบเดิม (evo-split-online)', !!(sy.legacy && sy.legacy.importedAt), sy.legacy && sy.legacy.importedAt, sy.legacy && sy.legacy.importedAt ? 'ย้ายลูกค้า ' + N(sy.legacy.customers) + ' ราย ออเดอร์ ' + N(sy.legacy.orders) + ' รายการ' : 'ย้ายรายชื่อ ประวัติ และนัดจากระบบเดิมครั้งเดียว', '<button class="btn sm" data-act="import-legacy">นำเข้า</button>') + '</div>' +
      '<div class="section-t" style="margin-top:16px">นำเข้าฐานรายชื่อลูกค้าจาก Excel</div><div class="small muted" style="margin-top:4px">ใช้ไฟล์แบบ Sales Department Master Workflow (ชีทพี่เขม / ชีทหวาน) : เบอร์ซ้ำจะรวมเข้ากับลูกค้าเดิม ไม่สร้างซ้ำ</div>' +
      '<form class="form" data-form="contacts-import" style="margin-top:8px"><div class="f2"><label class="field"><span>ไฟล์ Excel</span><input class="in" type="file" name="file" accept=".xlsx,.xls" data-act-change="ci-file"></label>' +
      '<label class="field"><span>ชีท</span><select class="in" name="sheet" id="ci-sheet"><option value="">เลือกไฟล์ก่อน</option></select></label></div>' +
      '<label class="field"><span>ให้เซลล์</span><select class="in" name="owner"><option value="">ตามคอลัมน์ Telesale ในชีท</option>' + H.teles(st).map((u) => '<option value="' + u.id + '">' + esc(u.name) + '</option>').join('') + '</select></label>' +
      '<button class="btn primary sm">' + ico('upload') + ' นำเข้าฐานรายชื่อ</button></form>' +
      (Object.keys(sy.imports || {}).length ? '<div class="small muted" style="margin-top:8px">' + Object.values(sy.imports).slice(-3).map((x) => esc(x.label || 'นำเข้า') + ' : ใหม่ ' + N(x.added) + ' : รวมกับเดิม ' + N(x.merged) + ' : นัด ' + N(x.appts) + ' (' + H.thDate(x.at, true) + ')').join('<br>') + '</div>' : '') +
      '<div class="section-t" style="margin-top:16px">นำเข้าออเดอร์ E-Commerce</div><form class="form" data-form="ecom-import" style="margin-top:8px"><div class="f2"><label class="field"><span>แพลตฟอร์ม</span><select class="in" name="platform"><option value="">ตามไฟล์ (ค่าเริ่มต้น Lazada)</option><option value="lazada">Lazada</option><option value="shopee">Shopee</option><option value="tiktok">TikTok Shop</option><option value="evolution">E-Commerce</option></select></label>' +
      '<label class="field"><span>ไฟล์ Excel / CSV จาก BigSeller</span><input class="in" type="file" name="file" accept=".xlsx,.xls,.csv"></label></div>' +
      '<label class="field"><span>หรือวางตารางที่คัดลอกมา (ต้องมีหัวคอลัมน์ เบอร์ / ชื่อ / ที่อยู่ / สินค้า / ยอด)</span><textarea class="in" name="paste" rows="4" placeholder="เลขที่คำสั่งซื้อ\tชื่อผู้รับ\tเบอร์โทร\tที่อยู่\tสินค้า\tยอด"></textarea></label><button class="btn primary sm">' + ico('upload') + ' นำเข้า</button></form>');
    const ann = card('mega', 'ประกาศข่าวสาร', 'แสดงที่หน้าหลักของทุกคน', '<form class="form" data-form="ann"><label class="field"><span>หัวข้อ <em>*</em></span><input class="in" name="title" required></label><label class="field"><span>รายละเอียด</span><textarea class="in" name="body"></textarea></label><button class="btn primary sm">ประกาศ</button></form>' +
      '<div class="ann" style="margin-top:14px">' + (st.announcements || []).map((a) => '<div class="row between" style="flex-wrap:nowrap"><div class="ann-item" style="flex:1"><div><b>' + esc(a.title) + '</b><small>' + H.thDate(a.at, true) + '</small></div></div><button class="btn sm danger" data-act="ann-del" data-id="' + a.id + '">ลบ</button></div>').join('') + '</div>');
    const data = card('note', 'ข้อมูล', DEMO ? 'โหมดตัวอย่าง' : 'สำรองข้อมูลอัตโนมัติทุกวัน เก็บ 30 วัน', DEMO ? '<button class="btn" data-act="demo-reset">ล้างและสร้างข้อมูลตัวอย่างใหม่</button>' : '<a class="btn" href="/api/export/customers.csv">' + ico('upload') + ' ดาวน์โหลดรายชื่อลูกค้า (CSV)</a>');
    return '<div class="grid g2">' + targets + users + '</div><div class="grid g2">' + integrations + '<div class="grid" style="align-content:start">' + prods + ann + data + '</div></div>';
  }

  // ------------------------------------------------------------ modals
  let modal = null;
  // ---- dialing from a computer: open the phone app (Phone Link etc.) and show a QR the work phone can scan to call
  let QRP = null;
  const loadQr = () => window.qrcode ? Promise.resolve(window.qrcode) : QRP || (QRP = new Promise((ok, no) => { const sc = document.createElement('script'); sc.src = DEMO ? 'https://cdnjs.cloudflare.com/ajax/libs/qrcode-generator/1.4.4/qrcode.min.js' : '/vendor/qrcode.js'; sc.onload = () => ok(window.qrcode); sc.onerror = () => { QRP = null; no(new Error('qr')); }; document.head.appendChild(sc); }));
  function dialHelp(el) {
    const tel = String(el.getAttribute('href') || '').replace(/^tel:/, ''); if (!tel) return;
    const mobile = /Android|iPhone|iPad/i.test(navigator.userAgent);
    try { window.location.href = 'tel:' + tel; } catch (_) { /* no phone app */ }
    if (mobile) return;
    openModal('<div class="row between" style="margin-bottom:6px"><h2 style="font-size:18px;display:flex;align-items:center;gap:8px">' + ico('phone') + ' โทรหา ' + esc(H.fmtPhone(tel)) + '</h2><button class="icon-btn" data-act="close-modal" aria-label="ปิด">' + ico('x') + '</button></div>' +
      '<div class="dial-g"><div class="dial-qr" id="dial-qr"><span class="small muted">กำลังสร้าง QR…</span></div><div class="dial-t">' +
      '<b>วิธีที่ 1 : สแกนด้วยมือถือที่ใช้โทรงาน</b><p>เปิดกล้องมือถือ ส่องที่ QR แล้วกดโทร สายจะออกจากซิมงาน OneCall บันทึกและนับ KPI ตามปกติ</p>' +
      '<b>วิธีที่ 2 : โทรจากคอมผ่าน Phone Link</b><p>ถ้าจับคู่มือถือกับคอมไว้ ระบบเปิด Phone Link ให้แล้ว กด โทร ในหน้าต่างนั้นได้เลย</p>' +
      '<div class="row" style="gap:8px;margin-top:6px"><button class="btn sm" data-act="copy" data-v="' + esc(tel) + '">' + ico('clip') + ' คัดลอกเบอร์</button><a class="btn sm" href="tel:' + esc(tel) + '">' + ico('phone') + ' เปิดโปรแกรมโทรอีกครั้ง</a></div></div></div>' +
      '<div class="small muted" style="margin-top:12px">ระบบเริ่มจับเวลาสายแล้ว : กลับมาบันทึกผลการโทรได้เลยหลังวางสาย</div>');
    loadQr().then((qr) => { const q = qr(0, 'M'); q.addData('tel:' + tel); q.make(); const box = document.getElementById('dial-qr'); if (box) box.innerHTML = q.createSvgTag({ cellSize: 6, margin: 2, scalable: true }); }).catch(() => { const box = document.getElementById('dial-qr'); if (box) box.innerHTML = '<b style="font-size:22px">' + esc(H.fmtPhone(tel)) + '</b>'; });
  }
  function openModal(html) { closeModal(); modal = document.createElement('div'); modal.innerHTML = '<div class="scrim modal-scrim" data-act="close-modal"></div><div class="modal" role="dialog">' + html + '</div>'; document.body.appendChild(modal); const f = $('input,select,textarea', modal); f && f.focus(); }
  function closeModal() { if (modal) { modal.remove(); modal = null; } }
  function addCustomerModal() {
    const tele = H.teles(S.full || V());
    openModal('<div class="row between" style="margin-bottom:14px"><h2 style="font-size:18px">เพิ่มลูกค้า</h2><button class="icon-btn" data-act="close-modal" aria-label="ปิด">' + ico('x') + '</button></div><form class="form" data-form="add-customer">' +
      '<div class="f2"><label class="field"><span>ชื่อ-นามสกุล <em>*</em></span><input class="in" name="name" required></label><label class="field"><span>เบอร์ติดต่อ <em>*</em></span><input class="in" name="phone" inputmode="tel" required></label></div>' +
      '<label class="field"><span>ที่อยู่</span><textarea class="in" name="address"></textarea></label>' +
      '<div class="f2"><label class="field"><span>ช่องทาง</span><select class="in" name="channel"><option value="fb"' + (ui.custTab === 'fb' ? ' selected' : '') + '>FB Page</option><option value="ecom"' + (ui.custTab === 'ecom' ? ' selected' : '') + '>E-Commerce</option></select></label>' +
      '<label class="field"><span>แพลตฟอร์ม</span><select class="in" name="platform"><option value="">ตามช่องทาง</option><option value="lazada">Lazada</option><option value="shopee">Shopee</option><option value="tiktok">TikTok Shop</option><option value="evolution">E-Commerce</option><option value="manual">เพิ่มเอง</option></select></label></div>' +
      (boss() ? '<label class="field"><span>ให้เซลล์</span><select class="in" name="owner"><option value="">ยังไม่แจก</option>' + tele.map((u) => '<option value="' + u.id + '">' + esc(u.name) + '</option>').join('') + '</select></label>' : '') +
      '<label class="field"><span>โน้ต</span><input class="in" name="note"></label><button class="btn primary">บันทึกลูกค้า</button></form>');
  }
  function newApptModal() {
    const v = V();
    const list = (v.customers || []).filter((c) => boss() || c.owner === S.me.id);
    openModal('<div class="row between" style="margin-bottom:14px"><h2 style="font-size:18px">เพิ่มนัดโทร</h2><button class="icon-btn" data-act="close-modal" aria-label="ปิด">' + ico('x') + '</button></div><form class="form" data-form="new-appt">' +
      '<label class="field"><span>ลูกค้า <em>*</em> (พิมพ์ชื่อหรือเบอร์)</span><input class="in" name="cust" list="appt-cust" required autocomplete="off"></label><datalist id="appt-cust">' + list.slice(0, 600).map((c) => '<option value="' + esc(c.name + ' : ' + H.fmtPhone(c.phone)) + '"></option>').join('') + '</datalist>' +
      '<div class="f2"><label class="field"><span>วันเวลา <em>*</em></span><input class="in" type="datetime-local" name="at" required value="' + ui.calDay + 'T10:00"></label><label class="field"><span>รอบ</span><select class="in" name="round"><option value="">-</option><option>T1</option><option>T2</option><option>T3</option></select></label></div>' +
      '<label class="field"><span>นัดเพื่อ</span><input class="in" name="purpose" placeholder="โทรติดตาม"></label><button class="btn primary">บันทึกนัด</button></form>');
  }
  function bellModal() {
    const v = V(), pend = (v.approvals || []).filter((a) => a.status === 'pending' && (boss() || a.proposed === S.me.id)), od = overdueAppts();
    const today = (v.appointments || []).filter((a) => !a.done && H.dayKey(a.at) === H.today() && Date.parse(a.at) >= Date.now() - 3600000 && (boss() || a.owner === S.me.id));
    openModal('<div class="row between" style="margin-bottom:14px"><h2 style="font-size:18px">การแจ้งเตือน</h2><button class="icon-btn" data-act="close-modal" aria-label="ปิด">' + ico('x') + '</button></div><div class="alerts">' +
      (!boss() && allowed('approvals') ? alertRow('bad', pendingCount(), 'รายชื่อใหม่ที่ยังไม่ได้โทร', 'ระบบแจกให้อัตโนมัติจากแอดมินที่ปิดการขาย', 'approvals') : '') +
      (allowed('calendar') ? alertRow('bad', od.length, 'นัดที่เลยกำหนด', 'ยังไม่ได้โทรตามนัด', 'calendar') + alertRow('info', today.length, 'นัดที่เหลือวันนี้', 'เรียงตามเวลาในปฏิทิน', 'calendar') : '') +
      (S.me.role === 'admin' ? alertRow('info', (v.approvals || []).filter((a) => a.status === 'pending').length, 'รายชื่อที่คุณส่งยังรออนุมัติ', 'หัวหน้าทีมจะส่งให้ Telesales', 'close') : '') + '</div>');
  }

  // ------------------------------------------------------------ login (live)
  async function renderLogin() {
    // Public landing in the CloverX layout: sidebar, banner, announcements, upcoming work, departments.
    // Nothing here shows customer data; the team picks a department, then a name and password.
    let pub = { people: [], announcements: [], upcoming: [] };
    try { pub = await (await fetch('/api/public')).json(); } catch (_) { /* offline */ }
    const people = pub.people || [];
    let last = null;
    try { last = localStorage.getItem('hub-last-user'); } catch (_) { /* ignore */ }
    const DEPTS = [
      { key: 'exec', ico: 'brief', th: 'ผู้บริหาร', en: 'Executive', roles: ['exec', 'lead'], desc: 'ภาพรวมยอดขายทุกช่องทาง KPI ทีม Telesales และงานที่ต้องตัดสินใจ' },
      { key: 'tele', ico: 'headset', th: 'Telesales', en: 'Telesales', roles: ['tele'], desc: 'รายชื่อ E-Commerce และ FB Page, Ticket ลูกค้า, ปฏิทินนัด และบันทึก KPI' },
      { key: 'admin', ico: 'msg', th: 'Admin Sales', en: 'Admin Sales', roles: ['admin'], desc: 'บันทึกการปิดการขายจาก FB Page ระบบแจกรายชื่อให้ Telesales 50:50 อัตโนมัติ' },
    ];
    const T = H.today();
    const anns = (pub.announcements || []).slice(0, 3);
    const ups = (pub.upcoming || []).slice(0, 3);
    const deptCards = DEPTS.map((d) => {
      const who = people.filter((p) => d.roles.includes(p.role));
      return '<button class="card dept" data-login="' + d.key + '"><div class="top"><span class="card-ico">' + ico(d.ico) + '</span><div><h3>' + d.th + '</h3><div class="en">' + d.en + '</div></div></div><p>' + d.desc + '</p>' +
        '<div class="row"><div class="stack">' + who.map((u) => av(u, 'sm')).join('') + '</div><span class="small muted">' + who.map((u) => esc(u.name)).join(', ') + '</span></div>' +
        '<div class="stat"><div><b class="link" style="font-size:14px">เข้าสู่ระบบ ' + d.th + ' →</b></div></div></button>';
    }).join('');
    document.getElementById('app').innerHTML =
      '<div class="shell"><aside class="side" aria-label="เมนู"><div class="brand"><b>EVOLUTION</b><small>Hub Commerce : ทีมขาย Office</small></div>' +
      '<nav class="nav"><button class="on">' + ico('home') + '<span>Home</span></button><div class="nav-label">Departments</div>' +
      DEPTS.map((d) => '<button data-login="' + d.key + '">' + ico(d.ico) + '<span>' + d.en + '</span></button>').join('') + '</nav>' +
      '<div class="side-foot"><b>ติดต่อหัวหน้าทีม</b><span>คุณโม : Teamlead</span><span style="opacity:.75">ลืมรหัสผ่าน แจ้งหัวหน้าทีมได้เลย</span></div></aside>' +
      '<div class="main"><header class="head"><button class="icon-btn burger" data-act="menu" aria-label="เปิดเมนู">' + ico('menu') + '</button><div class="grow"><div class="crumb">Evolution Hub Commerce : หน้าหลัก</div><h1>Home</h1></div>' +
      '<button class="btn primary" data-login="all">' + ico('lock') + ' เข้าสู่ระบบ</button></header>' +
      '<main class="page"><section class="banner"><div class="grow"><h1>Welcome to "Evolution Hub Commerce"</h1><p>' + H.thDate(T) + ' : เลือกฝ่ายงานของคุณเพื่อเริ่มต้นการทำงาน</p></div><div class="stack">' + people.map((u) => av(u)).join('') + '</div></section>' +
      '<div class="grid g2">' +
      card('mega', 'ประกาศข่าวสาร', 'Announcements', anns.length ? '<div class="ann">' + anns.map((a) => '<div class="ann-item"><div><b>' + esc(a.title) + '</b><small>' + H.thDate(a.at, true) + '</small></div></div>').join('') + '</div>' : '<div class="empty">ยังไม่มีประกาศ</div>', '<button class="link" data-login="all">ดูทั้งหมด</button>') +
      card('calendar', 'งานที่กำลังจะมาถึง', 'Upcoming', ups.length ? '<div class="ann">' + ups.map((u) => { const d = new Date(u.day + 'T00:00:00Z'); return '<div class="ev"><div class="datebox"><b>' + d.getUTCDate() + '</b><small>' + H.TH_MON[d.getUTCMonth()] + '</small></div><div><b>นัดโทรลูกค้า ' + u.count + ' นัด</b><div class="small muted">' + (u.day === T ? 'วันนี้' : H.TH_DOW[d.getUTCDay()] + ' ' + H.thDate(u.day)) + ' : Telesales</div></div><span></span></div>'; }).join('') + '</div>' : '<div class="empty">ยังไม่มีนัดที่กำลังจะมาถึง</div>', '<button class="link" data-login="tele">ดูปฏิทิน</button>') + '</div>' +
      '<div class="grid g3">' + deptCards + '</div></main></div></div>';
    const openLogin = (key) => {
      const d = DEPTS.find((x) => x.key === key);
      const list = d ? people.filter((p) => d.roles.includes(p.role)) : people;
      let pick = list.find((p) => p.id === last) ? last : (list.length === 1 ? list[0].id : null);
      const draw = () => {
        const html = ('<div class="row between" style="margin-bottom:6px"><h2 style="font-size:19px">เข้าสู่ระบบ' + (d ? ' : ' + d.th : '') + '</h2><button class="icon-btn" data-act="close-modal" aria-label="ปิด">' + ico('x') + '</button></div><div class="muted small" style="margin-bottom:14px">เลือกชื่อของคุณ แล้วใส่รหัสผ่าน</div>' +
          '<div class="people">' + list.map((p) => '<button type="button" class="person ' + (pick === p.id ? 'on' : '') + '" data-pick="' + p.id + '">' + av(p, 'lg') + '<b>' + esc(p.name) + '</b><small>' + esc(H.ROLES[p.role].label) + '</small></button>').join('') + '</div>' +
          '<form class="form" id="login-f" style="margin-top:14px"' + (pick ? '' : ' hidden') + '><label class="field"><span>รหัสผ่านของ ' + esc((people.find((p) => p.id === pick) || {}).name || '') + '</span><input class="in" type="password" name="password" autocomplete="current-password" required></label><button class="btn primary lg">เข้าสู่ระบบ</button><div class="small" id="login-err" style="color:var(--bad)"></div></form>');
        if (modal) $('.modal', modal).innerHTML = html; else openModal(html);
        $$('[data-pick]', modal).forEach((b) => b.onclick = () => { pick = b.dataset.pick; draw(); });
        const f = $('#login-f', modal); const i = f && $('input', f); if (i && pick) i.focus();
        if (f) f.onsubmit = async (e) => {
          e.preventDefault(); e.stopPropagation();
          const r = await fetch('/api/login', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ id: pick, password: f.password.value }) });
          if (r.ok) { try { localStorage.setItem('hub-last-user', pick); } catch (_) { /* ignore */ } closeModal(); start(); }
          else { const j = await r.json().catch(() => ({})); $('#login-err', modal).textContent = j.error || 'เข้าสู่ระบบไม่สำเร็จ'; }
        };
      };
      draw();
    };
    $$('[data-login]').forEach((b) => b.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); $('.side').classList.remove('open'); openLogin(b.dataset.login); }));
  }

  // ------------------------------------------------------------ render
  function render() {
    if (!S.me) return;
    if (!allowed(S.page)) { S.page = S.me.role === 'tele' ? 'customers' : boss() ? 'overview' : 'home'; try { history.replaceState(null, '', '#' + S.page); } catch (_) { /* sandboxed */ } }
    const fn = { customer: pageCustomer, today: pageToday, home: pageHome, overview: () => pageOverview(), ovtele: () => pageOverview('tele'), ovadmin: () => pageOverview('admin'), customers: pageCustomers, calendar: pageCalendar, kpi: pageKpi, close: pageClose, approvals: pageApprovals, dnc: pageDnc, settings: pageSettings, help: pageHelp }[S.page];
    const keepScroll = $('.drawer-b') ? $('.drawer-b').scrollTop : 0;
    const keepY = render.last === S.page + '|' + (ui.custId || '') ? window.scrollY : null; render.last = S.page + '|' + (ui.custId || '');
    const body = fn();
    document.getElementById('app').innerHTML = shell((PH[S.page] ? (S.page === 'approvals' && !boss() ? pageHead('รายชื่อใหม่', 'ลูกค้าที่แอดมินปิดการขายแล้ว ระบบส่งมาให้คุณโทรดูแลต่ออัตโนมัติ') : pageHead(PH[S.page][0], PH[S.page][1])) : '') + body);
    if ($('.drawer-b') && keepScroll) $('.drawer-b').scrollTop = keepScroll;
    if (keepY != null && Math.abs(window.scrollY - keepY) > 2) window.scrollTo(0, keepY);   // re-render in place (ticking a box, paging) keeps the scroll position
    document.title = PAGES[S.page].t + ' : Evolution Hub Commerce';
    remember();
    liven();
  }
  // ---- motion: numbers count up, bars fill, lines draw — only when the page or its numbers change
  let lastLive = '';
  const NUM_SEL = '.tile .val, .ap-tile b, .lc-total, .kt-c b, .kt td.n b, .dn-c b';
  function liven() {
    const app = document.getElementById('app');
    const els = $$(NUM_SEL, app);
    const key = S.page + '|' + (ui.chart || '') + '|' + els.map((e) => e.textContent).join(',');
    if (key === lastLive) return;
    lastLive = key;
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    app.classList.remove('anim'); void app.offsetWidth; app.classList.add('anim');
    clearTimeout(liven.t); liven.t = setTimeout(() => app.classList.remove('anim'), 1600);
    for (const el of els) {
      const node = [...el.childNodes].find((n) => n.nodeType === 3 && /\d/.test(n.nodeValue));
      if (!node) continue;
      const m = /^([^\d-]*)([\d,]+(?:\.\d+)?)(.*)$/.exec(node.nodeValue);
      if (!m) continue;
      const target = Number(m[2].replace(/,/g, '')); if (!target) continue;
      const dec = (m[2].split('.')[1] || '').length, t0 = performance.now(), dur = 900;
      const fmt = (v) => m[1] + v.toLocaleString('en-US', { minimumFractionDigits: dec, maximumFractionDigits: dec }) + m[3];
      const step = (t) => { const k = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - k, 3); node.nodeValue = fmt(k < 1 ? (dec ? target * e : Math.round(target * e)) : target); if (k < 1) requestAnimationFrame(step); };
      node.nodeValue = fmt(0); requestAnimationFrame(step);
    }
  }

  // ------------------------------------------------------------ events
  let timers = {};
  const handlers = {
    menu: () => $('.side').classList.toggle('open'),
    bell: bellModal,
    'close-modal': closeModal,
    logout: async () => { await fetch('/api/logout', { method: 'POST' }); location.reload(); },
    refresh: async () => { await api.refresh(true); render(); toast('อัปเดตข้อมูลแล้ว'); },
    'demo-user': (el) => { S.me = H.userById(S.full, el.dataset.id); S.view = H.visibleState(S.full, S.me); try { localStorage.setItem('hub-demo-user', S.me.id); } catch (_) { /* ignore */ } ui.owner = 'all'; if (!allowed(S.page)) S.page = 'home'; render(); toast('กำลังดูในมุมมองของ ' + S.me.name); },
    'demo-reset': () => { S.full = window.HubDemoSeed.build(); S.view = H.visibleState(S.full, S.me); api.saveDemo(); render(); toast('สร้างข้อมูลตัวอย่างใหม่แล้ว'); },
    chart: (el) => { ui.chart = el.dataset.v; render(); },
    ctab: (el) => { ui.custTab = el.dataset.v; ui.round = 'all'; resetList('cust'); render(); },
    cround: (el) => { ui.round = el.dataset.v; resetList('cust'); render(); },
    cowner: (el) => { ui.owner = el.dataset.v; resetList('cust'); render(); },
    'cal-owner': (el) => { ui.calOwner = el.dataset.v; resetList('calday'); resetList('callate'); render(); },
    'kpi-user': (el) => { ui.kpiUser = el.dataset.v; resetList('kpi'); render(); },
    'close-admin': (el) => { ui.closeAdmin = el.dataset.v; resetList('close'); render(); },
    // ---- v2 pages
    cview: (el) => { ui.cView = el.dataset.v; resetList('cust'); render(); },
    'cust-io': () => go('settings'),
    'row-menu': (el) => {
      const c = H.findCustomer(S.full || V(), el.dataset.id); if (!c) return;
      const box = openPop(el, '<div class="menu"><button data-m="open">' + ico('users') + ' เปิดรายละเอียด</button><button data-m="call">' + ico('phone') + ' บันทึกการโทร</button><button data-m="appt">' + ico('calendar') + ' นัดหมาย</button><button data-m="assign">' + ico('users') + ' เปลี่ยนผู้ดูแล</button><button data-m="dnc" class="danger">' + ico('ban') + ' ยกเลิกการติดต่อ</button>' + (boss() ? '<button data-m="del" class="danger">' + ico('x') + ' ลบลูกค้า</button>' : '') + '</div>', 'menu-pop');
      box.addEventListener('click', (e) => { const b = e.target.closest('[data-m]'); if (!b) return; closePop(); if (b.dataset.m === 'del') delCustomers([c]); else if (b.dataset.m === 'assign') assignModal([c]); else if (b.dataset.m === 'dnc') dncModal([c]); else openCustomer(c.id, b.dataset.m === 'appt' ? 'appt' : 'call'); });
    },
    'appt-menu': (el) => {
      const a = (V().appointments || []).find((x) => x.id === el.dataset.id); if (!a) return;
      const box = openPop(el, '<div class="menu"><button data-m="done">' + ico('check') + ' โทรแล้ว</button><button data-m="shift">เลื่อนไปพรุ่งนี้</button><button data-m="del" class="danger">' + ico('x') + ' ลบนัด</button></div>', 'menu-pop');
      box.addEventListener('click', (e) => { const b = e.target.closest('[data-m]'); if (!b) return; closePop();
        if (b.dataset.m === 'done') run(() => api.act('updateAppt', { id: a.id, patch: { done: true } }), 'ทำเครื่องหมายว่าโทรแล้ว');
        else if (b.dataset.m === 'shift') run(() => api.act('updateAppt', { id: a.id, patch: { at: new Date(Date.parse(a.at) + 86400000).toISOString() } }), 'เลื่อนนัดไปพรุ่งนี้แล้ว');
        else delAppts('calpanel', [a]); });
    },
    'me-menu': (el) => {
      const box = openPop(el, '<div class="menu">' + (boss() ? '<button data-go="settings">' + ico('gear') + ' ตั้งค่าระบบ</button>' : '') + (DEMO ? '<div class="small muted" style="padding:6px 10px">โหมดตัวอย่าง : สลับคนได้ที่แถบด้านบน</div>' : '<button data-m="out">' + ico('logout') + ' ออกจากระบบ</button>') + '</div>', 'menu-pop');
      box.addEventListener('click', async (e) => { if (e.target.closest('[data-m=out]')) { await fetch('/api/logout', { method: 'POST' }); location.reload(); } });
    },
    'cd-back': () => go(ui.custBack && allowed(ui.custBack) && ui.custBack !== 'customer' ? ui.custBack : 'customers'),
    'cd-step': (el) => { const list = LVITEMS.cust && LVITEMS.cust.length ? LVITEMS.cust : custList(); const i = list.findIndex((x) => x.id === ui.custId) + Number(el.dataset.v); if (list[i]) openCustomer(list[i].id); },
    'cd-edit': () => { const c = H.findCustomer(S.full || V(), ui.custId); openModal('<div class="row between" style="margin-bottom:12px"><h2 style="font-size:18px">แก้ไขข้อมูลลูกค้า</h2><button class="icon-btn" data-act="close-modal" aria-label="ปิด">' + ico('x') + '</button></div>' + editForm(c)); },
    'cd-order': () => { const c = H.findCustomer(S.full || V(), ui.custId); openModal('<div class="row between" style="margin-bottom:12px"><h2 style="font-size:18px">เพิ่มคำสั่งซื้อ</h2><button class="icon-btn" data-act="close-modal" aria-label="ปิด">' + ico('x') + '</button></div>' + orderForm(c)); },
    'cd-dial': (el) => { dialHelp(el); cdTimer0 = cdTimer0 || Date.now(); clearInterval(qTick); qTick = setInterval(() => { const d = $('#cd-dur'); if (!d || !cdTimer0) { clearInterval(qTick); return; } if (!d.dataset.touched) { const sec = Math.round((Date.now() - cdTimer0) / 1000); d.value = String(Math.floor(sec / 60)).padStart(2, '0') + ':' + String(sec % 60).padStart(2, '0'); } }, 1000); try { window.location.href = el.getAttribute('href'); } catch (_) { /* no dialer */ } },
    'cd-quick': (el) => { const f = el.closest('form'); const n = Number(el.dataset.v); $$('[data-act=cd-quick]', f).forEach((b) => b.classList.toggle('on', b === el)); f.nd.dataset.touched = '1'; if (!n && el.dataset.v === '0') { f.nd.value = ''; f.np.value = ''; $('[data-next-fields]', f).hidden = true; nextSum(f); return; } f.nd.value = H.addDays(H.today(), n); if (!f.np.value) f.np.value = n >= 25 ? 'T3 ชวนสั่งซ้ำ' : n >= 7 ? 'T2 ถามผลการใช้' : 'โทรติดตาม'; nextSum(f); },
    'cd-next-edit': (el) => { const f = el.closest('form'); const box = $('[data-next-fields]', f); box.hidden = !box.hidden; if (!box.hidden) f.nd.focus(); },
    'cd-notes': () => { ui.cdAllNotes = !ui.cdAllNotes; render(); },
    'cal-pick': (el) => { ui.calDay = el.dataset.v; ui.calMonth = ui.calDay.slice(0, 7); ui.calPanel = 'day'; ls('calpanel').page = 1; render(); },
    'cal-late': () => { ui.calPanel = 'late'; ls('calpanel').page = 1; render(); },
    'cal-panel-day': () => { ui.calPanel = 'day'; render(); },
    'cp-page': (el) => { ls('calpanel').page = Number(el.dataset.v); render(); },
    // ---- call queue
    'tq-bucket': (el) => { ui.tq.bucket = el.dataset.v; qCur = null; render(); },
    'tq-user': (el) => { ui.tq.user = el.dataset.v; qCur = null; qSkipped.clear(); render(); },
    'q-dial': (el) => { dialHelp(el);
      if (!qTimer0) qTimer0 = Date.now();
      clearInterval(qTick); qTick = setInterval(() => { const t = $('#q-timer'); if (!t || !qTimer0) { clearInterval(qTick); return; } t.textContent = H.hms((Date.now() - qTimer0) / 1000); t.classList.add('on'); }, 1000);
      try { window.location.href = el.getAttribute('href'); } catch (_) { /* dialer not available */ }
    },
    'q-sub': (el) => { const card = el.closest('.q-card'); $$('.q-btn', card).forEach((b) => b.classList.toggle('on', b === el)); $$('.q-sub', card).forEach((x) => { x.hidden = x.dataset.sub !== el.dataset.v; }); },
    'q-lost': (el) => { const box = $('[data-lost]', el.closest('.q-sub')); box.hidden = !box.hidden; },
    'q-save': (el) => qSave(el),
    'q-prod': (el) => { qCart[el.dataset.code] = (qCart[el.dataset.code] || 0) + 1; $('#q-cart').innerHTML = qCartHtml(); },
    'q-unprod': (el) => { delete qCart[el.dataset.code]; $('#q-cart').innerHTML = qCartHtml(); },
    'q-pay': (el) => { $$('button', el.parentElement).forEach((b) => b.classList.toggle('on', b === el)); },
    'q-later': (el) => { $('#q-later-at').value = plusDays(Number(el.dataset.d), el.dataset.t); qSave({ dataset: { r: 'followup-custom' } }); },
    'q-skip': () => { if (qCur) qSkipped.add(qCur); qCur = null; render(); },
    'q-unskip': () => { qSkipped.clear(); render(); },
    'q-jump': (el) => { qCur = el.dataset.id; qSkipped.delete(qCur); qTimer0 = null; render(); },
    // ---- list standard
    'dd-open': (el) => openDropdown(el),
    'dr-open': (el) => openDateRange(el),
    'search-clear': (el) => { const key = el.dataset.key; if (key === 'cust') ui.q = ''; const i = $('#q-' + key); if (i) { i.value = ''; i.focus(); } const x = $('.search [data-key="' + key + '"].s-x'); if (x) x.hidden = true; resetList(key); refreshList(key); },
    'filters-clear': () => { ui.cStatus = []; ui.round = 'all'; ui.owner = 'all'; ui.dr.cust = { mode: 'all' }; resetList('cust'); render(); },
    'ls-page': (el) => { ls(el.dataset.key).page = Number(el.dataset.v); refreshList(el.dataset.key); const box = $('#lv-' + el.dataset.key) || el.closest('.card'); if (box && box.getBoundingClientRect().top < 0) box.scrollIntoView({ block: 'start' }); },
    'ls-per': (el) => { const st = ls(el.dataset.key); st.per = Number(el.dataset.v); st.page = 1; refreshList(el.dataset.key); },
    'ls-xck': (el) => { const s2 = xsel(el.dataset.k); el.checked ? s2.add(el.dataset.id) : s2.delete(el.dataset.id); render(); },
    'ls-xall': (el) => { const d = XL[el.dataset.k], s2 = xsel(el.dataset.k); if (!d) return; if (el.checked) d.items.forEach((x) => s2.add(String(d.id(x)))); else s2.clear(); render(); },
    'x-clear': (el) => { xsel(el.dataset.k).clear(); render(); },
    'x-export': (el) => { const d = XL[el.dataset.k]; if (!d) return; const s2 = xsel(el.dataset.k); xRun(d, s2.size ? d.items.filter((x) => s2.has(String(d.id(x)))) : d.items); },
    'ls-lvall': (el) => { const key = el.dataset.key, s2 = sel(key); s2.ids = new Set(); s2.all = !!el.checked; refreshList(key); },
    'lv-xlsx': (el) => { const key = el.dataset.key, d = XL['lv:' + key], items = LVITEMS[key] || [], s2 = sel(key); if (!d) return; xRun(d, s2.all ? items : s2.ids.size ? items.filter((x) => s2.ids.has(LVID[key](x))) : items); },
    'ls-check': (el) => {
      const key = el.dataset.key, s = sel(key);
      if (s.all) { s.all = false; s.ids = new Set((LVITEMS[key] || []).map(LVID[key])); }
      el.checked ? s.ids.add(el.dataset.id) : s.ids.delete(el.dataset.id);
      refreshList(key);
    },
    'ls-pageall': (el) => {
      const key = el.dataset.key, s = sel(key), st = ls(key);
      const pageIds = (LVITEMS[key] || []).slice((st.page - 1) * st.per, st.page * st.per).map(LVID[key]);
      if (s.all) { s.all = false; s.ids = new Set((LVITEMS[key] || []).map(LVID[key])); }
      pageIds.forEach((id) => (el.checked ? s.ids.add(id) : s.ids.delete(id)));
      refreshList(key);
    },
    'ls-selall': (el) => { sel(el.dataset.key).all = true; refreshList(el.dataset.key); },
    'ls-clear': (el) => { SEL[el.dataset.key] = { ids: new Set(), all: false }; refreshList(el.dataset.key); },
    // customers bulk
    'cust-assign': () => assignModal(selectedOf('cust')),
    'cust-dnc': () => dncModal(selectedOf('cust')),
    'cd-assign': () => { const c = H.findCustomer(S.full || V(), ui.custId); if (c) assignModal([c], true); },
    'cust-status': () => {
      const items = selectedOf('cust');
      openModal('<div class="row between" style="margin-bottom:10px"><h2 style="font-size:18px">เปลี่ยนสถานะ ' + N(items.length) + ' รายการ</h2><button class="icon-btn" data-act="close-modal" aria-label="ปิด">' + ico('x') + '</button></div><div class="result-grid">' +
        Object.entries(H.STATUS).map(([k, x]) => '<button data-set-status="' + k + '"><b>' + esc(x.label) + '</b></button>').join('') + '</div>');
      $$('[data-set-status]', modal).forEach((b) => b.onclick = () => { closeModal(); run(async () => { const r = await api.act('bulkUpdateCustomers', { ids: items.map((c) => c.id), patch: { status: b.dataset.setStatus } }); SEL.cust = null; return r; }, (r) => 'เปลี่ยนสถานะแล้ว ' + N(r.updated) + ' รายการ'); });
    },
    'cust-export': () => {
      const items = selectedOf('cust');
      downloadCsv('customers-' + H.today() + '.csv', [['ชื่อ', 'เบอร์', 'ที่อยู่', 'ช่องทาง', 'แพลตฟอร์ม', 'เซลล์', 'สถานะ', 'รอบ', 'ยอดซื้อรวม', 'ออเดอร์ล่าสุด', 'สินค้าล่าสุด']].concat(items.map((c) => { const o = (c.orders || [])[0] || {}; return [c.name, H.fmtPhone(c.phone), c.address, c.channel === 'fb' ? 'FB Page' : 'E-Commerce', (H.PLATFORMS[c.platform] || {}).label || c.platform, uname(c.owner), (H.STATUS[c.status] || {}).label, c.round, H.customerTotal(c), o.date ? H.thDate(o.date) : '', (o.items || []).map((i) => i.name + ' x' + i.qty).join(', ')]; })));
    },
    'cust-del': () => delCustomers(selectedOf('cust')),
    'cust-del-one': (el) => delCustomers([H.findCustomer(S.full || V(), el.dataset.id)].filter(Boolean)),
    // kpi bulk
    'kpi-del-sel': () => delKpi(selectedOf('kpi')),
    'kpi-del-one': (el) => delKpi((V().kpi || []).filter((k) => k.id === el.dataset.id)),
    // appointments bulk
    'appt-done-sel': (el) => { const ids = selectedOf(el.dataset.key).map((a) => a.id); run(async () => { const r = await api.act('updateApptMany', { ids, done: true }); SEL[el.dataset.key] = null; return r; }, (r) => 'ทำเครื่องหมายว่าโทรแล้ว ' + N(r.updated) + ' นัด'); },
    'appt-shift-sel': (el) => { const ids = selectedOf(el.dataset.key).map((a) => a.id); run(async () => { const r = await api.act('updateApptMany', { ids, shiftDays: 1 }); SEL[el.dataset.key] = null; return r; }, (r) => 'เลื่อนไปพรุ่งนี้ ' + N(r.updated) + ' นัด'); },
    'appt-del-sel': (el) => delAppts(el.dataset.key, selectedOf(el.dataset.key)),
    'appt-del-one': (el) => delAppts(el.dataset.key, (V().appointments || []).filter((a) => a.id === el.dataset.id)),
    // closes bulk
    'close-del-sel': () => delCloses(selectedOf('close')),
    'close-del-one': (el) => delCloses((V().approvals || []).filter((a) => a.id === el.dataset.id)),
    // approvals bulk
    'ap-ok-sel': (el) => { const ids = selectedOf(el.dataset.key).map((a) => a.id); run(async () => { const r = await api.act('approveMany', { ids }); SEL[el.dataset.key] = null; return r; }, (r) => 'อนุมัติ ' + N(r.approved) + ' รายชื่อแล้ว'); },
    'ap-no-sel': (el) => { const items = selectedOf(el.dataset.key); confirmDelete({ title: 'ไม่ส่งรายชื่อให้ Telesales', verb: 'ไม่ส่ง', count: items.length, names: items.map((a) => (H.findCustomer(S.full || V(), a.customerId) || {}).name || '-'), onOk: () => run(async () => { const r = await api.act('rejectMany', { ids: items.map((a) => a.id) }); SEL[el.dataset.key] = null; return r; }, (r) => 'ไม่ส่ง ' + N(r.rejected) + ' รายชื่อ') }); },
    'add-customer': addCustomerModal,
    'close-drawer': () => { ui.drawer = null; render(); },
    dtab: (el) => { ui.dTab = el.dataset.v; render(); },
    copy: async (el) => { try { await navigator.clipboard.writeText(el.dataset.text); toast('คัดลอกแล้ว'); } catch (_) { const r = document.createRange(); r.selectNodeContents(el.previousElementSibling || el); getSelection().removeAllRanges(); getSelection().addRange(r); toast('เลือกข้อความแล้ว กด Ctrl+C เพื่อคัดลอก'); } },
    'pick-result': (el) => {
      const f = el.closest('form'); $$('.result-grid button', f).forEach((b) => b.classList.toggle('on', b === el)); f.result.value = el.dataset.v;
      $('[data-show=lost]', f).hidden = el.dataset.v !== 'lost';
      $('[data-show=sold]', f).hidden = !['won', 'awaiting_payment'].includes(el.dataset.v);
      if (['followup', 'warm', 'info', 'hot', 'no_answer'].includes(el.dataset.v) && !f.nextAt.value) { f.nextAt.value = plusDays(el.dataset.v === 'no_answer' ? 0 : 1, el.dataset.v === 'no_answer' ? '16:00' : '10:00'); f.nextPurpose.value = f.nextPurpose.value || (el.dataset.v === 'no_answer' ? 'โทรซ้ำ ลูกค้าไม่รับสาย' : 'โทรติดตามตามนัด'); }
    },
    'quick-next': (el) => { const f = el.closest('form'); const n = Number(el.dataset.v); f.nextAt.value = plusDays(n); if (!f.nextPurpose.value) f.nextPurpose.value = n >= 25 ? 'T3 ชวนสั่งซ้ำ' : n >= 7 ? 'T2 ถามผลการใช้ เสนออัปเซล' : 'โทรติดตาม'; },
    'quick-appt': (el) => { const f = el.closest('form'); f.at.value = plusDays(Number(el.dataset.v), Number(el.dataset.v) === 0 ? '16:00' : '10:00'); },
    'item-add': (el) => { const box = document.getElementById(el.dataset.target); box.insertAdjacentHTML('beforeend', itemRow()); $$('.item-row', box).pop().querySelector('input').focus(); },
    'item-del': (el) => { const row = el.closest('.item-row'); const box = row.parentElement; if (box.children.length > 1 || box.id === 'prod-edit') row.remove(); else $$('input', row).forEach((i) => { i.value = i.dataset.item === 'qty' ? 1 : ''; }); updateTotals(box); },
    timer: (el) => {
      const box = el.closest('[data-timer]'); const f = el.closest('form'); const key = box.dataset.timer;
      if (timers[key]) { clearInterval(timers[key].iv); const sec = Math.round((Date.now() - timers[key].t0) / 1000); delete timers[key]; f[key + 'h'].value = Math.floor(sec / 3600) || ''; f[key + 'm'].value = Math.floor(sec % 3600 / 60) || ''; f[key + 's'].value = sec % 60; el.innerHTML = ico('play') + ' จับเวลาใหม่'; return; }
      const t0 = Date.now(); timers[key] = { t0, iv: setInterval(() => { const b = $('b', box); if (b) b.textContent = H.hms((Date.now() - t0) / 1000); }, 500) };
      el.innerHTML = ico('stop') + ' หยุด (วางสาย)';
    },
    'seg-pick': (el) => { const seg = el.closest('[data-seg]'); $$('button', seg).forEach((b) => b.classList.toggle('on', b === el)); const f = el.closest('form'); f[seg.dataset.seg].value = el.dataset.v; const h = $('[data-round-hint]', f); if (h) h.textContent = H.ROUNDS[el.dataset.v] || ''; },
    'cal-day': (el) => { ui.calDay = el.dataset.v; ui.calMonth = ui.calDay.slice(0, 7); resetList('calday'); render(); },
    'cal-nav': (el) => {
      const n = Number(el.dataset.v);
      if (ui.calView === 'day') { ui.calDay = H.addDays(ui.calDay, n); ui.calMonth = ui.calDay.slice(0, 7); }
      else if (ui.calView === 'week') { ui.calDay = H.addDays(ui.calDay, 7 * n); ui.calMonth = ui.calDay.slice(0, 7); }
      else { let [y, m] = ui.calMonth.split('-').map(Number); m += n; if (m < 1) { m = 12; y--; } if (m > 12) { m = 1; y++; } ui.calMonth = y + '-' + String(m).padStart(2, '0'); ui.calDay = ui.calMonth === H.today().slice(0, 7) ? H.today() : ui.calMonth + '-01'; }
      resetList('calday'); render();
    },
    'cal-today': () => { ui.calMonth = H.today().slice(0, 7); ui.calDay = H.today(); resetList('calday'); render(); },
    'cal-view': (el) => { ui.calView = el.dataset.v; ui.calMonth = ui.calDay.slice(0, 7); render(); },
    'cal-jump-late': () => { const el = $('#cal-late'); if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' }); },
    'new-appt': newApptModal,
    'appt-done': (el) => run(() => api.act('updateAppt', { id: el.dataset.id, patch: { done: true } }), 'ทำเครื่องหมายว่าโทรแล้ว'),
    'appt-shift': (el) => { const a = (V().appointments || []).find((x) => x.id === el.dataset.id); run(() => api.act('updateAppt', { id: a.id, patch: { at: new Date(Date.parse(a.at) + 86400000).toISOString() } }), 'เลื่อนนัดไปพรุ่งนี้แล้ว'); },
    'kpi-mode': (el) => { ui.kpiMode = el.dataset.v; render(); },
    'kpi-del': (el) => delKpi((V().kpi || []).filter((k) => k.id === el.dataset.id)),
    'nav-toggle': (el) => { ui.navOpen = ui.navOpen || {}; ui.navOpen[el.dataset.v] = !ui.navOpen[el.dataset.v]; remember(); render(); },
    'ap-tab': (el) => { ui.apTab = el.dataset.v; ui.apPage = 1; render(); },
    'q-by': (el) => { ui.qBy = el.dataset.v; render(); },
    'help-open': (el) => { ui.helpOpen = ui.helpOpen === el.dataset.v ? '' : el.dataset.v; render(); },
    'pg': (el) => { ui.pg = ui.pg || {}; ui.pg[el.dataset.k] = Number(el.dataset.v); render(); },
    'ap-page': (el) => { ui.apPage = Number(el.dataset.v); render(); window.scrollTo({ top: 0, behavior: 'smooth' }); },
    'cd-opage': (el) => { ui.cdOPage = Number(el.dataset.v); render(); },
    'cd-npage': (el) => { ui.cdNPage = Number(el.dataset.v); render(); },
    'ap-ok': (el) => { const sel = $('[data-ap-to="' + el.dataset.id + '"]'); run(() => api.act('approve', { id: el.dataset.id, to: sel ? sel.value : undefined }), (r) => 'ส่งรายชื่อให้ ' + uname(r && r.to) + ' แล้ว'); },
    'ap-no': (el) => confirmInline(el, () => run(() => api.act('reject', { id: el.dataset.id }), 'ไม่ส่งรายชื่อนี้')),
    'dnc-restore': (el) => run(() => api.act('restoreCustomer', { id: el.dataset.id }), 'กู้คืนรายชื่อแล้ว : กลับไปอยู่ในรายชื่อลูกค้าสถานะรอติดตาม'),
    'dnc-page': (el) => { ui.dncPage = Number(el.dataset.v); render(); },
    'sync-evo': () => run(async () => { const r = await fetch('/api/sync/evolution', { method: 'POST', credentials: 'same-origin' }); const j = await r.json(); if (!r.ok) throw new Error(j.error || 'ดึงไม่สำเร็จ'); await api.refresh(true); return j; }, (j) => 'ดึง E-Commerce แล้ว : ลูกค้าใหม่ ' + N(j.added || 0) + ' ราย'),
    'copy': (el) => { try { navigator.clipboard.writeText(el.dataset.v); toast('คัดลอก ' + el.dataset.v + ' แล้ว'); } catch (_) {} },
    'bs-install': () => run(async () => { const r = await fetch('/api/bigseller/script-link', { credentials: 'same-origin' }); const j = await r.json(); if (!r.ok) throw new Error(j.error || 'ไม่สำเร็จ'); window.open(j.url, '_blank'); return j; }, 'เปิดหน้าติดตั้งแล้ว : กด Install ใน Tampermonkey'),
    'as-page': (el) => { ui.asPage = Number(el.dataset.v); render(); },
    'ts-page': (el) => { ui.tsPage = Number(el.dataset.v); render(); },
    'ts-csv': () => {
      const st = S.full || V(); let [from, to] = drRange('ov'); if (!from) { from = '2000-01-01'; to = H.today(); }
      const rows = teleSalesRows(st, from, to);
      const q = (v) => '"' + String(v == null ? '' : v).replace(/"/g, '""') + '"';
      const csv = '\ufeff' + ['วันที่,เวลา,ลูกค้า,เบอร์,สินค้า,จำนวน,ยอด,สถานะ,ปิดโดย,รอบ,เวลาคุย(วินาที)'].concat(rows.map((r) => [r.k.date, r.k.at ? H.thTime(r.k.at) : '', r.name, r.phone, r.items.map((i) => i.name).join(' | '), r.items.reduce((u, i) => u + (i.qty || 0), 0), r.total, r.status, r.seller, r.round, r.k.durationSec || 0].map(q).join(','))).join('\n');
      const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' })); a.download = 'tele-sales-' + from + '_' + to + '.csv'; a.click();
    },
    'as-csv': () => {
      const st = S.full || V(); let [from, to] = drRange('ov'); if (!from) { from = '2000-01-01'; to = H.today(); }
      const rows = adminSalesRows(st, from, to);
      const q = (v) => '"' + String(v == null ? '' : v).replace(/"/g, '""') + '"';
      const csv = '\ufeff' + ['วันที่,เวลา,เลขออเดอร์,ลูกค้า,เบอร์,สินค้า,จำนวน,ยอด,สถานะ,ปิดโดย,เพจ,ส่งให้'].concat(rows.map((r) => [H.dayKey(r.at), H.thTime(r.at), r.ext, r.c.name, r.c.phone, r.items.map((i) => i.name).join(' | '), r.items.reduce((u, i) => u + (i.qty || 0), 0), r.total, r.status, r.closer, r.page, uname(r.to)].map(q).join(','))).join('\n');
      const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' })); a.download = 'admin-sales-' + from + '_' + to + '.csv'; a.click();
    },
    'ap-mine-all': () => { const ids = (V().approvals || []).filter((a) => a.status === 'pending' && a.proposed === S.me.id).map((a) => a.id); run(() => api.act('approveMany', { ids }), (r) => 'รับ ' + N(r.approved) + ' รายชื่อแล้ว'); },
    'ap-all': () => run(() => api.act('approveAll', {}), (r) => 'อนุมัติ ' + (r && r.approved) + ' รายชื่อแล้ว'),
    'sync-pancake': () => run(() => api.post('/api/sync/pancake', {}), (r) => 'ดึงจาก Pancake : ' + (r.added || 0) + ' ออเดอร์ใหม่' + (r.error ? ' (' + r.error + ')' : '')),
    'sync-onecall': () => run(() => api.post('/api/sync/onecall', { days: 2 }), (r) => 'ดึงจาก OneCall : ' + (r.added || 0) + ' สาย'),
    'import-legacy': () => run(() => api.post('/api/import/legacy', {}), (r) => 'นำเข้าลูกค้า ' + (r.customers || 0) + ' ราย จากระบบเดิม'),
    'save-user': (el) => { const row = $('[data-user-row="' + el.dataset.id + '"]'); const g = (k) => { const i = $('[data-u=' + k + ']', row); return i ? (i.type === 'checkbox' ? i.checked : i.value) : undefined; }; run(() => api.act('updateUser', { id: el.dataset.id, name: g('name'), off: g('off'), pancakeName: g('pancakeName') }), 'บันทึกข้อมูลทีมแล้ว'); },
    'prod-add': () => { $('#prod-edit').insertAdjacentHTML('beforeend', '<div class="item-row" style="grid-template-columns:110px minmax(0,1fr) 90px 32px"><input class="in" data-p="code" placeholder="รหัส"><input class="in" data-p="name" placeholder="ชื่อสินค้า"><input class="in" type="number" data-p="price" placeholder="ราคา"><button type="button" class="x" data-act="item-del">' + ico('x') + '</button></div>'); },
    'prod-save': () => { const products = $$('#prod-edit .item-row').map((r) => ({ code: $('[data-p=code]', r).value, name: $('[data-p=name]', r).value, price: $('[data-p=price]', r).value })).filter((p) => p.name); run(() => api.act('updateSettings', { products }), 'บันทึกรายการสินค้า ' + products.length + ' รายการ'); },
    'ann-del': (el) => run(() => api.act('deleteAnnouncement', { id: el.dataset.id }), 'ลบประกาศแล้ว'),
  };
  function delCustomers(items) {
    if (!items.length) return;
    const withOrders = items.filter((c) => (c.orders || []).length).length;
    confirmDelete({ title: 'ลบลูกค้า', count: items.length, names: items.map((c) => c.name || H.fmtPhone(c.phone)),
      warn: withOrders ? 'มี ' + N(withOrders) + ' รายที่มีประวัติการสั่งซื้อ การลบจะลบประวัติและนัดของลูกค้าเหล่านี้ด้วย' : '',
      onOk: () => run(async () => { const r = await api.act('deleteCustomers', { ids: items.map((c) => c.id) }); SEL.cust = null; if (ui.drawer && items.some((c) => c.id === ui.drawer)) ui.drawer = null; return r; }, (r) => 'ลบลูกค้าแล้ว ' + N(r.deleted) + ' ราย') });
  }
  function delKpi(items) {
    if (!items.length) return;
    const sold = items.filter((k) => k.amount > 0).length;
    confirmDelete({ title: 'ลบรายการ KPI', count: items.length, names: items.map((k) => (k.mode === 'summary' ? 'สรุปทั้งวัน ' + k.calls + ' สาย' : (k.name || H.fmtPhone(k.phone)))),
      warn: sold ? 'มี ' + N(sold) + ' รายการที่มียอดขาย ยอดจะหายจาก Dashboard ผู้บริหารด้วย' : '',
      onOk: () => run(async () => { const r = await api.act('deleteKpiMany', { ids: items.map((k) => k.id) }); SEL.kpi = null; return r; }, (r) => 'ลบแล้ว ' + N(r.deleted) + ' รายการ') });
  }
  function delAppts(key, items) {
    if (!items.length) return;
    confirmDelete({ title: 'ลบนัด', count: items.length, names: items.map((a) => (H.findCustomer(S.full || V(), a.customerId) || {}).name || 'ลูกค้า'),
      onOk: () => run(async () => { const r = await api.act('deleteApptMany', { ids: items.map((a) => a.id) }); SEL[key] = null; return r; }, (r) => 'ลบนัดแล้ว ' + N(r.deleted) + ' นัด') });
  }
  function delCloses(items) {
    if (!items.length) return;
    const sent = items.filter((a) => a.status === 'approved').length;
    confirmDelete({ title: 'ยกเลิกการปิดการขาย', verb: 'ยกเลิก', count: items.length, names: items.map((a) => ((H.findCustomer(S.full || V(), a.customerId) || {}).name || '-') + ' ' + B(a.total)),
      warn: sent ? 'มี ' + N(sent) + ' รายการที่ส่งให้ Telesales แล้ว ออเดอร์จะถูกลบออกจากประวัติลูกค้าด้วย' : '',
      onOk: () => run(async () => { const r = await api.act('deleteApprovals', { ids: items.map((a) => a.id) }); SEL.close = null; return r; }, (r) => 'ยกเลิกแล้ว ' + N(r.deleted) + ' รายการ') });
  }
  let cdTimer0 = null;
  function openCustomer(id, tab) { if (S.page !== 'customer') ui.custBack = S.page; ui.custId = id; ui.dTab = tab === 'appt' ? 'appt' : 'call'; ui.cdAllNotes = false; cdTimer0 = null; S.page = 'customer'; try { history.replaceState(null, '', '#customer'); } catch (_) { /* sandboxed */ } render(); window.scrollTo(0, 0); if (tab === 'appt') { const n = $('.cd-next'); if (n) { n.scrollIntoView({ block: 'center' }); const d = $('[name=nd]', n); if (d) d.focus({ preventScroll: true }); } } }
  function nextSum(f) {
    const hint = $('[data-next-hint]', f); if (!hint) return;
    hint.innerHTML = f.nd.value ? '<b class="acc">' + H.thDate(f.nd.value).replace(/ \d{4}$/, '') + ' : ' + esc(f.nt.value || '10:30') + ' น.</b>' + (f.np.value ? ' : ' + esc(f.np.value) : '') : 'ไม่นัดต่อ';
  }
  function suggestNext(f) {
    const c = H.findCustomer(S.full || V(), f.dataset.id); const r = f.result.value;
    const hint = $('[data-next-hint]', f);
    if (!c || !r || f.nd.dataset.touched) return;
    const pl = H.planNext(S.full || V(), c, r);
    if (!pl) { f.nd.value = ''; f.np.value = ''; if (hint) hint.textContent = 'ปิดรายชื่อนี้ ไม่ต้องนัดต่อ'; return; }
    const local = localInput(pl.at); f.nd.value = local.slice(0, 10); f.nt.value = local.slice(11, 16); f.np.value = pl.purpose;
    nextSum(f);
  }
  function confirmInline(el, fn) {
    if (el.dataset.confirm) { fn(); return; }
    el.dataset.confirm = '1'; const old = el.innerHTML; el.innerHTML = 'กดอีกครั้งเพื่อยืนยัน'; el.classList.add('danger');
    setTimeout(() => { if (el.isConnected) { delete el.dataset.confirm; el.innerHTML = old; } }, 3000);
  }
  function updateTotals(scope) {
    const form = scope.closest ? scope.closest('form') || document : document;
    $$('[data-total-for]', form).forEach((inp) => { if (inp.dataset.touched) return; const t = readItems(inp.dataset.totalFor).reduce((s, i) => s + i.qty * (Number(i.price) || 0), 0); inp.value = t || ''; });
    $$('[data-sum-of]', form).forEach((b) => { b.textContent = B(readItems(b.dataset.sumOf).reduce((s, i) => s + i.qty * (Number(i.price) || 0), 0)); });
  }

  document.addEventListener('click', (e) => {
    if (e.target.closest('.pop-layer')) return;   // dropdown / date range handle their own clicks
    const cb = e.target.closest('input[type=checkbox][data-act^="ls-"]');
    if (cb) { handlers[cb.dataset.act](cb); return; }
    if (e.target.closest('td.ck, label.ck')) return;
    const nt = e.target.closest('[data-act=nav-toggle]');
    if (nt) { e.preventDefault(); handlers['nav-toggle'](nt); return; }
    const go_ = e.target.closest('[data-go]');
    if (go_ && !go_.closest('form')) { e.preventDefault(); closeModal(); if (go_.dataset.filter === 'due') { ui.cStatus = ['due']; resetList('cust'); } go(go_.dataset.go); return; }
    const a = e.target.closest('[data-act]');
    if (a && handlers[a.dataset.act] && !(a.tagName === 'SELECT' || (a.tagName === 'INPUT' && a.type !== 'button'))) { e.preventDefault(); handlers[a.dataset.act](a, e); return; }
    const op = e.target.closest('[data-open]');
    if (op && op.dataset.open) { e.preventDefault(); closeModal(); closePop(); openCustomer(op.dataset.open, op.dataset.tab); }
  });
  document.addEventListener('reset', (e) => { if (e.target.matches && e.target.matches('[data-form=call2]')) setTimeout(() => { delete ui.cdDraft; render(); }, 0); });
  document.addEventListener('change', (e) => {
    const t = e.target, act = t.dataset.act || t.dataset.actChange;
    if (act === 'kpi-date') { ui.kpiDate = t.value || H.today(); resetList('kpi'); render(); }
    else if (act === 'auto-approve') run(() => api.act('updateSettings', { autoApprove: t.checked }), t.checked ? 'ระบบจะส่งรายชื่อให้ Telesales ทันที' : 'รายชื่อจะรออนุมัติก่อนส่ง');
    else if (act === 'ci-file' && t.files[0]) {
      if (DEMO) { toast('โหมดตัวอย่าง: นำเข้าไฟล์ได้บนเว็บจริง', true); return; }
      (async () => { try { const r = await api.post('/api/upload/contacts', { file: await fileB64(t.files[0]), listSheets: true }); const sel = $('#ci-sheet'); sel.innerHTML = r.sheets.map((n) => '<option' + (/เขม|หวาน|ชีท/.test(n) ? '' : '') + '>' + esc(n) + '</option>').join(''); const pref = r.sheets.find((n) => /ชีท/.test(n)); if (pref) sel.value = pref; } catch (e) { toast(e.message, true); } })();
    }
    else if (act === 'cd-rstep') {
      const f = t.closest('form'); $$('[data-rs]', f).forEach((x) => { x.hidden = x.dataset.rs !== t.value; });
      $$('[name=result]', f).forEach((x) => { x.checked = false; });
      const g = RESULT_STEPS.find((x) => x.id === t.value);
      if (g.id !== 'talk') { const r = $('[data-rs="' + g.id + '"] [name=result][value="' + g.ids[0] + '"]', f); r.checked = true; }
      $('[data-show=lost]', f).hidden = true; f.nd.dataset.touched = ''; suggestNext(f);
      const pb = $('.cd-prod', f); if (pb) { if (g.id === 'sold') $('[data-rs=sold]', f).after(pb); else $('[data-prod-home]', f).after(pb); pb.hidden = g.id === 'none'; pb.classList.toggle('sold', g.id === 'sold'); const ph = $('[data-prod-hint]', pb); if (ph) ph.textContent = g.id === 'sold' ? 'จำเป็น : เลือกสินค้า จำนวน และยอด' : 'ไม่บังคับ : บันทึกว่าลูกค้าสนใจอะไร'; const pt = $('b.small', pb); if (pt) pt.textContent = g.id === 'sold' ? 'สินค้าที่ขาย' : 'สินค้าที่ลูกค้าสนใจ'; }
      if (g.id === 'talk') { const h = $('[data-next-hint]', f); if (h) h.textContent = 'เลือกคำตอบของลูกค้า แล้วระบบจะนัดให้อัตโนมัติ'; }
    }
    else if (act === 'help-q') { ui.helpQ = t.value; ui.pg = ui.pg || {}; ui.pg.help = 1; render(); }
    else if (act === 'ts-q') { ui.tsQ = t.value; ui.tsPage = 1; render(); }
    else if (act === 'ts-user') { ui.tsUser = t.value; ui.tsPage = 1; render(); }
    else if (act === 'ts-rd') { ui.tsRd = t.value; ui.tsPage = 1; render(); }
    else if (act === 'as-q') { ui.asQ = t.value; ui.asPage = 1; render(); }
    else if (act === 'as-admin') { ui.asAdmin = t.value; ui.asPage = 1; render(); }
    else if (act === 'as-pg') { ui.asPg = t.value; ui.asPage = 1; render(); }
    else if (act === 'dnc-q') { ui.dncQ = t.value; ui.dncPage = 1; render(); }
    else if (act === 'cd-result') { const f = t.closest('form'); reasonField(f, t.value); suggestNext(f); if (t.value === 'dnc') nextSum(f); }
    else if (act === 'cd-pline') {
      const f = t.closest('form'); $$('[data-pl]', f).forEach((x) => { x.hidden = x.dataset.pl !== t.value; });
      $$('[name=psize]', f).forEach((x) => { x.checked = false; }); f.prod.value = ''; f.prod.dataset.price = ''; f.prod.dataset.label = '';
      const box = $('[data-pl="' + t.value + '"]', f); const one = box && $$('[name=psize]', box);
      if (one && one.length === 1) { one[0].checked = true; pickSize(f, one[0]); }
      else { $('[data-pp-label]', f).textContent = t.value === 'other' ? 'ระบุชื่อสินค้าด้านบน' : 'เลือกขนาด / จำนวนแพ็ก'; if (t.value === 'other') { f.prodOther.focus(); if (!f.amount.dataset.touched) f.amount.value = ''; } }
    }
    else if (act === 'cd-psize') pickSize(t.closest('form'), t);
    else if (act === 'kpi-channel') { const f = t.closest('form'); const rf = $('[data-round-field]', f); if (rf) rf.hidden = t.value !== 'fb'; }
    if (t.name === 'round' && t.closest('form[data-form=call]')) { const h = $('[data-round-hint]', t.closest('form')); if (h) h.textContent = H.ROUNDS[t.value] || ''; }
  });
  let qTimer = null;
  document.addEventListener('input', (e) => {
    const t = e.target;
    if (t.form && t.form.dataset.form === 'call2' && ['nd', 'nt', 'np'].includes(t.name)) { if (t.name === 'nd') t.dataset.touched = '1'; nextSum(t.form); }
    if (t.dataset.search) {   // search as you type, 250 ms after the last key, back to page 1
      const key = t.dataset.search; const x = t.parentElement.querySelector('.s-x'); if (x) x.hidden = !t.value;
      clearTimeout(qTimer); qTimer = setTimeout(() => { if (key === 'cust') ui.q = t.value; resetList(key); refreshList(key); }, 250); return;
    }
    if (t.dataset.item) {
      const row = t.closest('.item-row');
      if (t.dataset.item === 'name') { const p = products().find((x) => x.code === t.value.trim() || x.name === t.value.trim()); if (p) $('[data-item=price]', row).value = p.price; }
      updateTotals(row); return;
    }
    if (t.dataset.totalFor || t.id === 'q-amount' || (t.name === 'amount' && t.closest('form[data-form=call2]'))) { t.dataset.touched = t.value ? '1' : ''; }
    if (t.id === 'cd-dur') t.dataset.touched = t.value ? '1' : '';
    if ((t.name === 'nd' || t.name === 'nt' || t.name === 'np') && t.closest('form[data-form=call2]')) t.form.nd.dataset.touched = '1';
    if (t.hasAttribute && t.hasAttribute('data-cd-calc')) { const f = t.form; if (f.prod && !f.amount.dataset.touched && f.prod.dataset.price) f.amount.value = Number(f.prod.dataset.price) * (Number(t.value) || 1); }
    if (t.dataset.actInput === 'kpi-phone') { const c = H.byPhone(V(), t.value); const f = t.closest('form'); if (c && f.name && !f.name.value) { f.name.value = c.name; if (c.channel === 'ecom') { f.channel.value = 'mkt'; $('[data-round-field]', f).hidden = true; } } }
    if (t.dataset.actInput === 'close-phone') {
      const hint = $('[data-close-hint]'); const ph = H.normPhone(t.value);
      const c = ph.length >= 9 ? H.byPhone(S.full || V(), ph) : null;
      hint.innerHTML = c ? '<span class="pill info">ลูกค้าเก่า</span> ' + esc(c.name) + (c.owner ? ' : จะส่งกลับให้ ' + esc(uname(c.owner)) + ' ทันที' : '') : (ph.length >= 9 && S.me.role === 'admin' ? '<span class="muted">ลูกค้าใหม่</span>' : '');
      if (c && !t.form.name.value) t.form.name.value = c.name;
      if (c && !t.form.address.value) t.form.address.value = c.address || '';
    }
  });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') { if (pop) closePop(); else if (modal) closeModal(); else if (S.page === 'customer') handlers['cd-back'](); } });

  document.addEventListener('submit', async (e) => {
    const f = e.target; const kind = f.dataset.form; if (!kind) return;
    e.preventDefault();
    const btn = $('button:not([type=button])', f); if (btn) btn.disabled = true;
    try {
      if (kind === 'call2') {
        if (!f.result.value) throw new Error('เลือกผลการโทรก่อนบันทึก');
        const durTxt = f.dur.value.trim(); const parts = durTxt.split(/[:.\s]/).map(Number);
        const durationSec = durTxt ? (parts.length > 1 ? (parts[0] || 0) * 60 + (parts[1] || 0) : (parts[0] || 0) * 60) : (cdTimer0 ? Math.round((Date.now() - cdTimer0) / 1000) : 0);
        const sold = ['won', 'awaiting_payment'].includes(f.result.value);
        const other = f.pline && f.pline.value === 'other' ? f.prodOther.value.trim() : '';
        if (f.pline && f.pline.value === 'other' && !other) throw new Error('พิมพ์ชื่อสินค้าที่ต้องการระบุเอง');
        const prodVal = f.prod.value || other, prodLabel = f.prod.dataset.label || other;
        const qn = Number(f.qty.value) || 1;
        if (sold && !prodVal) { const pb = $('.cd-prod', f); if (pb) pb.scrollIntoView({ block: 'center' }); throw new Error('เลือกสินค้าที่ขายก่อน เพื่อสร้างคำสั่งซื้อ'); }
        const items = prodVal ? [{ name: prodVal, qty: qn, price: other && f.amount.value ? Number(f.amount.value) / qn : undefined }] : [];
        let note = f.note.value.trim();
        if (!sold && prodVal) note = (note ? note + ' : ' : '') + 'สนใจ ' + prodLabel + ' x' + qn;
        const pay = { customerId: f.dataset.id, result: f.result.value, lostReason: f.lostReason.value, round: f.round ? f.round.value : '', durationSec, note, at: fromLocal(f.at.value),
          items: sold ? items : [], amount: sold ? f.amount.value : '' };
        if (f.nd.value) { pay.nextAt = fromLocal(f.nd.value + 'T' + (f.nt.value || '10:30')); pay.nextPurpose = f.np.value; }
        else if (!f.nd.dataset.touched) pay.autoNext = true;
        await api.act('logCall', pay); cdTimer0 = null;
        toast(sold ? 'บันทึกการขายแล้ว : สร้างคำสั่งซื้อ ' + B(Number(pay.amount) || 0) + ' ให้อัตโนมัติ และนับ KPI แล้ว' : 'บันทึกการโทรแล้ว : นับ KPI และอัปเดตนัดหมายให้แล้ว');
      } else if (kind === 'call') {
        if (!f.result.value) throw new Error('เลือกผลการโทรก่อนบันทึก');
        if (timers.d) handlers.timer($('[data-act=timer]', f));
        await api.act('logCall', { customerId: f.dataset.id, result: f.result.value, lostReason: f.lostReason.value, durationSec: readHms(f, 'd'), round: f.round ? f.round.value : '', items: readItems('call-items'), amount: f.amount.value, note: f.note.value, nextAt: fromLocal(f.nextAt.value), nextPurpose: f.nextPurpose.value });
        toast('บันทึกการโทรแล้ว : นับเข้า KPI วันนี้');
      } else if (kind === 'appt') {
        await api.act('addAppt', { customerId: f.dataset.id, at: fromLocal(f.at.value), purpose: f.purpose.value, round: f.round.value }); toast('บันทึกนัดแล้ว');
      } else if (kind === 'order') {
        await api.act('addOrder', { customerId: f.dataset.id, items: readItems('order-items'), date: fromLocal(f.date.value), total: f.total.value, status: f.status.value, note: f.note.value }); closeModal(); toast('เพิ่มคำสั่งซื้อแล้ว');
      } else if (kind === 'edit') {
        await api.act('updateCustomer', { id: f.dataset.id, patch: { name: f.name.value, phone: f.phone.value, address: f.address.value, status: f.status.value, round: f.round ? f.round.value : undefined, owner: f.owner ? f.owner.value : undefined } }); closeModal(); toast('บันทึกข้อมูลลูกค้าแล้ว');
      } else if (kind === 'note') {
        await api.act('addNote', { customerId: ui.custId || ui.drawer, text: f.text.value }); toast('บันทึกโน้ตแล้ว');
      } else if (kind === 'kpi-call' || kind === 'kpi-sum') {
        if (timers.d) handlers.timer($('[data-act=timer]', f));
        const tl = H.teles(S.full || V()); const user = boss() ? (ui.kpiUser && tl.find((u) => u.id === ui.kpiUser) ? ui.kpiUser : (tl[0] || {}).id) : undefined;
        const base = { user, date: f.date.value, channel: f.channel.value, round: f.round.value, note: f.note.value, durationSec: readHms(f, 'd'), amount: f.amount.value };
        if (kind === 'kpi-call') await api.act('addKpi', { ...base, mode: 'call', phone: f.phone.value, name: f.name.value, result: f.result.value, items: readItems('kpi-items') });
        else await api.act('addKpi', { ...base, mode: 'summary', calls: f.calls.value, talkedCount: f.talkedCount.value, orders: f.orders.value, items: readItems('sum-items') });
        toast('บันทึก KPI แล้ว : ขึ้น Dashboard ผู้บริหารทันที');
      } else if (kind === 'close') {
        const r = await api.act('createClose', { name: f.name.value, phone: f.phone.value, address: f.address.value, page: f.page.value, items: readItems('close-items'), total: f.total.value, note: f.note.value, closer: f.closer ? f.closer.value : undefined });
        const ap = (S.full || V()).approvals.find((a) => a.id === (r && r.id)) || (V().approvals || [])[0];
        toast(ap && ap.status === 'approved' ? 'บันทึกแล้ว : ส่งรายชื่อให้ ' + uname(ap.assigned) + ' แล้ว' : 'บันทึกแล้ว : เสนอให้ ' + uname(r && r.proposed) + ' (รออนุมัติ)');
      } else if (kind === 'add-customer') {
        const r = await api.act('addCustomer', { name: f.name.value, phone: f.phone.value, address: f.address.value, channel: f.channel.value, platform: f.platform.value || undefined, owner: f.owner ? f.owner.value : undefined, note: f.note.value });
        closeModal(); toast('เพิ่มลูกค้าแล้ว'); if (r && r.id) { openCustomer(r.id); return; }
      } else if (kind === 'new-appt') {
        const v = V(); const val = f.cust.value; const ph = H.normPhone(val.split(' : ').pop());
        const c = H.byPhone(v, ph) || (v.customers || []).find((x) => x.name === val.trim());
        if (!c) throw new Error('ไม่พบลูกค้า เลือกจากรายการที่แสดง');
        await api.act('addAppt', { customerId: c.id, at: fromLocal(f.at.value), purpose: f.purpose.value, round: f.round.value }); closeModal(); toast('บันทึกนัดแล้ว');
      } else if (kind === 'targets') {
        const targets = {}; for (const k of Object.keys((S.full || V()).settings.targets)) if (f[k]) targets[k] = f[k].value;
        await api.act('updateSettings', { targets, staleDays: { fb: f.staleFb.value, ecom: f.staleEcom.value } }); toast('บันทึกเป้า KPI แล้ว');
      } else if (kind === 'ann') {
        await api.act('addAnnouncement', { title: f.title.value, body: f.body.value }); toast('ประกาศแล้ว');
      } else if (kind === 'contacts-import') {
        const file = f.file.files[0]; if (!file) throw new Error('เลือกไฟล์ Excel ก่อน');
        const r = await api.post('/api/upload/contacts', { file: await fileB64(file), sheet: f.sheet.value, owner: f.owner.value });
        toast('นำเข้า ' + N(r.received) + ' แถว : ลูกค้าใหม่ ' + N(r.added) + ' : รวมกับเดิม ' + N(r.merged) + ' : นัด ' + N(r.appts) + (r.skipped ? ' : เบอร์ไม่ครบ ' + r.skipped : ''));
      } else if (kind === 'ecom-import') {
        const file = f.file.files[0];
        let r;
        if (file && !DEMO && !/\.csv$/i.test(file.name)) {
          const buf = await file.arrayBuffer(); let bin = ''; const bytes = new Uint8Array(buf); for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
          r = await api.post('/api/upload/ecom', { file: btoa(bin), platform: f.platform.value });
        } else {
          const text = file ? await file.text() : f.paste.value;
          const rows = H.parseTable(text); if (!rows.length) throw new Error('ไม่พบข้อมูล ตรวจว่ามีหัวคอลัมน์ "เบอร์" ในแถวแรก');
          if (f.platform.value) rows.forEach((x) => { x.platform = f.platform.value; });
          r = await api.act('ingestEcom', { rows });
        }
        toast('นำเข้า ' + r.received + ' แถว : ลูกค้าใหม่ ' + r.added + ' : ออเดอร์ ' + r.orders + (r.masked ? ' : เบอร์ถูกปิด ' + r.masked : ''));
      }
      render();
    } catch (err) { toast(err.message || String(err), true); if (btn) btn.disabled = false; }
  });

  // ------------------------------------------------------------ boot
  function bootError() {
    document.getElementById('app').innerHTML = '<div class="login"><div class="login-card" style="text-align:center"><h1 style="font-size:20px">โหลดข้อมูลไม่สำเร็จ</h1><div class="muted">ตรวจสอบอินเทอร์เน็ต แล้วลองใหม่อีกครั้ง</div><button class="btn primary lg" data-act="retry">ลองใหม่</button></div></div>';
  }
  handlers.retry = () => { document.getElementById('app').innerHTML = '<div class="boot"><div class="sk"></div><div class="sk"></div><div class="sk short"></div></div>'; start(); };
  async function start() {
    let ok;
    try { ok = await api.boot(); } catch (e) { bootError(); return; }
    if (!ok) { renderLogin(); return; }
    const hash = (location.hash || '').slice(1);
    S.page = PAGES[hash] && allowed(hash) ? hash : (S.me.role === 'tele' ? 'customers' : boss() ? 'overview' : 'home');
    if (hash !== S.page) { try { history.replaceState(null, '', '#' + S.page); } catch (_) { /* sandboxed */ } }
    render();
    if (!DEMO) setInterval(async () => {
      if (document.hidden || modal || ui.drawer || (document.activeElement && /INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName))) return;
      if (await api.refresh().catch(() => false)) render();
    }, 20000);
  }
  start();
})();
