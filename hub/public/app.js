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
    menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
    refresh: '<path d="M20 11a8 8 0 0 0-14.7-4.3L3 9"/><path d="M3 4v5h5"/><path d="M4 13a8 8 0 0 0 14.7 4.3L21 15"/><path d="M21 20v-5h-5"/>',
    lock: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
    mega: '<path d="M3 11v2a1 1 0 0 0 1 1h3l6 4V6L7 10H4a1 1 0 0 0-1 1z"/><path d="M17 8a5 5 0 0 1 0 8"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    link: '<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>',
    upload: '<path d="M12 15V3M7 8l5-5 5 5"/><path d="M4 15v4a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-4"/>',
    logout: '<path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3"/><path d="M10 17l-5-5 5-5M5 12h11"/>',
    pin: '<path d="M12 21s-7-6.2-7-12a7 7 0 0 1 14 0c0 5.8-7 12-7 12z"/><circle cx="12" cy="9" r="2.5"/>',
    bag: '<path d="M5 8h14l-1 13H6z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/>',
    store: '<path d="M4 9l1.5-5h13L20 9"/><path d="M4 9a2.7 2.7 0 0 0 5.3 0 2.7 2.7 0 0 0 5.4 0 2.7 2.7 0 0 0 5.3 0"/><path d="M5 11v9h14v-9"/>',
    note: '<path d="M4 4h16v12l-4 4H4z"/><path d="M16 20v-4h4M8 9h8M8 13h5"/>',
    left: '<path d="M15 5l-7 7 7 7"/>', right: '<path d="M9 5l7 7-7 7"/>',
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
  try { Object.assign(ui, JSON.parse(localStorage.getItem('hub-ui') || '{}'), { drawer: null, q: '' }); } catch (_) { /* storage blocked */ }
  if (ui.calMonth < H.today().slice(0, 7) || ui.kpiDate !== H.today()) { ui.calMonth = H.today().slice(0, 7); ui.calDay = H.today(); ui.kpiDate = H.today(); }
  const remember = () => { try { const { drawer, q, ...rest } = ui; localStorage.setItem('hub-ui', JSON.stringify(rest)); } catch (_) { /* ignore */ } };
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
        S.full = H.normalize(st || window.HubDemoSeed.build());
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
    home: { t: 'หน้าหลัก', crumb: 'Evolution Hub Commerce', ico: 'home' },
    overview: { t: 'ภาพรวมผู้บริหาร', crumb: 'ผู้บริหาร > Overview', ico: 'chart' },
    customers: { t: 'ลูกค้าของฉัน', crumb: 'Telesales > รายชื่อลูกค้า', ico: 'users' },
    calendar: { t: 'ปฏิทินนัดหมาย', crumb: 'Telesales > นัดโทรลูกค้า', ico: 'calendar' },
    kpi: { t: 'บันทึก KPI', crumb: 'Telesales > KPI รายวัน', ico: 'clip' },
    close: { t: 'บันทึกปิดการขาย', crumb: 'Admin Sales > ปิดการขาย', ico: 'cart' },
    approvals: { t: 'รออนุมัติรายชื่อ', crumb: 'แจกรายชื่อ FB Page 50:50', ico: 'inbox' },
    settings: { t: 'ตั้งค่าระบบ', crumb: 'ผู้บริหาร > ตั้งค่า', ico: 'gear' },
  };
  function allowed(page) {
    const r = S.me.role;
    if (page === 'home') return true;
    if (page === 'overview' || page === 'settings') return boss();
    if (['customers', 'calendar', 'kpi'].includes(page)) return boss() || r === 'tele';
    if (page === 'close') return boss() || r === 'admin';
    if (page === 'approvals') return boss() || r === 'tele';
    return false;
  }
  function go(page) {
    if (!allowed(page)) { toast('หน้านี้สำหรับ ' + ({ overview: 'ผู้บริหาร', settings: 'ผู้บริหาร', close: 'Admin Sales', customers: 'Telesales', calendar: 'Telesales', kpi: 'Telesales', approvals: 'Telesales และหัวหน้าทีม' }[page] || ''), true); return; }
    S.page = page; ui.drawer = null;
    try { history.replaceState(null, '', '#' + page); } catch (_) { /* sandboxed */ }
    $('.side') && $('.side').classList.remove('open');
    render(); window.scrollTo(0, 0);
  }
  function pendingCount() { const v = V(); return (v.approvals || []).filter((a) => a.status === 'pending' && (boss() || a.proposed === S.me.id)).length; }
  function overdueAppts() { const now = Date.now(); return (V().appointments || []).filter((a) => !a.done && Date.parse(a.at) < now - 3600000 && (boss() || a.owner === S.me.id)); }

  // ------------------------------------------------------------ shell
  function shell(content) {
    const me = S.me, role = me.role;
    const nb = (id, label) => allowed(id) ? '<button class="' + (S.page === id ? 'on' : '') + '" data-go="' + id + '">' + ico(PAGES[id].ico) + '<span>' + label + '</span>' + (id === 'approvals' && pendingCount() ? '<span class="badge">' + pendingCount() + '</span>' : '') + (id === 'calendar' && overdueAppts().length ? '<span class="badge">' + overdueAppts().length + '</span>' : '') + '</button>' : '';
    const nav = [
      nb('home', 'หน้าหลัก'),
      boss() ? '<div class="nav-label">ผู้บริหาร</div>' + nb('overview', 'ภาพรวม Overview') : '',
      (boss() || role === 'tele') ? '<div class="nav-label">Telesales</div>' + nb('customers', boss() ? 'รายชื่อลูกค้า' : 'ลูกค้าของฉัน') + nb('calendar', 'ปฏิทินนัดหมาย') + nb('kpi', 'บันทึก KPI') + nb('approvals', boss() ? 'รออนุมัติรายชื่อ' : 'รายชื่อใหม่ส่งถึงฉัน') : '',
      (boss() || role === 'admin') ? '<div class="nav-label">Admin Sales</div>' + nb('close', 'บันทึกปิดการขาย') : '',
      boss() ? '<div class="nav-label">ระบบ</div>' + nb('settings', 'ตั้งค่า & การเชื่อมต่อ') : '',
    ].join('');
    const p = PAGES[S.page];
    const bellN = pendingCount() + overdueAppts().length;
    const sync = (V().sync || {}).pancake || {};
    return (DEMO ? demoBar() : '') +
      '<div class="shell"><aside class="side" aria-label="เมนู"><div class="brand"><b>EVOLUTION</b><small>Hub Commerce · ทีมขาย Office</small></div>' +
      '<nav class="nav">' + nav + '</nav>' +
      '<div class="side-foot"><b>สถานะการเชื่อมต่อ</b><span class="live">Pancake ' + (sync.lastRun ? H.thTime(sync.lastRun) + ' น.' : 'รอเชื่อมต่อ') + '</span><span style="opacity:.75">ข้อมูลอัปเดตอัตโนมัติ</span></div></aside>' +
      '<div class="main"><header class="head"><button class="icon-btn burger" data-act="menu" aria-label="เปิดเมนู">' + ico('menu') + '</button>' +
      '<div class="grow"><div class="crumb">' + esc(p.crumb) + '</div><h1>' + esc(p.t) + '</h1></div>' +
      '<button class="icon-btn" data-act="bell" aria-label="การแจ้งเตือน">' + ico('bell') + (bellN ? '<span class="dot"></span>' : '') + '</button>' +
      '<div class="me"><div class="who"><b>สวัสดี, ' + esc(me.name) + '</b><small>' + esc(H.ROLES[me.role].label) + '</small></div>' + av(me) +
      (DEMO ? '' : '<button class="icon-btn" data-act="logout" aria-label="ออกจากระบบ" title="ออกจากระบบ">' + ico('logout') + '</button>') + '</div></header>' +
      '<main class="page" id="page">' + content + '</main></div></div>' + drawerHtml();
  }
  function demoBar() {
    const ppl = (S.full.users || []).map((u) => '<button class="' + (S.me.id === u.id ? 'on' : '') + '" data-act="demo-user" data-id="' + u.id + '">' + esc(u.name) + '</button>').join('');
    return '<div class="demo-bar"><b>โหมดตัวอย่าง</b><span>ข้อมูลลูกค้าเป็นข้อมูลสมมติ ทดลองกดบันทึกได้ทุกปุ่ม · ดูในมุมมองของ</span><div class="seg">' + ppl + '</div><button class="link" data-act="demo-reset">ล้างข้อมูลตัวอย่าง</button></div>';
  }

  // ------------------------------------------------------------ helpers (UI)
  const statusPill = (s) => { const x = H.STATUS[s] || H.STATUS.new; return '<span class="pill dot ' + x.tone + '">' + esc(x.label) + '</span>'; };
  const roundTag = (r) => r ? '<span class="tag ' + r.toLowerCase() + '">' + r + '</span>' : '';
  const platformTag = (p) => '<span class="tag">' + esc((H.PLATFORMS[p] || {}).label || p || '-') + '</span>';
  const srcLabel = { tele: 'Telesales', admin: 'Admin ปิดการขาย', pancake: 'Pancake (Admin)', ecom: 'E-Commerce', manual: 'บันทึกเอง', legacy: 'ระบบเดิม' };
  function rangeOf(key) {
    const t = H.today();
    if (key === 'yesterday') { const y = H.addDays(t, -1); return [y, y, 'เมื่อวาน']; }
    if (key === '7d') return [H.addDays(t, -6), t, '7 วันล่าสุด'];
    if (key === 'month') return [t.slice(0, 8) + '01', t, 'เดือนนี้'];
    return [t, t, 'วันนี้'];
  }
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
    return '<section class="banner"><div class="grow"><h1>ยินดีต้อนรับสู่ Evolution Hub Commerce</h1><p>' + esc(me.name) + ' : ' + H.thDate(T) + ' · เลือกฝ่ายงานด้านล่างเพื่อเริ่มทำงาน</p></div><div class="stack">' + team.map((u) => av(u)).join('') + '</div></section>' +
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
  function pageOverview() {
    const st = S.full || V();
    const [from, to, label] = rangeOf(ui.range);
    const d = H.dashboard(st, from, to);
    const t = st.settings.targets;
    const monthPct = pct(d.monthRev, d.monthTarget);
    const head = '<div class="row between"><div><h2 style="font-size:20px">ภาพรวมทีมขาย : ' + label + '</h2><div class="small muted">' + (from === to ? H.thDate(from) : H.thDate(from) + ' - ' + H.thDate(to)) + ' · ยอด Telesales มาจากบันทึก KPI · ยอดแอดมินมาจาก Pancake/บันทึกปิดการขาย · E-Commerce จาก BigSeller</div></div>' +
      '<div class="row"><div class="seg">' + [['today', 'วันนี้'], ['yesterday', 'เมื่อวาน'], ['7d', '7 วัน'], ['month', 'เดือนนี้']].map(([k, l]) => '<button class="' + (ui.range === k ? 'on' : '') + '" data-act="range" data-v="' + k + '">' + l + '</button>').join('') + '</div>' +
      '<button class="btn sm" data-act="refresh">' + ico('refresh') + ' รีเฟรช</button></div></div>';
    const tiles = '<div class="tiles">' +
      tile('ยอดขายรวม', B(d.total), 'เดือนนี้ ' + B(d.monthRev) + ' : ' + monthPct + '% ของเป้า ' + B(d.monthTarget), 'hero', monthPct) +
      tile('<i style="background:var(--c-tele)"></i>Telesales', B(d.rev.tele), N(d.cnt.tele) + ' ออเดอร์ : ' + N(d.teamSum.calls) + ' สาย') +
      tile('<i style="background:var(--c-admin)"></i>Admin (FB Page)', B(d.rev.admin), N(d.cnt.admin) + ' ออเดอร์ที่แอดมินปิด') +
      tile('<i style="background:var(--c-ecom)"></i>E-Commerce', B(d.rev.ecom), N(d.cnt.ecom) + ' ออเดอร์ Lazada / Shopee / TikTok') +
      tile('ออเดอร์ทั้งหมด', N(d.orders), 'เฉลี่ย ' + B(d.aov) + ' ต่อออเดอร์') +
      tile('งานที่ต้องจัดการ', N(d.pending + d.overdue), 'รออนุมัติ ' + d.pending + ' : เลยนัด ' + d.overdue + ' : เงียบเกินกำหนด ' + d.stale, d.pending + d.overdue ? 'alert' : '') + '</div>';
    const teamCard = '<section class="card"><div class="card-h"><span class="card-ico">' + ico('headset') + '</span><div class="ttl"><h2>KPI Telesales : ' + label + '</h2><small>เป้าต่อคนต่อวัน : FB ' + t.fbCalls + ' สาย (T1 ' + t.t1 + ' · T2 ' + t.t2 + ' · T3 ' + t.t3 + ') · Marketplace ' + t.mktCalls + ' สาย · คุย ' + t.talkMinutes + ' นาที · ยอด ' + B(t.teleRevenue) + (from !== to ? ' · คูณตามจำนวนวันอัตโนมัติ' : '') + '</small></div>' +
      '<button class="btn sm" data-go="kpi">' + ico('clip') + ' ดูรายการที่บันทึก</button></div>' + d.team.map(kpiPerson).join('') + '</section>';
    // daily chart: at least 14 days for context
    const cFrom = H.daysBetween(from, to) < 13 ? H.addDays(to, -13) : from;
    const cd = cFrom === from ? d : H.dashboard(st, cFrom, to);
    const chartCard = '<section class="card"><div class="card-h"><span class="card-ico">' + ico('chart') + '</span><div class="ttl"><h2>ยอดขายรายวัน</h2><small>' + H.thDate(cFrom) + ' - ' + H.thDate(to) + ' : แยกตามช่องทาง</small></div>' +
      '<div class="seg"><button class="' + (ui.chart === 'rev' ? 'on' : '') + '" data-act="chart" data-v="rev">ยอดขาย</button><button class="' + (ui.chart === 'calls' ? 'on' : '') + '" data-act="chart" data-v="calls">จำนวนสาย</button></div></div>' +
      '<div class="legend">' + (ui.chart === 'rev' ? '<span><i style="background:var(--c-tele)"></i>Telesales</span><span><i style="background:var(--c-admin)"></i>Admin FB Page</span><span><i style="background:var(--c-ecom)"></i>E-Commerce</span>' : '<span><i style="background:var(--c-tele)"></i>สายที่ Telesales บันทึก</span>') + '</div>' +
      '<div class="chart-wrap">' + barChart(cd) + '</div></section>';
    const adminMax = Math.max(1, ...d.admins.map((a) => a.revenue));
    const adminCard = card('msg', 'ทีม Admin Sales', 'ยอดปิดการขาย FB Page : เรียงตามยอดเงิน', d.admins.length ? '<div class="rank">' + d.admins.map((a, i) => '<div class="rank-row"><span class="no">' + (i + 1) + '</span><span class="ellip">' + esc(a.name) + '</span><span class="bar"><i style="width:' + pct(a.revenue, adminMax) + '%"></i></span><span class="v">' + B(a.revenue) + ' <small>: ' + a.closes + ' ออเดอร์</small></span></div>').join('') + '</div>' : '<div class="empty">ยังไม่มีการปิดการขายในช่วงนี้</div>');
    const prodCard = card('bag', 'สินค้าขายดี', 'จัดอันดับตามยอดเงิน : ทุกช่องทาง', d.products.length ? '<div class="tbl-wrap"><table class="tbl"><thead><tr><th>สินค้า</th><th class="n">ชิ้น</th><th class="n hide-sm">Tele / Admin / Ecom</th><th class="n">ยอดขาย</th></tr></thead><tbody>' + d.products.map((p) => '<tr><td><div class="ellip">' + esc(p.name) + '</div></td><td class="n">' + N(p.qty) + '</td><td class="n hide-sm muted">' + p.tele + ' / ' + p.admin + ' / ' + p.ecom + '</td><td class="n"><b>' + B(p.revenue) + '</b></td></tr>').join('') + '</tbody></table></div>' : '<div class="empty">ยังไม่มีข้อมูลสินค้าในช่วงนี้</div>');
    const f = d.funnel, fMax = Math.max(1, f.called, f.leads);
    const funnelCard = card('users', 'Funnel การโทร', 'รายชื่อที่ได้รับ → โทร → ได้คุย → ปิดได้', '<div class="funnel">' +
      [['รายชื่อเข้าใหม่', f.leads], ['โทรแล้ว', f.called], ['ได้คุย', f.talked], ['ปิดการขาย', f.won]].map(([l, v]) => '<div class="funnel-row"><span>' + l + '</span><span class="bar"><i style="width:' + Math.max(2, pct(v, fMax)) + '%"></i></span><span class="v">' + N(v) + '</span></div>').join('') +
      '</div><div class="row small muted" style="margin-top:12px;gap:16px"><span>อัตราติดต่อได้ <b style="color:var(--text)">' + pctTxt(d.contactRate) + '</b></span><span>อัตราปิดการขาย <b style="color:var(--text)">' + pctTxt(d.conversion) + '</b></span><span>ยอดต่อสายที่ได้คุย <b style="color:var(--text)">' + B(d.teamSum.talked ? d.teamSum.amount / d.teamSum.talked : 0) + '</b></span></div>');
    const hrs = d.hours.slice(8, 22), hMax = Math.max(1, ...hrs.map((h) => h.calls + h.orders));
    const heatCard = card('clock', 'ช่วงเวลาโทรและขาย', 'จำนวนสาย + ออเดอร์ต่อชั่วโมง (08:00-21:00)', '<div class="heat">' + hrs.map((h, i) => { const v = h.calls + h.orders; return '<div title="' + (i + 8) + ':00 น. : ' + h.calls + ' สาย · ' + h.orders + ' ออเดอร์" style="opacity:' + (0.12 + 0.88 * v / hMax).toFixed(2) + ';color:' + (v / hMax > .5 ? '#fff' : 'var(--text)') + '">' + (v || '') + '</div>'; }).join('') + '</div><div class="heat-lbl">' + hrs.map((h, i) => '<span>' + (i + 8) + '</span>').join('') + '</div>' +
      '<div class="small muted" style="margin-top:10px">ช่วงที่คึกคักที่สุด : <b style="color:var(--text)">' + (hrs.reduce((b, h, i) => (h.calls + h.orders > b.v ? { v: h.calls + h.orders, i } : b), { v: -1, i: 0 }).i + 8) + ':00 น.</b></div>');
    const alerts = '<div class="alerts">' +
      alertRow('bad', d.pending, 'รายชื่อรออนุมัติ', 'แอดมินปิดการขายแล้ว รอส่งให้ Telesales', 'approvals') +
      alertRow('bad', d.overdue, 'นัดโทรที่เลยกำหนด', 'ลูกค้าที่นัดไว้แต่ยังไม่ได้โทร', 'calendar') +
      alertRow('warn', d.stale, 'ลูกค้าเงียบเกินกำหนด', 'FB เกิน ' + st.settings.staleDays.fb + ' วัน · Marketplace เกิน ' + st.settings.staleDays.ecom + ' วัน ไม่มีความเคลื่อนไหว', 'customers', 'due') +
      alertRow('info', d.todayAppts - d.todayApptsDone, 'นัดที่เหลือของวันนี้', 'ทำแล้ว ' + d.todayApptsDone + ' จาก ' + d.todayAppts + ' นัด', 'calendar') + '</div>';
    const lr = Object.entries(d.lostReasons).sort((a, b) => b[1] - a[1]);
    const pf = Object.entries(d.platform).sort((a, b) => b[1] - a[1]), pfMax = Math.max(1, ...pf.map((x) => x[1]));
    const sideCard = card('alert', 'ต้องติดตาม', 'กดเพื่อไปยังรายการ', alerts +
      '<div class="section-t" style="margin-top:16px">E-Commerce แยกแพลตฟอร์ม</div>' + (pf.length ? '<div class="rank" style="margin-top:8px">' + pf.map(([k, v], i) => '<div class="rank-row"><span class="no">' + (i + 1) + '</span><span>' + esc(k) + '</span><span class="bar"><i style="width:' + pct(v, pfMax) + '%;background:var(--c-ecom)"></i></span><span class="v">' + B(v) + '</span></div>').join('') + '</div>' : '<div class="small faint" style="margin-top:6px">ไม่มีออเดอร์ในช่วงนี้</div>') +
      '<div class="section-t" style="margin-top:16px">เหตุผลที่ลูกค้าปฏิเสธ</div>' + (lr.length ? '<div class="chips" style="margin-top:8px">' + lr.map(([k, v]) => '<span class="pill mute">' + esc(k) + ' ' + v + '</span>').join('') + '</div>' : '<div class="small faint" style="margin-top:6px">ไม่มีรายการ</div>'));
    return head + tiles + teamCard + '<div class="grid g-main">' + chartCard + sideCard + '</div>' + '<div class="grid g3">' + adminCard + funnelCard + heatCard + '</div>' + prodCard +
      '<div class="small faint">ข้อมูลล่าสุด ' + H.thDate(new Date().toISOString(), true) + '</div>';
  }
  function tile(lbl, val, sub, cls, meter) {
    return '<div class="tile ' + (cls || '') + '"><span class="lbl">' + lbl + '</span><span class="val">' + val + '</span><span class="sub">' + sub + '</span>' + (meter != null ? '<div class="meter"><i style="width:' + Math.min(100, meter) + '%"></i></div>' : '') + '</div>';
  }
  function alertRow(tone, n, title, sub, page, filter) {
    return '<button class="alert-row ' + (n ? tone : '') + '" data-go="' + page + '"' + (filter ? ' data-filter="' + filter + '"' : '') + '><span class="n">' + N(n) + '</span><span class="t"><b>' + title + '</b><small>' + sub + '</small></span>' + ico('right') + '</button>';
  }
  const KSTAT = { done: ['good', 'ครบ KPI'], close: ['warn', 'ใกล้ครบ'], behind: ['bad', 'ยังไม่ถึงเป้า'], none: ['mute', 'ยังไม่บันทึก'] };
  function kpiPerson(r) {
    const u = user(r.user) || { id: r.user, name: r.name };
    const s = KSTAT[r.status];
    const bar = (label, v, t, mini, fmt) => { const p = pct(v, t); return '<div class="kp-bar"><div class="top"><span>' + label + '</span><b>' + (fmt ? fmt(v) : N(v)) + ' / ' + (fmt ? fmt(t) : N(t)) + '</b></div><div class="meter ' + meterCls(p) + '"><i style="width:' + p + '%"></i></div>' + (mini ? '<div class="mini">' + mini + '</div>' : '') + '</div>'; };
    return '<div class="kpi-person"><div class="kp-who">' + av(u, 'lg') + '<div><b>' + esc(u.name) + '</b><span class="pill ' + s[0] + '">' + s[1] + '</span><div class="small muted" style="margin-top:4px">ผ่าน ' + r.passed + '/4 เกณฑ์</div></div></div>' +
      '<div class="kp-bars">' +
      bar('โทร FB (Pancake)', r.fbCalls, r.target.fb, 'T1 ' + r.t1 + '/' + r.target.t1 + ' · T2 ' + r.t2 + '/' + r.target.t2 + ' · T3 ' + r.t3 + '/' + r.target.t3) +
      bar('โทร Marketplace', r.mktCalls, r.target.mkt, 'Lazada / Shopee / TikTok / Evolution') +
      bar('เวลาคุยรวม', r.talkSec, r.target.talkSec, 'เฉลี่ย ' + H.dur(r.talked ? r.talkSec / r.talked : 0) + ' ต่อสายที่ได้คุย', (x) => Math.round(x / 60) + ' น.') +
      bar('ยอดขาย', r.amount, r.target.revenue, r.orders + ' ออเดอร์ : เฉลี่ย ' + B(r.aov), B) +
      '<div class="kp-foot"><span>ได้คุย <b>' + r.talked + '/' + r.calls + '</b> (' + pctTxt(r.contactRate) + ')</span><span>ปิดได้ <b>' + r.orders + '</b> (' + pctTxt(r.conversion) + ' ของสายที่คุย)</span><span>ยอดต่อสายที่คุย <b>' + B(r.perTalk) + '</b></span>' +
      '<span>นัด : ทำแล้ว <b>' + r.appts.done + '/' + r.appts.due + '</b>' + (r.appts.overdue ? ' · <b style="color:var(--bad)">เลยนัด ' + r.appts.overdue + '</b>' : '') + '</span>' +
      '<span title="ตัวเลขจากระบบ OneCall ใช้ตรวจเทียบกับที่บันทึกเอง">OneCall : <b>' + r.oc.calls + '</b> สาย · คุยจริง <b>' + Math.round(r.oc.talkSec / 60) + '</b> น.</span></div></div></div>';
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

  // ------------------------------------------------------------ CUSTOMERS (Telesales)
  function custList() {
    const v = V(); const T = H.today();
    let list = (v.customers || []).filter((c) => c.channel === ui.custTab && (c.owner || boss()));
    if (boss() && ui.owner !== 'all') list = list.filter((c) => (ui.owner === 'none' ? !c.owner : c.owner === ui.owner));
    const q = ui.q.trim().toLowerCase(), qd = q.replace(/\D/g, '');
    if (q) list = list.filter((c) => (c.name || '').toLowerCase().includes(q) || (qd.length >= 3 && H.normPhone(c.phone).includes(qd)) || (c.orders || []).some((o) => (o.items || []).some((i) => i.name.toLowerCase().includes(q))) || (c.address || '').toLowerCase().includes(q));
    const due = (c) => c.status === 'new' || (c.nextApptAt && H.dayKey(c.nextApptAt) <= T) || H.isStale(v, c);
    const counts = { all: list.length, due: list.filter(due).length };
    for (const k of Object.keys(H.STATUS)) counts[k] = list.filter((c) => c.status === k).length;
    if (ui.status === 'due') list = list.filter(due);
    else if (ui.status === 'hotwarm') list = list.filter((c) => ['hot', 'warm', 'info'].includes(c.status));
    else if (ui.status === 'closed') list = list.filter((c) => ['won', 'awaiting_payment'].includes(c.status));
    else if (ui.status !== 'all') list = list.filter((c) => c.status === ui.status);
    if (ui.custTab === 'fb' && ui.round !== 'all') list = list.filter((c) => c.round === ui.round);
    const score = (c) => { if (c.nextApptAt && Date.parse(c.nextApptAt) < Date.now()) return 0; if (c.nextApptAt && H.dayKey(c.nextApptAt) === T) return 1; if (c.status === 'new') return 2; if (H.isStale(v, c)) return 3; return 4; };
    list.sort((a, b) => score(a) - score(b) || (Date.parse(b.updatedAt || 0) - Date.parse(a.updatedAt || 0)));
    return { list, counts };
  }
  function pageCustomers() {
    const v = V(), T = H.today();
    const fbN = (v.customers || []).filter((c) => c.channel === 'fb' && (c.owner || boss()) && (!boss() || ui.owner === 'all' || c.owner === ui.owner)).length;
    const ecN = (v.customers || []).filter((c) => c.channel === 'ecom' && (c.owner || boss()) && (!boss() || ui.owner === 'all' || c.owner === ui.owner)).length;
    const who = boss() ? (ui.owner !== 'all' && ui.owner !== 'none' ? ui.owner : null) : S.me.id;
    let strip = '';
    if (who) {
      const k = H.teleKpi(v, who, T, T);
      const left = (v.appointments || []).filter((a) => a.owner === who && !a.done && H.dayKey(a.at) <= T).length;
      strip = '<div class="strip">' + tile('โทร FB วันนี้', k.fbCalls + '/' + k.target.fb, 'T1 ' + k.t1 + ' · T2 ' + k.t2 + ' · T3 ' + k.t3, '', pct(k.fbCalls, k.target.fb)) +
        tile('โทร Marketplace', k.mktCalls + '/' + k.target.mkt, 'เหลืออีก ' + Math.max(0, k.target.mkt - k.mktCalls) + ' สาย', '', pct(k.mktCalls, k.target.mkt)) +
        tile('เวลาคุยรวม', Math.round(k.talkSec / 60) + ' น.', 'เป้า ' + Math.round(k.target.talkSec / 60) + ' นาที', '', pct(k.talkSec, k.target.talkSec)) +
        tile('ยอดขายวันนี้', B(k.amount), k.orders + ' ออเดอร์ : เป้า ' + B(k.target.revenue), '', pct(k.amount, k.target.revenue)) +
        tile('นัดที่ต้องโทร', N(left), left ? 'รวมนัดที่เลยกำหนด' : 'เคลียร์นัดวันนี้ครบแล้ว', left ? 'alert' : '') + '</div>';
    }
    const { counts } = custList();
    const chip = (k, l) => '<button class="chip ' + (ui.status === k ? 'on' : '') + '" data-act="cstatus" data-v="' + k + '">' + l + (counts[k] != null ? '<span class="c">' + counts[k] + '</span>' : '') + '</button>';
    const teleOpts = H.teles(S.full || v).map((u) => '<option value="' + u.id + '"' + (ui.owner === u.id ? ' selected' : '') + '>' + esc(u.name) + '</option>').join('');
    return strip +
      '<section class="card"><div class="row between" style="margin-bottom:14px"><div class="seg" role="tablist">' +
      '<button class="' + (ui.custTab === 'fb' ? 'on' : '') + '" data-act="ctab" data-v="fb">' + ico('msg') + ' FB Page (Pancake) <span class="faint">' + fbN + '</span></button>' +
      '<button class="' + (ui.custTab === 'ecom' ? 'on' : '') + '" data-act="ctab" data-v="ecom">' + ico('store') + ' E-Commerce <span class="faint">' + ecN + '</span></button></div>' +
      '<div class="row">' + (boss() ? '<select class="in" style="width:auto" data-act="cowner" aria-label="เลือกเซลล์"><option value="all">ทุกคน</option>' + teleOpts + '<option value="none"' + (ui.owner === 'none' ? ' selected' : '') + '>ยังไม่มีเจ้าของ</option></select>' : '') +
      '<button class="btn primary sm" data-act="add-customer">' + ico('plus') + ' เพิ่มลูกค้า</button></div></div>' +
      '<div class="small muted" style="margin:-4px 0 12px">' + (ui.custTab === 'fb' ? 'รายชื่อจากแอดมินที่ปิดการขายบน FB Page แจกให้ Telesales 50:50 · ตามรอบ T1 → T2 → T3' : 'รายชื่อจาก Lazada / Shopee / TikTok (ผ่าน BigSeller) และ Evolution · ไม่มีรอบ T') + '</div>' +
      '<div class="row" style="margin-bottom:10px"><label class="row" style="flex:1;min-width:220px;position:relative"><span style="position:absolute;left:11px;color:var(--faint)">' + ico('search') + '</span><input class="in" id="cust-q" style="padding-left:38px" placeholder="ค้นหาชื่อ เบอร์ สินค้า หรือที่อยู่" value="' + esc(ui.q) + '" aria-label="ค้นหาลูกค้า"></label></div>' +
      '<div class="chips" style="margin-bottom:8px">' + chip('all', 'ทั้งหมด') + chip('due', 'ต้องโทรวันนี้') + chip('new', 'ใหม่') + chip('hotwarm', 'ร้อน / อุ่น') + chip('followup', 'นัดติดตาม') + chip('closed', 'ปิดได้') + chip('no_answer', 'ไม่รับสาย') + chip('lost', 'ไม่สำเร็จ') + '</div>' +
      (ui.custTab === 'fb' ? '<div class="chips" style="margin-bottom:12px">' + ['all', 'T1', 'T2', 'T3'].map((r) => '<button class="chip ' + (ui.round === r ? 'on' : '') + '" data-act="cround" data-v="' + r + '" title="' + esc(H.ROUNDS[r] || '') + '">' + (r === 'all' ? 'ทุกรอบ' : r) + '</button>').join('') + '</div>' : '') +
      '<div id="cust-list">' + custTable() + '</div></section>';
  }
  function custTable() {
    const { list } = custList();
    if (!list.length) return '<div class="empty">ไม่พบลูกค้าตามเงื่อนไขนี้</div>';
    const rows = list.slice(0, ui.limit).map((c) => '<tr class="click" data-open="' + c.id + '"><td class="cust-name"><b>' + esc(c.name || 'ไม่ระบุชื่อ') + '</b><small>' + H.fmtPhone(c.phone) + '</small></td>' +
      '<td>' + lastOrderLine(c) + '</td><td class="n hide-sm">' + B(H.customerTotal(c)) + '<div class="small muted">' + (c.orders || []).length + ' ออเดอร์</div></td>' +
      '<td>' + statusPill(c.status) + (H.isStale(V(), c) ? '<div class="small" style="color:var(--warn);margin-top:3px">เงียบเกินกำหนด</div>' : '') + '</td>' +
      '<td>' + (c.channel === 'fb' ? roundTag(c.round) : platformTag(c.platform)) + '</td><td>' + apptLabel(c) + '</td>' +
      (boss() ? '<td class="hide-sm">' + (c.owner ? av(user(c.owner), 'sm') : '<span class="pill warn">ยังไม่แจก</span>') + '</td>' : '') + '</tr>').join('');
    return '<div class="tbl-wrap"><table class="tbl"><thead><tr><th>ลูกค้า</th><th>ออเดอร์ล่าสุด</th><th class="n hide-sm">ยอดซื้อรวม</th><th>สถานะ</th><th>' + (ui.custTab === 'fb' ? 'รอบ' : 'แพลตฟอร์ม') + '</th><th>นัดถัดไป</th>' + (boss() ? '<th class="hide-sm">เซลล์</th>' : '') + '</tr></thead><tbody>' + rows + '</tbody></table></div>' +
      (list.length > ui.limit ? '<div class="row" style="justify-content:center;margin-top:12px"><button class="btn sm" data-act="more">แสดงเพิ่ม (' + (list.length - ui.limit) + ' ราย)</button></div>' : '<div class="small faint" style="margin-top:10px">ทั้งหมด ' + list.length + ' ราย</div>');
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

  // ------------------------------------------------------------ CALENDAR
  function pageCalendar() {
    const v = V(), T = H.today();
    const [yy, mm] = ui.calMonth.split('-').map(Number);
    const first = ui.calMonth + '-01';
    const startDow = new Date(first + 'T00:00:00Z').getUTCDay();
    const gridStart = H.addDays(first, -startDow);
    let appts = (v.appointments || []);
    if (boss() && ui.calOwner !== 'all') appts = appts.filter((a) => a.owner === ui.calOwner);
    if (!boss()) appts = appts.filter((a) => a.owner === S.me.id);
    const byDay = {}; for (const a of appts) { const d = H.dayKey(a.at); (byDay[d] = byDay[d] || []).push(a); }
    Object.values(byDay).forEach((l) => l.sort((a, b) => Date.parse(a.at) - Date.parse(b.at)));
    const now = Date.now();
    let cells = H.TH_DOW.map((d) => '<div class="dow">' + d + '</div>').join('');
    for (let i = 0; i < 42; i++) {
      const d = H.addDays(gridStart, i); const l = byDay[d] || [];
      if (i >= 35 && d.slice(0, 7) !== ui.calMonth) break;
      cells += '<button class="d ' + (d.slice(0, 7) !== ui.calMonth ? 'out ' : '') + (d === T ? 'today ' : '') + (d === ui.calDay ? 'sel' : '') + '" data-act="cal-day" data-v="' + d + '"><span class="dn">' + Number(d.slice(8)) + '</span>' +
        l.slice(0, 3).map((a) => { const c = H.findCustomer(S.full || v, a.customerId) || {}; return '<span class="ev-dot ' + (a.done ? 'done' : Date.parse(a.at) < now - 3600000 ? 'late' : '') + '">' + H.thTime(a.at) + ' ' + esc(c.name || '') + '</span>'; }).join('') +
        (l.length > 3 ? '<span class="small muted">+' + (l.length - 3) + ' นัด</span>' : '') + (l.length ? '<span class="small muted cnt" style="display:none">' + l.length + ' นัด</span>' : '') + '</button>';
    }
    const dayList = (byDay[ui.calDay] || []);
    const overdue = appts.filter((a) => !a.done && Date.parse(a.at) < now - 3600000).sort((a, b) => Date.parse(a.at) - Date.parse(b.at));
    const teleOpts = H.teles(S.full || v).map((u) => '<option value="' + u.id + '"' + (ui.calOwner === u.id ? ' selected' : '') + '>' + esc(u.name) + '</option>').join('');
    const monthLabel = H.TH_MON[mm - 1] + ' ' + (yy + 543);
    return '<div class="row between"><div class="row"><button class="icon-btn" data-act="cal-nav" data-v="-1" aria-label="เดือนก่อน">' + ico('left') + '</button><h2 style="font-size:20px;min-width:120px;text-align:center">' + monthLabel + '</h2><button class="icon-btn" data-act="cal-nav" data-v="1" aria-label="เดือนถัดไป">' + ico('right') + '</button><button class="btn sm" data-act="cal-today">วันนี้</button></div>' +
      '<div class="row">' + (boss() ? '<select class="in" style="width:auto" data-act="cal-owner" aria-label="เลือกเซลล์"><option value="all">ทุกคน</option>' + teleOpts + '</select>' : '') + '<button class="btn primary sm" data-act="new-appt">' + ico('plus') + ' เพิ่มนัด</button></div></div>' +
      '<div class="grid g-main"><section class="card"><div class="cal">' + cells + '</div><div class="legend" style="margin-top:12px"><span><i style="background:var(--info-soft);border:1px solid var(--info)"></i>นัดที่ต้องโทร</span><span><i style="background:var(--bad-soft);border:1px solid var(--bad)"></i>เลยนัด</span><span><i style="background:var(--mute-soft)"></i>โทรแล้ว</span></div></section>' +
      '<div class="grid" style="align-content:start">' +
      card('calendar', H.thDate(ui.calDay) + (ui.calDay === T ? ' (วันนี้)' : ''), dayList.length + ' นัด : ทำแล้ว ' + dayList.filter((a) => a.done).length, dayList.length ? dayList.map(apptRow).join('') : '<div class="empty">ไม่มีนัดในวันนี้</div>') +
      card('alert', 'เลยนัด ยังไม่ได้โทร', overdue.length ? 'โทรเคลียร์ก่อนนัดใหม่' : 'ไม่มีนัดค้าง', overdue.length ? overdue.slice(0, 12).map(apptRow).join('') : '<div class="empty">เยี่ยม ไม่มีนัดค้าง</div>') + '</div></div>';
  }
  function apptRow(a) {
    const c = H.findCustomer(S.full || V(), a.customerId) || {};
    const late = !a.done && Date.parse(a.at) < Date.now() - 3600000;
    return '<div class="appt ' + (a.done ? 'done ' : '') + (late ? 'late' : '') + '"><span class="tm">' + H.thTime(a.at) + '<div class="small faint" style="font-family:var(--font);font-weight:400">' + (H.dayKey(a.at) !== ui.calDay ? H.thDate(a.at).replace(/ \d{4}$/, '') : '') + '</div></span>' +
      '<div class="who"><b data-open="' + esc(c.id || '') + '">' + esc(c.name || 'ลูกค้า') + '</b><small>' + esc(a.purpose) + ' ' + roundTag(a.round) + (boss() ? ' : ' + esc(uname(a.owner)) : '') + ' : ' + H.fmtPhone(c.phone) + '</small></div>' +
      '<div class="row" style="gap:6px">' + (a.done ? '<span class="pill good">' + ico('check') + '</span>' : '<button class="btn sm" data-open="' + esc(c.id || '') + '" data-tab="call">' + ico('phone') + ' โทร</button><button class="btn sm" data-act="appt-shift" data-id="' + a.id + '" title="เลื่อนไปพรุ่งนี้">+1 วัน</button><button class="btn sm good" data-act="appt-done" data-id="' + a.id + '" aria-label="ทำแล้ว">' + ico('check') + '</button>') + '</div></div>';
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
      '<div class="field"><span>ช่องทาง</span><select class="in" name="channel" data-act-change="kpi-channel"><option value="fb">FB Page (Pancake)</option><option value="mkt">Marketplace (Lazada / Shopee / TikTok / Evolution)</option></select></div></div>' +
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
      (boss() ? '<div class="f2" style="margin-bottom:12px"><label class="field"><span>Telesales</span><select class="in" data-act="kpi-user">' + teleOpts + '</select></label><label class="field"><span>ดูวันที่</span><input class="in" type="date" data-act="kpi-date" value="' + date + '" max="' + H.today() + '"></label></div>' : '') +
      '<div class="seg" style="margin-bottom:14px"><button class="' + (ui.kpiMode === 'call' ? 'on' : '') + '" data-act="kpi-mode" data-v="call">' + ico('phone') + ' ทีละสาย</button><button class="' + (ui.kpiMode === 'sum' ? 'on' : '') + '" data-act="kpi-mode" data-v="sum">' + ico('clip') + ' สรุปทั้งวัน</button></div>' +
      (ui.kpiMode === 'call' ? callForm : sumForm) + '<div class="small muted" style="margin-top:10px">เคล็ดลับ : ถ้าโทรจากหน้า Ticket ลูกค้า กด "บันทึกการโทร" ที่นั่นได้เลย ระบบนับ KPI ให้โดยไม่ต้องกรอกซ้ำ</div></section>';
    const checks = '<div class="alerts">' + k.checks.map((c) => '<div class="alert-row" style="cursor:default"><span class="check ' + (c.ok ? 'ok' : 'no') + '">' + ico(c.ok ? 'checkc' : 'x') + '</span><span class="t"><b>' + c.label + '</b><small>' + (c.time ? Math.round(c.value / 60) + ' / ' + Math.round(c.target / 60) + ' นาที' : c.money ? B(c.value) + ' / ' + B(c.target) : c.value + ' / ' + c.target + ' สาย') + '</small></span><span class="pill ' + (c.ok ? 'good' : 'bad') + '">' + (c.ok ? 'ครบ' : 'ขาด ' + (c.time ? Math.ceil((c.target - c.value) / 60) + ' น.' : c.money ? B(c.target - c.value) : (c.target - c.value) + ' สาย')) + '</span></div>').join('') + '</div>';
    const rows = entries.map((e) => { const r = H.RESULTS.find((x) => x.id === e.result); return '<tr><td>' + H.thTime(e.at) + '</td><td>' + (e.channel === 'fb' ? 'FB ' + roundTag(e.round) : 'Marketplace') + '</td>' +
      '<td>' + (e.mode === 'summary' ? '<b>สรุปทั้งวัน</b><div class="small muted">' + e.calls + ' สาย · คุย ' + e.talkedCount + '</div>' : '<span class="cust-name"><b>' + esc(e.name || '-') + '</b><small>' + H.fmtPhone(e.phone) + '</small></span>') + '</td>' +
      '<td>' + (r ? '<span class="pill ' + r.tone + '">' + esc(r.group) + '</span>' : '-') + '</td><td class="n">' + H.hms(e.durationSec) + '</td><td class="n">' + (e.amount ? B(e.amount) : '-') + '</td>' +
      '<td class="n"><button class="btn sm danger" data-act="kpi-del" data-id="' + e.id + '" aria-label="ลบรายการ">' + ico('x') + '</button></td></tr>'; }).join('');
    const right = '<div class="grid" style="align-content:start"><section class="card"><div class="card-h"><span class="card-ico">' + ico('chart') + '</span><div class="ttl"><h2>สิ่งที่ผู้บริหารเห็น : ' + esc(uname(who)) + '</h2><small>' + H.thDate(date) + ' · ' + KSTAT[k.status][1] + '</small></div><span class="pill ' + KSTAT[k.status][0] + '">' + k.passed + '/4</span></div>' + checks +
      '<div class="row small muted" style="margin-top:12px;gap:14px"><span>ได้คุย <b style="color:var(--text)">' + k.talked + '/' + k.calls + '</b></span><span>ปิดได้ <b style="color:var(--text)">' + k.orders + '</b></span><span>เวลาคุย <b style="color:var(--text)">' + H.hms(k.talkSec) + '</b></span><span>OneCall <b style="color:var(--text)">' + k.oc.calls + ' สาย</b></span></div></section>' +
      '<section class="card"><div class="card-h"><span class="card-ico">' + ico('note') + '</span><div class="ttl"><h2>รายการที่บันทึก</h2><small>' + entries.length + ' รายการ : ลบได้เฉพาะของวันนี้</small></div></div>' +
      (entries.length ? '<div class="tbl-wrap"><table class="tbl"><thead><tr><th>เวลา</th><th>ช่องทาง</th><th>ลูกค้า</th><th>ผล</th><th class="n">เวลาคุย</th><th class="n">ยอด</th><th></th></tr></thead><tbody>' + rows + '</tbody></table></div>' : '<div class="empty">ยังไม่มีรายการในวันนี้</div>') + '</section></div>';
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
  function todaySplit() {
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
    const list = closes.length ? closes.map((a) => { const c = H.findCustomer(S.full || v, a.customerId) || {}; return '<div class="appt"><span class="tm">' + H.thTime(a.at) + '</span><div class="who"><b>' + esc(c.name || '-') + ' : ' + B(a.total) + '</b><small>' + esc((a.items || []).map((i) => i.name + ' x' + i.qty).join(', ')) + (boss() ? ' : ' + esc(a.closerName) : '') + (a.returning ? ' : ลูกค้าเก่า' : '') + '</small></div>' +
      (a.status === 'pending' ? '<span class="pill warn">รออนุมัติ → ' + esc(uname(a.proposed)) + '</span>' : a.status === 'rejected' ? '<span class="pill bad">ไม่ส่ง</span>' : '<span class="pill good">' + esc(uname(a.assigned)) + '</span>') + '</div>'; }).join('') : '<div class="empty">ยังไม่มีการปิดการขายวันนี้</div>';
    return '<div class="grid g-main">' + card('cart', 'บันทึกการปิดการขาย', 'กรอกเมื่อปิดการขายได้ ระบบจะส่งรายชื่อให้ Telesales แบบ 50:50 ทันที', form) +
      '<div class="grid" style="align-content:start">' +
      card('send', 'รายชื่อถัดไปจะส่งให้', 'แบ่งเท่ากัน 50:50 ทุกครั้ง · ลูกค้าเก่าส่งกลับให้เซลล์คนเดิม', '<div class="row" style="gap:14px;margin-bottom:14px">' + (next ? av(user(next), 'lg') + '<div><b style="font-size:18px">' + esc(uname(next)) + '</b><div class="small muted">' + ((S.full || v).settings.autoApprove ? 'ส่งถึงเซลล์ทันที' : 'เข้าคิวรออนุมัติก่อนส่ง') + '</div></div>' : '<span class="muted">ไม่มี Telesales ที่พร้อมรับ</span>') + '</div><div class="section-t" style="margin-bottom:8px">รายชื่อที่แจกวันนี้</div>' + splitBar(todaySplit())) +
      card('link', 'ดึงจาก Pancake อัตโนมัติ', 'ออเดอร์ที่ปิดใน Pancake POS เข้าระบบเองทุก 3 นาที ไม่ต้องกรอกซ้ำ', '<dl class="kv"><dt>ล่าสุด</dt><dd>' + (sync.lastRun ? H.thDate(sync.lastRun, true) : 'ยังไม่เคยดึง') + '</dd><dt>รอบล่าสุด</dt><dd>' + (sync.lastAdded || 0) + ' ออเดอร์ใหม่</dd>' + (sync.lastError ? '<dt>สถานะ</dt><dd style="color:var(--bad)">' + esc(sync.lastError) + '</dd>' : '') + '</dl>', '<button class="btn sm" data-act="sync-pancake">' + ico('refresh') + ' ดึงตอนนี้</button>') +
      '<section class="card"><div class="card-h"><span class="card-ico">' + ico('bag') + '</span><div class="ttl"><h2>ปิดการขายวันนี้</h2><small>' + closes.length + ' ออเดอร์ : ' + B(myRev) + '</small></div>' + (boss() ? '<select class="in" style="width:auto" data-act="close-admin"><option value="all">ทุกคน</option>' + admins.map((u) => '<option value="' + u.id + '"' + (ui.closeAdmin === u.id ? ' selected' : '') + '>' + esc(u.name) + '</option>').join('') + '</select>' : '') + '</div>' + list + '</section></div></div>';
  }

  // ------------------------------------------------------------ APPROVALS
  function pageApprovals() {
    const v = V(), T = H.today();
    const pend = (v.approvals || []).filter((a) => a.status === 'pending' && (boss() || a.proposed === S.me.id)).sort((a, b) => Date.parse(b.at) - Date.parse(a.at));
    const done = (v.approvals || []).filter((a) => a.status !== 'pending' && a.status !== 'history' && H.dayKey(a.decidedAt || a.at) === T && (boss() || a.assigned === S.me.id));
    const list = ui.apTab === 'pending' ? pend : done;
    const tele = H.teles(S.full || v);
    const rows = list.map((a) => {
      const c = H.findCustomer(S.full || v, a.customerId) || {};
      return '<div class="ap-card"><div><div class="row" style="gap:8px"><b class="link" data-open="' + esc(c.id || '') + '">' + esc(c.name || '-') + '</b><span class="small muted">' + H.fmtPhone(c.phone) + '</span>' + (a.returning ? '<span class="pill info">ลูกค้าเก่า</span>' : '') + '</div>' +
        '<div class="small muted">' + esc((a.items || []).map((i) => i.name + ' x' + i.qty).join(', ') || '-') + '</div><div class="small faint">' + esc(a.page || '') + '</div></div>' +
        '<div><b style="font-family:var(--display);font-size:17px">' + B(a.total) + '</b><div class="small muted">ปิดโดย ' + esc(a.closerName || '-') + ' : ' + H.thTime(a.at) + ' น.</div></div>' +
        (a.status === 'pending' ? '<div class="row">' + (boss() ? '<select class="in" style="width:auto" data-ap-to="' + a.id + '" aria-label="ส่งให้">' + tele.map((u) => '<option value="' + u.id + '"' + (a.proposed === u.id ? ' selected' : '') + '>' + esc(u.name) + (a.proposed === u.id ? ' (คิว)' : '') + '</option>').join('') + '</select>' : '') +
          '<button class="btn good sm" data-act="ap-ok" data-id="' + a.id + '">' + ico('check') + (boss() ? ' อนุมัติ' : ' รับรายชื่อ') + '</button>' + (boss() ? '<button class="btn sm danger" data-act="ap-no" data-id="' + a.id + '">ไม่ส่ง</button>' : '') + '</div>'
          : '<div>' + (a.status === 'approved' ? '<span class="pill good">' + esc(uname(a.assigned)) + (a.auto ? ' : อัตโนมัติ' : '') + '</span>' : '<span class="pill bad">ไม่ส่ง : ' + esc(a.reason || '') + '</span>') + '</div>') + '</div>';
    }).join('');
    const st = S.full || v;
    return '<div class="grid g-main"><section class="card"><div class="row between" style="margin-bottom:10px"><div class="seg"><button class="' + (ui.apTab === 'pending' ? 'on' : '') + '" data-act="ap-tab" data-v="pending">รออนุมัติ <span class="faint">' + pend.length + '</span></button><button class="' + (ui.apTab === 'done' ? 'on' : '') + '" data-act="ap-tab" data-v="done">ดำเนินการวันนี้ <span class="faint">' + done.length + '</span></button></div>' +
      (boss() && pend.length ? '<button class="btn primary sm" data-act="ap-all">' + ico('check') + ' อนุมัติทั้งหมด (' + pend.length + ')</button>' : '') + '</div>' +
      (rows || '<div class="empty">' + (ui.apTab === 'pending' ? 'ไม่มีรายชื่อรออนุมัติ' : 'ยังไม่มีรายการวันนี้') + '</div>') + '</section>' +
      '<div class="grid" style="align-content:start">' + card('users', 'สัดส่วนรายชื่อวันนี้', 'FB Page แบ่งเท่ากันเสมอ 50:50', splitBar(todaySplit())) +
      (boss() ? card('gear', 'การอนุมัติ', 'เลือกว่าจะตรวจก่อนส่ง หรือให้ระบบส่งเลย', '<label class="switch"><input type="checkbox" data-act="auto-approve"' + (st.settings.autoApprove ? ' checked' : '') + '><span>ส่งรายชื่อให้ Telesales อัตโนมัติ ไม่ต้องรออนุมัติ</span></label><div class="small muted" style="margin-top:10px">ลูกค้าเก่าที่กลับมาซื้อซ้ำ ระบบส่งกลับให้เซลล์คนเดิมทันทีเสมอ</div>') :
        card('phone', 'เมื่อรับรายชื่อแล้ว', 'ระบบสร้างนัด T1 ให้อัตโนมัติ', '<div class="small muted">รายชื่อจะไปอยู่ในแท็บ FB Page ของ "ลูกค้าของฉัน" พร้อมนัด T1 ต้อนรับและยืนยันออเดอร์ภายใน 2 ชั่วโมง</div>')) + '</div></div>';
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
      '<td><button class="btn sm" data-act="save-user" data-id="' + u.id + '">บันทึก</button></td></tr>').join('') + '</tbody></table></div><div class="small muted" style="margin-top:8px">ชื่อแอดมินที่พบใน Pancake ช่วง 3 สัปดาห์ล่าสุด : Chonlakarn Eadnai, ชาเย็น ไม่หวาน, ณิชาภา ศรีวัฒนกุล, สมร นอนน้อย, Numwhan Yanhee · จับคู่แล้วยอดจะรวมเข้าชื่อในระบบ</div>');
    const prods = card('bag', 'รายการสินค้าและราคา', 'ใช้ในช่องเลือกสินค้าทุกฟอร์ม', '<div class="items" id="prod-edit">' + st.settings.products.map((p) => '<div class="item-row" style="grid-template-columns:110px minmax(0,1fr) 90px 32px"><input class="in" data-p="code" value="' + esc(p.code) + '" aria-label="รหัส"><input class="in" data-p="name" value="' + esc(p.name) + '" aria-label="ชื่อสินค้า"><input class="in" type="number" data-p="price" value="' + p.price + '" aria-label="ราคา"><button type="button" class="x" data-act="item-del" aria-label="ลบ">' + ico('x') + '</button></div>').join('') + '</div>' +
      '<div class="row" style="margin-top:10px"><button class="btn sm" data-act="prod-add">' + ico('plus') + ' เพิ่มสินค้า</button><button class="btn primary sm" data-act="prod-save">บันทึกรายการสินค้า</button></div>');
    const ints = S.integrations || {};
    const conn = (name, ok, last, desc, btn) => '<div class="alert-row" style="cursor:default"><span class="pill ' + (ok ? 'good' : 'warn') + '">' + (ok ? 'เชื่อมต่อ' : 'ยังไม่ตั้งค่า') + '</span><span class="t"><b>' + name + '</b><small>' + desc + (last ? ' · ล่าสุด ' + H.thDate(last, true) : '') + '</small></span>' + (btn || '') + '</div>';
    const integrations = card('link', 'การเชื่อมต่อระบบ', 'ข้อมูลไหลเข้าเองอัตโนมัติ ไม่ต้องกรอกซ้ำ', '<div class="alerts">' +
      conn('Pancake POS (FB Page)', ints.pancake, sy.pancake && sy.pancake.lastRun, 'ออเดอร์ที่แอดมินปิดเข้าคิวแจก 50:50 ทุก 3 นาที' + (sy.pancake && sy.pancake.lastError ? ' · <span style="color:var(--bad)">' + esc(sy.pancake.lastError) + '</span>' : ''), '<button class="btn sm" data-act="sync-pancake">ดึงตอนนี้</button>') +
      conn('OneCall (บันทึกเสียงสาย)', ints.onecall, sy.onecall && sy.onecall.lastRun, 'ใช้ตรวจจำนวนสายและเวลาคุยจริงเทียบกับที่บันทึก', '<button class="btn sm" data-act="sync-onecall">ดึงตอนนี้</button>') +
      conn('BigSeller (Lazada / Shopee / TikTok)', !!(sy.bigseller && sy.bigseller.lastRun), sy.bigseller && sy.bigseller.lastRun, 'อัปโหลดไฟล์ Export หรือวางตารางด้านล่าง · สคริปต์เดิมส่งเข้าที่ /api/bigseller/ingest ได้เลย') +
      conn('ระบบเดิม (evo-split-online)', !!(sy.legacy && sy.legacy.importedAt), sy.legacy && sy.legacy.importedAt, sy.legacy && sy.legacy.importedAt ? 'ย้ายลูกค้า ' + N(sy.legacy.customers) + ' ราย ออเดอร์ ' + N(sy.legacy.orders) + ' รายการ' : 'ย้ายรายชื่อ ประวัติ และนัดจากระบบเดิมครั้งเดียว', '<button class="btn sm" data-act="import-legacy">นำเข้า</button>') + '</div>' +
      '<div class="section-t" style="margin-top:16px">นำเข้าออเดอร์ E-Commerce</div><form class="form" data-form="ecom-import" style="margin-top:8px"><div class="f2"><label class="field"><span>แพลตฟอร์ม</span><select class="in" name="platform"><option value="">ตามไฟล์ (ค่าเริ่มต้น Lazada)</option><option value="lazada">Lazada</option><option value="shopee">Shopee</option><option value="tiktok">TikTok Shop</option><option value="evolution">Evolution</option></select></label>' +
      '<label class="field"><span>ไฟล์ Excel / CSV จาก BigSeller</span><input class="in" type="file" name="file" accept=".xlsx,.xls,.csv"></label></div>' +
      '<label class="field"><span>หรือวางตารางที่คัดลอกมา (ต้องมีหัวคอลัมน์ เบอร์ / ชื่อ / ที่อยู่ / สินค้า / ยอด)</span><textarea class="in" name="paste" rows="4" placeholder="เลขที่คำสั่งซื้อ\tชื่อผู้รับ\tเบอร์โทร\tที่อยู่\tสินค้า\tยอด"></textarea></label><button class="btn primary sm">' + ico('upload') + ' นำเข้า</button></form>');
    const ann = card('mega', 'ประกาศข่าวสาร', 'แสดงที่หน้าหลักของทุกคน', '<form class="form" data-form="ann"><label class="field"><span>หัวข้อ <em>*</em></span><input class="in" name="title" required></label><label class="field"><span>รายละเอียด</span><textarea class="in" name="body"></textarea></label><button class="btn primary sm">ประกาศ</button></form>' +
      '<div class="ann" style="margin-top:14px">' + (st.announcements || []).map((a) => '<div class="row between" style="flex-wrap:nowrap"><div class="ann-item" style="flex:1"><div><b>' + esc(a.title) + '</b><small>' + H.thDate(a.at, true) + '</small></div></div><button class="btn sm danger" data-act="ann-del" data-id="' + a.id + '">ลบ</button></div>').join('') + '</div>');
    const data = card('note', 'ข้อมูล', DEMO ? 'โหมดตัวอย่าง' : 'สำรองข้อมูลอัตโนมัติทุกวัน เก็บ 30 วัน', DEMO ? '<button class="btn" data-act="demo-reset">ล้างและสร้างข้อมูลตัวอย่างใหม่</button>' : '<a class="btn" href="/api/export/customers.csv">' + ico('upload') + ' ดาวน์โหลดรายชื่อลูกค้า (CSV)</a>');
    return '<div class="grid g2">' + targets + users + '</div><div class="grid g2">' + integrations + '<div class="grid" style="align-content:start">' + prods + ann + data + '</div></div>';
  }

  // ------------------------------------------------------------ modals
  let modal = null;
  function openModal(html) { closeModal(); modal = document.createElement('div'); modal.innerHTML = '<div class="scrim modal-scrim" data-act="close-modal"></div><div class="modal" role="dialog">' + html + '</div>'; document.body.appendChild(modal); const f = $('input,select,textarea', modal); f && f.focus(); }
  function closeModal() { if (modal) { modal.remove(); modal = null; } }
  function addCustomerModal() {
    const tele = H.teles(S.full || V());
    openModal('<div class="row between" style="margin-bottom:14px"><h2 style="font-size:18px">เพิ่มลูกค้า</h2><button class="icon-btn" data-act="close-modal" aria-label="ปิด">' + ico('x') + '</button></div><form class="form" data-form="add-customer">' +
      '<div class="f2"><label class="field"><span>ชื่อ-นามสกุล <em>*</em></span><input class="in" name="name" required></label><label class="field"><span>เบอร์ติดต่อ <em>*</em></span><input class="in" name="phone" inputmode="tel" required></label></div>' +
      '<label class="field"><span>ที่อยู่</span><textarea class="in" name="address"></textarea></label>' +
      '<div class="f2"><label class="field"><span>ช่องทาง</span><select class="in" name="channel"><option value="fb"' + (ui.custTab === 'fb' ? ' selected' : '') + '>FB Page</option><option value="ecom"' + (ui.custTab === 'ecom' ? ' selected' : '') + '>E-Commerce</option></select></label>' +
      '<label class="field"><span>แพลตฟอร์ม</span><select class="in" name="platform"><option value="">ตามช่องทาง</option><option value="lazada">Lazada</option><option value="shopee">Shopee</option><option value="tiktok">TikTok Shop</option><option value="evolution">Evolution</option><option value="manual">เพิ่มเอง</option></select></label></div>' +
      (boss() ? '<label class="field"><span>ให้เซลล์</span><select class="in" name="owner"><option value="">ยังไม่แจก</option>' + tele.map((u) => '<option value="' + u.id + '">' + esc(u.name) + '</option>').join('') + '</select></label>' : '') +
      '<label class="field"><span>โน้ต</span><input class="in" name="note"></label><button class="btn primary">บันทึกลูกค้า</button></form>');
  }
  function newApptModal() {
    const v = V();
    const list = (v.customers || []).filter((c) => boss() || c.owner === S.me.id);
    openModal('<div class="row between" style="margin-bottom:14px"><h2 style="font-size:18px">เพิ่มนัดโทร</h2><button class="icon-btn" data-act="close-modal" aria-label="ปิด">' + ico('x') + '</button></div><form class="form" data-form="new-appt">' +
      '<label class="field"><span>ลูกค้า <em>*</em> (พิมพ์ชื่อหรือเบอร์)</span><input class="in" name="cust" list="appt-cust" required autocomplete="off"></label><datalist id="appt-cust">' + list.slice(0, 600).map((c) => '<option value="' + esc(c.name + ' · ' + H.fmtPhone(c.phone)) + '"></option>').join('') + '</datalist>' +
      '<div class="f2"><label class="field"><span>วันเวลา <em>*</em></span><input class="in" type="datetime-local" name="at" required value="' + ui.calDay + 'T10:00"></label><label class="field"><span>รอบ</span><select class="in" name="round"><option value="">-</option><option>T1</option><option>T2</option><option>T3</option></select></label></div>' +
      '<label class="field"><span>นัดเพื่อ</span><input class="in" name="purpose" placeholder="โทรติดตาม"></label><button class="btn primary">บันทึกนัด</button></form>');
  }
  function bellModal() {
    const v = V(), pend = (v.approvals || []).filter((a) => a.status === 'pending' && (boss() || a.proposed === S.me.id)), od = overdueAppts();
    const today = (v.appointments || []).filter((a) => !a.done && H.dayKey(a.at) === H.today() && Date.parse(a.at) >= Date.now() - 3600000 && (boss() || a.owner === S.me.id));
    openModal('<div class="row between" style="margin-bottom:14px"><h2 style="font-size:18px">การแจ้งเตือน</h2><button class="icon-btn" data-act="close-modal" aria-label="ปิด">' + ico('x') + '</button></div><div class="alerts">' +
      (allowed('approvals') ? alertRow('bad', pend.length, 'รายชื่อใหม่รออนุมัติ', 'จากแอดมินที่ปิดการขาย', 'approvals') : '') +
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
      '<div class="shell"><aside class="side" aria-label="เมนู"><div class="brand"><b>EVOLUTION</b><small>Hub Commerce · ทีมขาย Office</small></div>' +
      '<nav class="nav"><button class="on">' + ico('home') + '<span>หน้าหลัก</span></button><div class="nav-label">ฝ่ายงาน</div>' +
      DEPTS.map((d) => '<button data-login="' + d.key + '">' + ico(d.ico) + '<span>' + d.th + '</span></button>').join('') + '</nav>' +
      '<div class="side-foot"><b>ติดต่อหัวหน้าทีม</b><span>คุณโม : Teamlead</span><span style="opacity:.75">ลืมรหัสผ่าน แจ้งหัวหน้าทีมได้เลย</span></div></aside>' +
      '<div class="main"><header class="head"><button class="icon-btn burger" data-act="menu" aria-label="เปิดเมนู">' + ico('menu') + '</button><div class="grow"><div class="crumb">Evolution Hub Commerce</div><h1>หน้าหลัก</h1></div>' +
      '<button class="btn primary" data-login="all">' + ico('lock') + ' เข้าสู่ระบบ</button></header>' +
      '<main class="page"><section class="banner"><div class="grow"><h1>Welcome to "Evolution Hub Commerce"</h1><p>' + H.thDate(T) + ' · เลือกฝ่ายงานของคุณเพื่อเริ่มต้นการทำงาน</p></div><div class="stack">' + people.map((u) => av(u)).join('') + '</div></section>' +
      '<div class="grid g2">' +
      card('mega', 'ประกาศข่าวสาร', 'Announcements', anns.length ? '<div class="ann">' + anns.map((a) => '<div class="ann-item"><div><b>' + esc(a.title) + '</b><small>' + H.thDate(a.at, true) + '</small></div></div>').join('') + '</div>' : '<div class="empty">ยังไม่มีประกาศ</div>', '<button class="link" data-login="all">ดูทั้งหมด</button>') +
      card('calendar', 'งานที่กำลังจะมาถึง', 'Upcoming', ups.length ? '<div class="ann">' + ups.map((u) => { const d = new Date(u.day + 'T00:00:00Z'); return '<div class="ev"><div class="datebox"><b>' + d.getUTCDate() + '</b><small>' + H.TH_MON[d.getUTCMonth()] + '</small></div><div><b>นัดโทรลูกค้า ' + u.count + ' นัด</b><div class="small muted">' + (u.day === T ? 'วันนี้' : H.TH_DOW[d.getUTCDay()] + ' ' + H.thDate(u.day)) + ' · Telesales</div></div><span></span></div>'; }).join('') + '</div>' : '<div class="empty">ยังไม่มีนัดที่กำลังจะมาถึง</div>', '<button class="link" data-login="tele">ดูปฏิทิน</button>') + '</div>' +
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
    if (!allowed(S.page)) S.page = 'home';
    const fn = { home: pageHome, overview: pageOverview, customers: pageCustomers, calendar: pageCalendar, kpi: pageKpi, close: pageClose, approvals: pageApprovals, settings: pageSettings }[S.page];
    const keepScroll = $('.drawer-b') ? $('.drawer-b').scrollTop : 0;
    document.getElementById('app').innerHTML = shell(fn());
    if ($('.drawer-b') && keepScroll) $('.drawer-b').scrollTop = keepScroll;
    document.title = PAGES[S.page].t + ' · Evolution Hub Commerce';
    remember();
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
    range: (el) => { ui.range = el.dataset.v; render(); },
    chart: (el) => { ui.chart = el.dataset.v; render(); },
    ctab: (el) => { ui.custTab = el.dataset.v; ui.round = 'all'; ui.limit = 120; render(); },
    cstatus: (el) => { ui.status = el.dataset.v; ui.limit = 120; render(); },
    cround: (el) => { ui.round = el.dataset.v; render(); },
    more: () => { ui.limit += 200; $('#cust-list').innerHTML = custTable(); },
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
    'cal-day': (el) => { ui.calDay = el.dataset.v; render(); },
    'cal-nav': (el) => { let [y, m] = ui.calMonth.split('-').map(Number); m += Number(el.dataset.v); if (m < 1) { m = 12; y--; } if (m > 12) { m = 1; y++; } ui.calMonth = y + '-' + String(m).padStart(2, '0'); render(); },
    'cal-today': () => { ui.calMonth = H.today().slice(0, 7); ui.calDay = H.today(); render(); },
    'new-appt': newApptModal,
    'appt-done': (el) => run(() => api.act('updateAppt', { id: el.dataset.id, patch: { done: true } }), 'ทำเครื่องหมายว่าโทรแล้ว'),
    'appt-shift': (el) => { const a = (V().appointments || []).find((x) => x.id === el.dataset.id); run(() => api.act('updateAppt', { id: a.id, patch: { at: new Date(Date.parse(a.at) + 86400000).toISOString() } }), 'เลื่อนนัดไปพรุ่งนี้แล้ว'); },
    'kpi-mode': (el) => { ui.kpiMode = el.dataset.v; render(); },
    'kpi-del': (el) => confirmInline(el, () => run(() => api.act('deleteKpi', { id: el.dataset.id }), 'ลบรายการแล้ว')),
    'ap-tab': (el) => { ui.apTab = el.dataset.v; render(); },
    'ap-ok': (el) => { const sel = $('[data-ap-to="' + el.dataset.id + '"]'); run(() => api.act('approve', { id: el.dataset.id, to: sel ? sel.value : undefined }), (r) => 'ส่งรายชื่อให้ ' + uname(r && r.to) + ' แล้ว'); },
    'ap-no': (el) => confirmInline(el, () => run(() => api.act('reject', { id: el.dataset.id }), 'ไม่ส่งรายชื่อนี้')),
    'ap-all': () => run(() => api.act('approveAll', {}), (r) => 'อนุมัติ ' + (r && r.approved) + ' รายชื่อแล้ว'),
    'sync-pancake': () => run(() => api.post('/api/sync/pancake', {}), (r) => 'ดึงจาก Pancake : ' + (r.added || 0) + ' ออเดอร์ใหม่' + (r.error ? ' (' + r.error + ')' : '')),
    'sync-onecall': () => run(() => api.post('/api/sync/onecall', { days: 2 }), (r) => 'ดึงจาก OneCall : ' + (r.added || 0) + ' สาย'),
    'import-legacy': () => run(() => api.post('/api/import/legacy', {}), (r) => 'นำเข้าลูกค้า ' + (r.customers || 0) + ' ราย จากระบบเดิม'),
    'save-user': (el) => { const row = $('[data-user-row="' + el.dataset.id + '"]'); const g = (k) => { const i = $('[data-u=' + k + ']', row); return i ? (i.type === 'checkbox' ? i.checked : i.value) : undefined; }; run(() => api.act('updateUser', { id: el.dataset.id, name: g('name'), off: g('off'), pancakeName: g('pancakeName') }), 'บันทึกข้อมูลทีมแล้ว'); },
    'prod-add': () => { $('#prod-edit').insertAdjacentHTML('beforeend', '<div class="item-row" style="grid-template-columns:110px minmax(0,1fr) 90px 32px"><input class="in" data-p="code" placeholder="รหัส"><input class="in" data-p="name" placeholder="ชื่อสินค้า"><input class="in" type="number" data-p="price" placeholder="ราคา"><button type="button" class="x" data-act="item-del">' + ico('x') + '</button></div>'); },
    'prod-save': () => { const products = $$('#prod-edit .item-row').map((r) => ({ code: $('[data-p=code]', r).value, name: $('[data-p=name]', r).value, price: $('[data-p=price]', r).value })).filter((p) => p.name); run(() => api.act('updateSettings', { products }), 'บันทึกรายการสินค้า ' + products.length + ' รายการ'); },
    'ann-del': (el) => run(() => api.act('deleteAnnouncement', { id: el.dataset.id }), 'ลบประกาศแล้ว'),
  };
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
    const go_ = e.target.closest('[data-go]');
    if (go_ && !go_.closest('form')) { e.preventDefault(); closeModal(); if (go_.dataset.filter === 'due') { ui.status = 'due'; } go(go_.dataset.go); return; }
    const op = e.target.closest('[data-open]');
    if (op && op.dataset.open) { e.preventDefault(); closeModal(); ui.drawer = op.dataset.open; ui.dTab = op.dataset.tab || (boss() ? 'call' : 'call'); render(); return; }
    const a = e.target.closest('[data-act]');
    if (a && handlers[a.dataset.act] && !(a.tagName === 'SELECT' || (a.tagName === 'INPUT' && a.type !== 'button'))) { e.preventDefault(); handlers[a.dataset.act](a, e); }
  });
  document.addEventListener('change', (e) => {
    const t = e.target, act = t.dataset.act || t.dataset.actChange;
    if (act === 'cowner') { ui.owner = t.value; render(); }
    else if (act === 'cal-owner') { ui.calOwner = t.value; render(); }
    else if (act === 'kpi-user') { ui.kpiUser = t.value; render(); }
    else if (act === 'kpi-date') { ui.kpiDate = t.value || H.today(); render(); }
    else if (act === 'close-admin') { ui.closeAdmin = t.value; render(); }
    else if (act === 'auto-approve') run(() => api.act('updateSettings', { autoApprove: t.checked }), t.checked ? 'ระบบจะส่งรายชื่อให้ Telesales ทันที' : 'รายชื่อจะรออนุมัติก่อนส่ง');
    else if (act === 'kpi-channel') { const f = t.closest('form'); const rf = $('[data-round-field]', f); if (rf) rf.hidden = t.value !== 'fb'; }
    if (t.name === 'round' && t.closest('form[data-form=call]')) { const h = $('[data-round-hint]', t.closest('form')); if (h) h.textContent = H.ROUNDS[t.value] || ''; }
  });
  let qTimer = null;
  document.addEventListener('input', (e) => {
    const t = e.target;
    if (t.id === 'cust-q') { clearTimeout(qTimer); qTimer = setTimeout(() => { ui.q = t.value; ui.limit = 120; $('#cust-list').innerHTML = custTable(); }, 180); return; }
    if (t.dataset.item) {
      const row = t.closest('.item-row');
      if (t.dataset.item === 'name') { const p = products().find((x) => x.code === t.value.trim() || x.name === t.value.trim()); if (p) $('[data-item=price]', row).value = p.price; }
      updateTotals(row); return;
    }
    if (t.dataset.totalFor) { t.dataset.touched = t.value ? '1' : ''; }
    if (t.dataset.actInput === 'kpi-phone') { const c = H.byPhone(V(), t.value); const f = t.closest('form'); if (c && f.name && !f.name.value) { f.name.value = c.name; if (c.channel === 'ecom') { f.channel.value = 'mkt'; $('[data-round-field]', f).hidden = true; } } }
    if (t.dataset.actInput === 'close-phone') {
      const hint = $('[data-close-hint]'); const ph = H.normPhone(t.value);
      const c = ph.length >= 9 ? H.byPhone(S.full || V(), ph) : null;
      hint.innerHTML = c ? '<span class="pill info">ลูกค้าเก่า</span> ' + esc(c.name) + (c.owner ? ' : จะส่งกลับให้ ' + esc(uname(c.owner)) + ' ทันที' : '') : (ph.length >= 9 && S.me.role === 'admin' ? '<span class="muted">ลูกค้าใหม่</span>' : '');
      if (c && !t.form.name.value) t.form.name.value = c.name;
      if (c && !t.form.address.value) t.form.address.value = c.address || '';
    }
  });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') { if (modal) closeModal(); else if (ui.drawer) { ui.drawer = null; render(); } } });

  document.addEventListener('submit', async (e) => {
    const f = e.target; const kind = f.dataset.form; if (!kind) return;
    e.preventDefault();
    const btn = $('button:not([type=button])', f); if (btn) btn.disabled = true;
    try {
      if (kind === 'call') {
        if (!f.result.value) throw new Error('เลือกผลการโทรก่อนบันทึก');
        if (timers.d) handlers.timer($('[data-act=timer]', f));
        await api.act('logCall', { customerId: f.dataset.id, result: f.result.value, lostReason: f.lostReason.value, durationSec: readHms(f, 'd'), round: f.round ? f.round.value : '', items: readItems('call-items'), amount: f.amount.value, note: f.note.value, nextAt: fromLocal(f.nextAt.value), nextPurpose: f.nextPurpose.value });
        toast('บันทึกการโทรแล้ว · นับเข้า KPI วันนี้');
      } else if (kind === 'appt') {
        await api.act('addAppt', { customerId: f.dataset.id, at: fromLocal(f.at.value), purpose: f.purpose.value, round: f.round.value }); toast('บันทึกนัดแล้ว');
      } else if (kind === 'order') {
        await api.act('addOrder', { customerId: f.dataset.id, items: readItems('order-items'), date: fromLocal(f.date.value), total: f.total.value, status: f.status.value, note: f.note.value }); toast('เพิ่มออเดอร์แล้ว');
      } else if (kind === 'edit') {
        await api.act('updateCustomer', { id: f.dataset.id, patch: { name: f.name.value, phone: f.phone.value, address: f.address.value, status: f.status.value, round: f.round ? f.round.value : undefined, owner: f.owner ? f.owner.value : undefined } }); toast('บันทึกข้อมูลลูกค้าแล้ว');
      } else if (kind === 'note') {
        await api.act('addNote', { customerId: ui.drawer, text: f.text.value }); toast('บันทึกโน้ตแล้ว');
      } else if (kind === 'kpi-call' || kind === 'kpi-sum') {
        if (timers.d) handlers.timer($('[data-act=timer]', f));
        const user = boss() ? ($('[data-act=kpi-user]') || {}).value : undefined;
        const base = { user, date: f.date.value, channel: f.channel.value, round: f.round.value, note: f.note.value, durationSec: readHms(f, 'd'), amount: f.amount.value };
        if (kind === 'kpi-call') await api.act('addKpi', { ...base, mode: 'call', phone: f.phone.value, name: f.name.value, result: f.result.value, items: readItems('kpi-items') });
        else await api.act('addKpi', { ...base, mode: 'summary', calls: f.calls.value, talkedCount: f.talkedCount.value, orders: f.orders.value, items: readItems('sum-items') });
        toast('บันทึก KPI แล้ว · ขึ้น Dashboard ผู้บริหารทันที');
      } else if (kind === 'close') {
        const r = await api.act('createClose', { name: f.name.value, phone: f.phone.value, address: f.address.value, page: f.page.value, items: readItems('close-items'), total: f.total.value, note: f.note.value, closer: f.closer ? f.closer.value : undefined });
        const ap = (S.full || V()).approvals.find((a) => a.id === (r && r.id)) || (V().approvals || [])[0];
        toast(ap && ap.status === 'approved' ? 'บันทึกแล้ว · ส่งรายชื่อให้ ' + uname(ap.assigned) + ' แล้ว' : 'บันทึกแล้ว · เสนอให้ ' + uname(r && r.proposed) + ' (รออนุมัติ)');
      } else if (kind === 'add-customer') {
        const r = await api.act('addCustomer', { name: f.name.value, phone: f.phone.value, address: f.address.value, channel: f.channel.value, platform: f.platform.value || undefined, owner: f.owner ? f.owner.value : undefined, note: f.note.value });
        closeModal(); ui.drawer = r && r.id; ui.dTab = 'call'; toast('เพิ่มลูกค้าแล้ว');
      } else if (kind === 'new-appt') {
        const v = V(); const val = f.cust.value; const ph = H.normPhone(val.split('·').pop());
        const c = H.byPhone(v, ph) || (v.customers || []).find((x) => x.name === val.trim());
        if (!c) throw new Error('ไม่พบลูกค้า เลือกจากรายการที่แสดง');
        await api.act('addAppt', { customerId: c.id, at: fromLocal(f.at.value), purpose: f.purpose.value, round: f.round.value }); closeModal(); toast('บันทึกนัดแล้ว');
      } else if (kind === 'targets') {
        const targets = {}; for (const k of Object.keys((S.full || V()).settings.targets)) if (f[k]) targets[k] = f[k].value;
        await api.act('updateSettings', { targets, staleDays: { fb: f.staleFb.value, ecom: f.staleEcom.value } }); toast('บันทึกเป้า KPI แล้ว');
      } else if (kind === 'ann') {
        await api.act('addAnnouncement', { title: f.title.value, body: f.body.value }); toast('ประกาศแล้ว');
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
        toast('นำเข้า ' + r.received + ' แถว · ลูกค้าใหม่ ' + r.added + ' · ออเดอร์ ' + r.orders + (r.masked ? ' · เบอร์ถูกปิด ' + r.masked : ''));
      }
      render();
    } catch (err) { toast(err.message || String(err), true); if (btn) btn.disabled = false; }
  });

  // ------------------------------------------------------------ boot
  async function start() {
    const ok = await api.boot().catch(() => false);
    if (!ok) { renderLogin(); return; }
    const hash = (location.hash || '').slice(1);
    S.page = PAGES[hash] && allowed(hash) ? hash : (boss() ? 'home' : 'home');
    render();
    if (!DEMO) setInterval(async () => {
      if (document.hidden || modal || ui.drawer || (document.activeElement && /INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName))) return;
      if (await api.refresh().catch(() => false)) render();
    }, 20000);
  }
  start();
})();
