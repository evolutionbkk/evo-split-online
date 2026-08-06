// ==UserScript==
// @name         Evolution — แบ่งลูกค้า Sales(W)/Sales(K) อัตโนมัติ
// @namespace    evo.wk.autosplit
// @version      1.1
// @description  เปิดหน้าลูกค้าปลีกแล้วดึง+กรองเบอร์+แบ่ง W/K ให้อัตโนมัติ เติมเฉพาะรายใหม่ต่อคิว จำต่อเนื่อง พร้อมดาวน์โหลด Excel/CSV
// @match        https://app.evolutionecommerce.co.th/party/customer*
// @run-at       document-idle
// @grant        none
// ==/UserScript==
(function(){
  'use strict';
  if(window.__evoWK) return; window.__evoWK=true;

  var LS='evoWK_state_v1';
  var API='https://app.evolutionecommerce.co.th:8443/api/person/getPersons/CUSTOMER/find';
  var BASE_DATE='25/07/2569';
  // ===== ตั้งค่าเชื่อมเว็บออนไลน์ (Railway) — ถ้าเว้นว่างจะทำงานเฉพาะในเครื่อง =====
  var SYNC_URL='https://evo-split-online-production.up.railway.app'; // เว็บแอป (ตั้งให้แล้ว)
  var SYNC_KEY='';          // *** ใส่ค่า INGEST_KEY (ตัวเดียวกับใน Railway) ตรงนี้ ***
  var AUTO_REFRESH_MIN=0;   // >0 = ดึงซ้ำอัตโนมัติทุกกี่นาที (real-time) ระหว่างเปิดหน้าไว้, 0 = ปิด
  var SEED=[];

  var state={assigned:[],maxRound:1};
  var seen=new Set();
  var lastNewW=0,lastNewK=0,lastDup=0,lastCut=0,lastRound=1;

  function clean(s){return String(s==null?'':s).replace(/\D/g,'');}
  function valid(p){return /^0[2689]\d{8}$/.test(clean(p));}
  function keyOf(r){return (r.code&&(''+r.code).trim())?('C:'+(''+r.code).trim()):('NP:'+(''+(r.name||'')).trim()+'|'+clean(r.phone));}
  function roundName(n){return n===1?'ตั้งต้น':('รอบ '+n);}
  function todayTH(){var d=new Date(),p=function(n){return String(n).padStart(2,'0');};return p(d.getDate())+'/'+p(d.getMonth()+1)+'/'+(d.getFullYear()+543);}
  function nextSide(){var w=0,k=0;state.assigned.forEach(function(a){a.sales==='W'?w++:k++;});return w<=k?'W':'K';}
  function rebuildSeen(){seen=new Set();state.assigned.forEach(function(a){seen.add(keyOf(a));});}

  function load(){
    try{var s=localStorage.getItem(LS);if(s){state=JSON.parse(s);}}catch(e){}
    if(!state||!Array.isArray(state.assigned)||!state.assigned.length){
      // seed
      state={assigned:[],maxRound:1};
      SEED.forEach(function(r){
        if(!valid(r.p))return;
        var rec={code:r.c,name:r.n,phone:clean(r.p),sales:null,round:1,date:BASE_DATE};
        rec.sales=nextSide(); state.assigned.push(rec);
      });
    }
    rebuildSeen();
    if(!state.maxRound)state.maxRound=1;
  }
  function save(){try{localStorage.setItem(LS,JSON.stringify(state));}catch(e){}}

  function applyNew(records,label){
    var vnew=[]; lastDup=0; lastCut=0;
    records.forEach(function(r){
      var rec={code:(r.code||'').trim(),name:(r.name||'').trim(),phone:clean(r.phone)};
      if(!(rec.code||rec.name||rec.phone))return;
      if(!valid(rec.phone)){lastCut++;return;}
      var k=keyOf(rec);
      if(seen.has(k)){lastDup++;return;}
      seen.add(k); vnew.push(rec);
    });
    lastNewW=0;lastNewK=0;lastRound=state.maxRound;
    if(vnew.length){
      lastRound=state.maxRound+1; state.maxRound=lastRound;
      var dt=(label&&label.trim())?label.trim():todayTH();
      vnew.forEach(function(rec){
        var s=nextSide(); rec.sales=s; rec.round=lastRound; rec.date=dt;
        state.assigned.push(rec); s==='W'?lastNewW++:lastNewK++;
      });
    }
    save();
    return vnew.length;
  }

  function listW(){return state.assigned.filter(function(a){return a.sales==='W';});}
  function listK(){return state.assigned.filter(function(a){return a.sales==='K';});}

  function getAuth(){try{return JSON.parse(localStorage.getItem('auth'));}catch(e){return null;}}
  function facility(){var a=getAuth();if(a){if(typeof a.facilityIdActive==='string')return a.facilityIdActive;if(Array.isArray(a.facilityId)&&a.facilityId.length)return a.facilityId[0];}return 'WebStoreWarehouse';}

  function fetchAll(){
    var a=getAuth(); if(!a||!a.accessToken){return Promise.reject('ไม่พบ token — กรุณาล็อกอิน Evolution');}
    var body={filter:{FACILITY_ID:facility()},paginator:{page:1,pageSize:100000,total:0,pageSizes:[]},sorting:{column:'PARTY_ID',direction:'desc'},searchTerm:'',grouping:{selectedRowIds:{},itemIds:[],selectAll:false}};
    return fetch(API,{method:'POST',credentials:'include',headers:{'Content-Type':'application/json','x-access-token':a.accessToken},body:JSON.stringify(body)})
      .then(function(r){if(r.status===401||r.status===403)throw 'token หมดอายุ — กรุณารีเฟรชหน้าและล็อกอินใหม่';return r.json();})
      .then(function(j){return (j.items||[]).map(function(it){var p=it.person||{};var nm=[p.FIRST_NAME,p.MIDDLE_NAME,p.LAST_NAME].filter(function(x){return x&&(''+x).trim();}).join(' ').trim();var ph=(it.telecomNumber&&it.telecomNumber.CONTACT_NUMBER)||'';return {code:it.PARTY_ID,name:nm,phone:ph};});});
  }

  // ---------- download ----------
  function dl(content,fname,type){var b=new Blob([content],{type:type});var u=URL.createObjectURL(b);var a=document.createElement('a');a.href=u;a.download=fname;document.body.appendChild(a);a.click();a.remove();setTimeout(function(){URL.revokeObjectURL(u);},2000);}
  function csvEsc(s){s=String(s==null?'':s);return /[",\r\n]/.test(s)?'"'+s.replace(/"/g,'""')+'"':s;}
  function toCsv(list){var head='ลำดับ,รหัสสมาชิก,ชื่อ-นามสกุล,เบอร์โทรศัพท์,รอบที่ดึง,วันที่แบ่ง';return '﻿'+head+'\n'+list.map(function(r,i){return [i+1,csvEsc(r.code),csvEsc(r.name),csvEsc(r.phone),csvEsc(roundName(r.round)),csvEsc(r.date)].join(',');}).join('\n');}
  function exportCsv(which){var list=which==='W'?listW():listK();dl(toCsv(list),'Sales_'+which+'_'+list.length+'.csv','text/csv;charset=utf-8');}
  function ensureXLSX(){return new Promise(function(res,rej){if(window.XLSX)return res();var s=document.createElement('script');s.src='https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';s.onload=function(){res();};s.onerror=function(){rej('โหลดตัวสร้าง Excel ไม่สำเร็จ');};document.head.appendChild(s);});}
  function exportXlsx(){
    ensureXLSX().then(function(){
      var W=listW(),K=listK();
      var mk=function(list){return [['ลำดับ','รหัสสมาชิก','ชื่อ-นามสกุล','เบอร์โทรศัพท์','รอบที่ดึง','วันที่แบ่ง']].concat(list.map(function(r,i){return [i+1,r.code,r.name,r.phone,roundName(r.round),r.date];}));};
      var all=[['ลำดับ','รหัสสมาชิก','ชื่อ-นามสกุล','เบอร์โทรศัพท์','เซลล์','รอบที่ดึง','วันที่แบ่ง']].concat(state.assigned.map(function(r,i){return [i+1,r.code,r.name,r.phone,r.sales,roundName(r.round),r.date];}));
      var wb=XLSX.utils.book_new();
      var wsW=XLSX.utils.aoa_to_sheet(mk(W)),wsK=XLSX.utils.aoa_to_sheet(mk(K)),wsA=XLSX.utils.aoa_to_sheet(all);
      wsW['!cols']=wsK['!cols']=[{wch:7},{wch:15},{wch:32},{wch:16},{wch:12},{wch:14}];
      wsA['!cols']=[{wch:7},{wch:15},{wch:32},{wch:16},{wch:8},{wch:12},{wch:14}];
      W.forEach(function(r,i){var c=XLSX.utils.encode_cell({r:i+1,c:3});if(wsW[c])wsW[c].t='s';});
      K.forEach(function(r,i){var c=XLSX.utils.encode_cell({r:i+1,c:3});if(wsK[c])wsK[c].t='s';});
      state.assigned.forEach(function(r,i){var c=XLSX.utils.encode_cell({r:i+1,c:3});if(wsA[c])wsA[c].t='s';});
      XLSX.utils.book_append_sheet(wb,wsW,'Sales(W)');
      XLSX.utils.book_append_sheet(wb,wsK,'Sales(K)');
      XLSX.utils.book_append_sheet(wb,wsA,'ทั้งหมด');
      XLSX.writeFile(wb,'รายชื่อลูกค้า_แบ่ง_W_K.xlsx');
    }).catch(function(e){setStatus('❌ '+e);});
  }

  // ---------- UI ----------
  var panel,statusEl,statEl,listBox;
  function css(){var s=document.createElement('style');s.textContent=
   '#evoWK{position:fixed;right:18px;bottom:18px;z-index:999999;width:340px;background:#fff;border:1px solid #e5e7eb;border-radius:14px;box-shadow:0 10px 30px rgba(0,0,0,.18);font-family:Sarabun,Tahoma,sans-serif;color:#1f2937;font-size:13px;overflow:hidden}'
  +'#evoWK .hd{background:#1f4e79;color:#fff;padding:10px 14px;font-weight:700;display:flex;justify-content:space-between;align-items:center}'
  +'#evoWK .hd .x{cursor:pointer;opacity:.85;font-weight:400}'
  +'#evoWK .bd{padding:12px 14px}'
  +'#evoWK .st{font-size:12px;color:#6b7280;min-height:16px;margin-bottom:8px}'
  +'#evoWK .grid{display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-bottom:10px}'
  +'#evoWK .box{background:#f4f6f9;border-radius:9px;padding:8px;text-align:center}'
  +'#evoWK .box b{display:block;font-size:19px}'
  +'#evoWK .box.w b{color:#1f6f3b}#evoWK .box.k b{color:#b45309}#evoWK .box.t b{color:#1f4e79}'
  +'#evoWK .box span{font-size:11px;color:#6b7280}'
  +'#evoWK .btns{display:flex;flex-wrap:wrap;gap:7px}'
  +'#evoWK button{font-family:inherit;font-size:12.5px;font-weight:600;border:0;border-radius:8px;padding:8px 11px;cursor:pointer}'
  +'#evoWK .b1{background:#166534;color:#fff}#evoWK .b2{background:#1f6f3b;color:#fff}#evoWK .b3{background:#b45309;color:#fff}#evoWK .b4{background:#1f4e79;color:#fff}#evoWK .bg{background:#eef1f5;color:#1f2937}'
  +'#evoWK .lst{margin-top:10px;max-height:220px;overflow:auto;border-top:1px solid #eee;display:none}'
  +'#evoWK table{width:100%;border-collapse:collapse;font-size:11.5px}#evoWK th,#evoWK td{padding:4px 6px;border-bottom:1px solid #f0f2f5;text-align:left;white-space:nowrap}'
  +'#evoWK tr.nw td{background:#fffbe6}';
   document.head.appendChild(s);}
  function build(){
    css();
    panel=document.createElement('div');panel.id='evoWK';
    panel.innerHTML=''
     +'<div class="hd"><span>⚡ แบ่งลูกค้า W / K</span><span class="x" title="ซ่อน">✕</span></div>'
     +'<div class="bd">'
     +'<div class="st" id="evoWKst">กำลังเริ่ม…</div>'
     +'<div class="grid"><div class="box t"><b id="evoWKa">0</b><span>รวม</span></div><div class="box w"><b id="evoWKw">0</b><span>Sales(W)</span></div><div class="box k"><b id="evoWKk">0</b><span>Sales(K)</span></div></div>'
     +'<div class="btns">'
     +'<button class="b1" id="evoWKxlsx">⬇ Excel</button>'
     +'<button class="b2" id="evoWKcsvW">⬇ CSV W</button>'
     +'<button class="b3" id="evoWKcsvK">⬇ CSV K</button>'
     +'<button class="b4" id="evoWKsync">🔄 ดึงอีกครั้ง</button>'
     +'<button class="bg" id="evoWKview">▾ ดูรายชื่อ</button>'
     +'<button class="bg" id="evoWKreset">↺ รีเซ็ต</button>'
     +'</div>'
     +'<div class="lst" id="evoWKlist"></div>'
     +'</div>';
    document.body.appendChild(panel);
    statusEl=panel.querySelector('#evoWKst');
    listBox=panel.querySelector('#evoWKlist');
    panel.querySelector('.x').onclick=function(){panel.style.display='none';};
    panel.querySelector('#evoWKxlsx').onclick=exportXlsx;
    panel.querySelector('#evoWKcsvW').onclick=function(){exportCsv('W');};
    panel.querySelector('#evoWKcsvK').onclick=function(){exportCsv('K');};
    panel.querySelector('#evoWKsync').onclick=function(){sync(true);};
    panel.querySelector('#evoWKview').onclick=toggleList;
    panel.querySelector('#evoWKreset').onclick=function(){if(confirm('รีเซ็ตกลับเป็นข้อมูลตั้งต้น 376 ราย (รอบ 1)? การเติมรายใหม่ที่ผ่านมาจะถูกล้าง')){localStorage.removeItem(LS);state={assigned:[],maxRound:1};load();renderStats();setStatus('รีเซ็ตแล้ว');}};
  }
  function setStatus(t){if(statusEl)statusEl.textContent=t;}
  function renderStats(){
    panel.querySelector('#evoWKa').textContent=state.assigned.length;
    panel.querySelector('#evoWKw').textContent=listW().length;
    panel.querySelector('#evoWKk').textContent=listK().length;
  }
  function toggleList(){
    if(listBox.style.display==='block'){listBox.style.display='none';return;}
    var W=listW(),K=listK(),n=Math.max(W.length,K.length);
    var h='<table><thead><tr><th>#</th><th>W: รหัส</th><th>ชื่อ</th><th>K: รหัส</th><th>ชื่อ</th></tr></thead><tbody>';
    for(var i=0;i<n;i++){var w=W[i],k=K[i];h+='<tr class="'+((w&&w.round>1)||(k&&k.round>1)?'nw':'')+'"><td>'+(i+1)+'</td><td>'+(w?w.code:'')+'</td><td>'+(w?w.name:'')+'</td><td>'+(k?k.code:'')+'</td><td>'+(k?k.name:'')+'</td></tr>';}
    h+='</tbody></table>';listBox.innerHTML=h;listBox.style.display='block';
  }

  function pushToServer(records){
    return fetch(SYNC_URL.replace(/\/+$/,'')+'/api/ingest',{method:'POST',headers:{'Content-Type':'application/json','x-ingest-key':SYNC_KEY},body:JSON.stringify({customers:records})})
      .then(function(r){if(!r.ok)throw ('HTTP '+r.status);return r.json();});
  }
  // Relay the Evolution access token so the web app's "ดึงรายชื่อ" button can pull on demand.
  function pushToken(){
    if(!SYNC_URL||!SYNC_KEY)return Promise.resolve();
    var a=getAuth();
    if(!a||!a.accessToken)return Promise.resolve();
    return fetch(SYNC_URL.replace(/\/+$/,'')+'/api/token',{method:'POST',headers:{'Content-Type':'application/json','x-ingest-key':SYNC_KEY},body:JSON.stringify({token:a.accessToken,facility:facility()})})
      .then(function(r){return r.ok?r.json():null;}).catch(function(){return null;});
  }

  function sync(manual){
    setStatus('⏳ กำลังดึงข้อมูลจากระบบ…');
    pushToken(); // keep the web app's token fresh so its pull button works
    fetchAll().then(function(records){
      var n=applyNew(records);
      renderStats();
      if(listBox.style.display==='block')toggleList();
      var localMsg = n>0 ? ('เพิ่มใหม่ '+n+' (W '+lastNewW+'/K '+lastNewK+')') : 'ไม่มีรายใหม่';
      if(SYNC_URL){
        setStatus('☁ กำลังส่งขึ้นเว็บ…');
        pushToServer(records).then(function(res){
          var s=res.summary||{};
          setStatus('☁ ส่งขึ้นเว็บแล้ว: เพิ่มใหม่ '+s.added+' (W '+s.addW+'/K '+s.addK+') · ข้ามซ้ำ '+s.dup+' · เบอร์ไม่ผ่าน '+s.cut+' · รวมบนเว็บ '+res.total);
        }).catch(function(e){ setStatus('⚠ แบ่งในเครื่องแล้ว ('+localMsg+') แต่ส่งขึ้นเว็บไม่สำเร็จ: '+e); });
      } else {
        if(n>0){setStatus('✅ '+roundName(lastRound)+' ('+ (state.assigned.find(function(a){return a.round===lastRound;})||{}).date +'): เพิ่มใหม่ '+n+' ราย (W '+lastNewW+'/K '+lastNewK+') · ข้ามซ้ำ '+lastDup+' · เบอร์ไม่ผ่าน '+lastCut);}
        else{setStatus('✔ ข้อมูลเป็นปัจจุบัน ไม่มีรายใหม่ (ข้ามซ้ำ '+lastDup+' · เบอร์ไม่ผ่าน '+lastCut+')');}
      }
    }).catch(function(e){setStatus('❌ '+e);});
  }

  // start
  load(); build(); renderStats(); setStatus('พร้อม · ฐาน '+state.assigned.length+' ราย — กำลังตรวจรายใหม่…');
  pushToken(); // relay token immediately on page open so the web "ดึงรายชื่อ" button connects
  setTimeout(function(){sync(false);},1200);
  if(AUTO_REFRESH_MIN>0){setInterval(function(){sync(false);},AUTO_REFRESH_MIN*60000);}
})();
