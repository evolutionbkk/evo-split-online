// ==UserScript==
// @name         Evolution Hub · BigSeller → แยกช่องทาง Lazada / Shopee / TikTok
// @namespace    evolution.hub.bigseller
// @version      1.0
// @description  อ่านออเดอร์ที่ BigSeller แสดงอยู่ แล้วส่งชื่อ เบอร์ ช่องทาง (Lazada/Shopee/TikTok) เลขพัสดุ และสถานะจัดส่ง เข้า Evolution Hub ให้อัตโนมัติ
// @match        https://*.bigseller.com/*
// @match        https://bigseller.com/*
// @run-at       document-start
// @grant        GM_xmlhttpRequest
// @grant        unsafeWindow
// @connect      __HOST__
// ==/UserScript==
(function () {
  'use strict';
  var HUB = '__HUB__', KEY = '__KEY__';
  var W = typeof unsafeWindow !== 'undefined' ? unsafeWindow : window;
  if (W.__evoHubBS) return; W.__evoHubBS = true;

  // ---------- find order-like records inside any JSON BigSeller loads ----------
  var RX = {
    phone: /(phone|mobile|tel)(?!.*(code|country|area))/i,
    name: /^(buyer|receiver|recipient|consignee|customer|contact)?_?(full)?_?name$|buyer.?name|receiver.?name|consignee|recipient.?name|customer.?name/i,
    platform: /^(platform|channel|marketplace|shop.?type|platform.?name|platform.?code|source)$/i,
    shop: /shop.?name|store.?name|^shop$|^store$/i,
    orderNo: /platform.?order.?(no|sn|id)|^order.?(no|sn|number|id)$|^orderno$|^ordersn$/i,
    tracking: /tracking.?(no|number|code)|waybill|logistics.?(no|number)|express.?(no|number)|^tracking$/i,
    carrier: /logistics.?(name|company|provider|channel)|carrier|shipping.?(provider|carrier|name|channel)|express.?(company|name)|delivery.?(company|name)/i,
    status: /^(order.?)?status(.?(name|desc|text|str))?$|logistics.?status|ship(ping)?.?status|platform.?status/i,
    total: /(total|order|pay|grand).?(amount|price|total)|^amount$|^total$/i,
    address: /^(full.?)?address|address.?(detail|full)|detail.?address/i,
    date: /(create|order|pay|place).?(time|date|at)/i,
  };
  var PL = /shopee|lazada|tiktok/i;
  function str(v) { return v == null ? '' : typeof v === 'object' ? '' : String(v).trim(); }
  function pick(o, re) { for (var k in o) if (re.test(k)) { var v = str(o[k]); if (v) return v; } return ''; }
  function phoneOf(o) { for (var k in o) if (RX.phone.test(k)) { var v = str(o[k]); var d = v.replace(/\D/g, ''); if (v.indexOf('*') < 0 && d.length >= 9 && d.length <= 13) return v; } return ''; }
  function platOf(o) {
    var v = pick(o, RX.platform) + ' ' + pick(o, RX.shop);
    var m = v.match(PL); return m ? m[0].toLowerCase() : '';
  }
  function walk(node, ctx, out, depth) {
    if (!node || typeof node !== 'object' || depth > 9) return;
    if (Array.isArray(node)) { for (var i = 0; i < node.length; i++) walk(node[i], ctx, out, depth + 1); return; }
    var c = { platform: platOf(node) || ctx.platform, shop: pick(node, RX.shop) || ctx.shop, orderNo: pick(node, RX.orderNo) || ctx.orderNo,
      tracking: pick(node, RX.tracking) || ctx.tracking, carrier: pick(node, RX.carrier) || ctx.carrier, status: pick(node, RX.status) || ctx.status,
      total: pick(node, RX.total) || ctx.total, date: pick(node, RX.date) || ctx.date };
    var ph = phoneOf(node), start = out.length;
    if (ph) out.push({ phone: ph, name: pick(node, RX.name) || ctx.name || '', address: pick(node, RX.address), platform: c.platform, shop: c.shop, orderNo: c.orderNo, tracking: c.tracking, carrier: c.carrier, shipStatus: c.status, total: Number(String(c.total).replace(/[^\d.]/g, '')) || 0, date: c.date });
    c.name = pick(node, RX.name) || ctx.name;
    for (var k in node) if (node[k] && typeof node[k] === 'object') walk(node[k], c, out, depth + 1);
    // a child (receiver/address block) may hold the phone while the parent holds order fields: fill those in
    for (var j = start; j < out.length; j++) { var r = out[j]; if (!r.platform && c.platform) r.platform = c.platform; if (!r.orderNo && c.orderNo) r.orderNo = c.orderNo; if (!r.tracking && c.tracking) r.tracking = c.tracking; if (!r.carrier && c.carrier) r.carrier = c.carrier; if (!r.shipStatus && c.status) r.shipStatus = c.status; if (!r.total && c.total) r.total = Number(String(c.total).replace(/[^\d.]/g, '')) || 0; }
  }
  var queue = {}, sent = 0, added = 0, tagged = 0, masked = 0;
  function take(text) {
    if (!text || text.length < 20 || text.length > 8e6) return;
    var c0 = text.charAt(0); if (c0 !== '{' && c0 !== '[') return;
    var j; try { j = JSON.parse(text); } catch (e) { return; }
    var out = []; walk(j, {}, out, 0);
    for (var i = 0; i < out.length; i++) {
      var r = out[i]; if (!r.platform) continue;           // only rows we can attribute to a marketplace
      var k = r.phone.replace(/\D/g, '') + '|' + (r.orderNo || '');
      queue[k] = r;
    }
  }
  // ---------- tap BigSeller's own requests (no extra calls to BigSeller) ----------
  var XO = W.XMLHttpRequest.prototype.open, XS = W.XMLHttpRequest.prototype.send;
  W.XMLHttpRequest.prototype.open = function () { this.__u = arguments[1]; return XO.apply(this, arguments); };
  W.XMLHttpRequest.prototype.send = function () { var x = this; x.addEventListener('load', function () { try { if (!x.responseType || x.responseType === 'text') take(x.responseText); else if (x.responseType === 'json') take(JSON.stringify(x.response)); } catch (e) {} }); return XS.apply(this, arguments); };
  if (W.fetch) { var F = W.fetch; W.fetch = function () { return F.apply(this, arguments).then(function (res) { try { res.clone().text().then(take).catch(function () {}); } catch (e) {} return res; }); }; }

  // ---------- push to the hub every few seconds ----------
  function flush() {
    var rows = Object.keys(queue).map(function (k) { return queue[k]; }); queue = {};
    if (!rows.length) return;
    GM_xmlhttpRequest({ method: 'POST', url: HUB + '/api/ingest/bigseller', headers: { 'Content-Type': 'application/json', 'x-ingest-key': KEY }, data: JSON.stringify({ rows: rows, src: 'bstab' }),
      onload: function (r) { try { var j = JSON.parse(r.responseText); sent += rows.length; added += j.added || 0; tagged += j.tagged || 0; masked += j.masked || 0; badge(); } catch (e) { badge('ส่งไม่สำเร็จ (' + r.status + ')'); } },
      onerror: function () { badge('เชื่อม Hub ไม่ได้'); } });
  }
  setInterval(flush, 5000);
  var el;
  function badge(err) {
    if (!document.body) return;
    if (!el) { el = document.createElement('div'); el.style.cssText = 'position:fixed;right:14px;bottom:14px;z-index:2147483647;background:#1e3a8a;color:#fff;font:12px/1.4 system-ui,sans-serif;padding:8px 12px;border-radius:10px;box-shadow:0 6px 20px rgba(0,0,0,.25);opacity:.92;pointer-events:none'; document.body.appendChild(el); }
    el.textContent = err ? 'Evolution Hub : ' + err : 'Evolution Hub : ส่งแล้ว ' + sent + ' รายการ · ลูกค้าใหม่ ' + added + ' · ระบุช่องทาง ' + tagged + (masked ? ' · เบอร์ถูกซ่อน ' + masked : '');
  }
  document.addEventListener('DOMContentLoaded', function () { badge(); });
  // keep an order list fresh when the tab is left open and nobody is using it
  var last = Date.now(); ['mousemove', 'keydown', 'scroll', 'click'].forEach(function (e) { W.addEventListener(e, function () { last = Date.now(); }, true); });
  setInterval(function () { if (/order/i.test(location.href) && Date.now() - last > 5 * 60000) location.reload(); }, 60000 * 10);
})();
