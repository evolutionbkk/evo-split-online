# แบ่งรายชื่อลูกค้าให้เซลล์ (W/K) — เว็บแอดมินออนไลน์

เว็บแอปฐานข้อมูลกลาง สำหรับแบ่งรายชื่อลูกค้า Evolution ให้ Sales(W) และ Sales(K)
- ล็อกอินแอดมิน 1 คน
- รับข้อมูลลูกค้าใหม่จากสคริปต์ในเบราว์เซอร์ (ปลอดภัย ไม่ต้องเก็บรหัสผ่าน Evolution บนเซิร์ฟเวอร์)
- กรองเบอร์ (เก็บเฉพาะ 02/06/08/09 ครบ 10 หลัก) กันซ้ำด้วยรหัสสมาชิก เติมเฉพาะรายใหม่ต่อคิว ของเดิมไม่เปลี่ยนเซลล์
- บันทึกรอบ/วันที่ ดาวน์โหลด Excel/CSV

## Deploy บน Railway

1. อัปโหลดโค้ดชุดนี้ขึ้น GitHub (repo ใหม่) แล้วใน Railway เลือก **New Project → Deploy from GitHub repo**
   หรือใช้ Railway CLI: `railway init` แล้ว `railway up`
2. Railway จะรัน `npm install` และ `npm start` ให้อัตโนมัติ (พอร์ตอ่านจาก `PORT` ที่ Railway ใส่ให้)
3. ตั้งค่า **Variables** ในโปรเจกต์ Railway:
   - `ADMIN_USER` — ชื่อผู้ใช้แอดมิน (เช่น `admin`)
   - `ADMIN_PASS` — รหัสผ่านแอดมิน (ตั้งให้ปลอดภัย)
   - `SESSION_SECRET` — ข้อความสุ่มยาว ๆ (ไว้เซ็นคุกกี้)
   - `INGEST_KEY` — คีย์ลับ สำหรับให้สคริปต์เบราว์เซอร์ส่งข้อมูลขึ้น
4. **ความคงทนของข้อมูล (เลือก 1 อย่าง):**
   - **แนะนำ:** กด **New → Database → PostgreSQL** ใน Railway โปรเจกต์เดียวกัน — ระบบจะตั้ง `DATABASE_URL` ให้เอง แอปจะใช้ Postgres อัตโนมัติ
   - หรือผูก **Volume** แล้วตั้ง Variable `DATA_DIR` ไปที่ path ของ volume (เช่น `/app/data`) — แอปจะเก็บเป็นไฟล์ JSON
   - ถ้าไม่ทำทั้งสองอย่าง ข้อมูลจะหายเมื่อ redeploy/restart (เพราะดิสก์ของ Railway เป็นชั่วคราว)
5. เปิด URL ที่ Railway ให้ (เช่น `https://xxx.up.railway.app`) → ล็อกอินด้วย ADMIN_USER/ADMIN_PASS

ครั้งแรกระบบจะ seed ฐานตั้งต้น 376 รายให้อัตโนมัติ (W 188 / K 188) ตรงกับไฟล์ Excel ที่เคยได้

## ป้อนข้อมูลลูกค้าใหม่เข้าเว็บ (2 วิธี)

**วิธีอัตโนมัติ (แนะนำ):** ติดตั้งสคริปต์ `evolution_wk_autosplit.user.js` ใน Tampermonkey แล้วแก้ค่าด้านบนของสคริปต์:
```js
var SYNC_URL   = 'https://xxx.up.railway.app';  // URL เว็บแอปบน Railway
var INGEST_KEY = 'ค่าที่ตรงกับ INGEST_KEY ในเว็บ';
```
จากนั้นเปิดหน้า Evolution → ลูกค้าปลีก สคริปต์จะดึงข้อมูลแล้วส่งขึ้นเว็บให้อัตโนมัติ (มีปุ่ม "☁ ส่งขึ้นเว็บ" ด้วย)

**วิธีมือ:** ในหน้าแอดมิน มีช่องให้ "วางรายชื่อ" คัดลอกจากตาราง Evolution มาวางแล้วกดเพิ่มได้เลย

## รันในเครื่อง (ทดสอบ)
```bash
npm install
ADMIN_USER=admin ADMIN_PASS=secret SESSION_SECRET=xyz INGEST_KEY=key npm start
# เปิด http://localhost:3000
```

## Endpoints
- `GET /` — หน้าแอดมิน (ต้องล็อกอิน)
- `POST /api/ingest` — รับข้อมูลจากสคริปต์ (header `x-ingest-key`) body `{customers:[{code,name,phone}], label}`
- `GET /export/xlsx`, `GET /export/csv?side=W|K` — ดาวน์โหลด (ต้องล็อกอิน)

## หมายเหตุความปลอดภัย/ความเป็นส่วนตัว
ข้อมูลนี้เป็นชื่อ/เบอร์ลูกค้า (ข้อมูลส่วนบุคคล) โปรดตั้งรหัสผ่านแอดมินให้แข็งแรง เปิดใช้ผ่าน HTTPS (Railway ให้มาอยู่แล้ว) และจำกัดการเข้าถึงตามหลัก PDPA
