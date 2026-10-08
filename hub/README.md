# Evolution Hub Commerce

ระบบหลังบ้านทีมขาย Office สำหรับ 3 ฝ่าย : **ผู้บริหาร** (คุณอัท, คุณโม), **Telesales** (พี่เขม, พี่หวาน), **Admin Sales** (ไลลา, แอดมิน 2)

## ฟีเจอร์
| ฝ่าย | สิ่งที่ทำได้ |
|---|---|
| ผู้บริหาร / Teamlead | Dashboard ภาพรวม : ยอดขายแยก Telesales / Admin FB / E-Commerce, KPI รายคน (ครบ/ไม่ครบ), กราฟรายวัน, สินค้าขายดี, Funnel, ช่วงเวลาขาย, งานค้าง · อนุมัติ/ย้ายรายชื่อ · ตั้งเป้า KPI · จัดการทีม/สินค้า/ประกาศ · ดูทุกหน้าของ Telesales และ Admin |
| Telesales | รายชื่อแยก **FB Page (Pancake)** และ **E-Commerce** · Ticket ลูกค้า (ชื่อ เบอร์ ที่อยู่ ประวัติสั่งซื้อล่าสุด→เก่าสุด โน้ต) · บันทึกการโทรในคลิกเดียว (นับ KPI + สร้างออเดอร์ + นัดถัดไป) · ปฏิทินนัด · **บันทึก KPI แบบ Manual** (ทีละสาย: เบอร์, ชม./นาที/วินาที, สินค้า, ยอด หรือสรุปทั้งวัน) |
| Admin Sales | บันทึกปิดการขาย → ระบบแจกรายชื่อให้ Telesales **50:50** (ลูกค้าเก่ากลับไปหาเซลล์เดิม) → เข้าคิวอนุมัติ (หรือส่งอัตโนมัติ) |

KPI ใช้ตามเอกสาร KPI ทีม : FB 30 สาย/วัน (T1 5 · T2 5 · T3 20), Marketplace 30 สาย/วัน, เวลาคุย, ยอดขาย · อัตราติดต่อได้, Conversion, AOV, ยอดต่อสายที่คุย, นัดเลยกำหนด · กฎเลยกำหนด FB 2 วัน / Marketplace 5 วัน

## การเชื่อมต่อ
- **Pancake POS** : ดึงออเดอร์ที่ปิดแล้วทุก 3 นาที (`PANCAKE_API_KEY`, `PANCAKE_SHOP_ID`) → เข้าคิวแจก 50:50 อัตโนมัติ · ย้อนหลังได้จากหน้าตั้งค่า
- **BigSeller** (Lazada/Shopee/TikTok) : อัปโหลด Excel/CSV ในหน้าตั้งค่า หรือสคริปต์เดิมส่ง `POST /api/bigseller/ingest` (header `x-ingest-key`)
- **OneCall** : ดึงสายทุก 10 นาที (`ONECALL_USER`, `ONECALL_PASS`) หรือ `POST /api/onecall/ingest` · ใช้ตรวจเทียบกับ KPI ที่กรอกเอง
- **ระบบเดิม evo-split-online** : ตั้ง `LEGACY_DATABASE_URL` = DATABASE_URL ของระบบเดิม → ย้ายลูกค้า ออเดอร์ ประวัติ นัด และสาย OneCall ให้อัตโนมัติตอนเปิดครั้งแรก (หรือกดปุ่ม "นำเข้า")
- `POST /api/ingest/close` : ให้เครื่องมืออื่นส่งการปิดการขายเข้ามาได้

## Deploy บน Railway
1. Push โฟลเดอร์นี้ขึ้น GitHub → Railway : **New Project → Deploy from GitHub repo** (หรือเพิ่มเป็น Service ใหม่ในโปรเจกต์เดิม)
2. เพิ่ม **PostgreSQL** (Railway ตั้ง `DATABASE_URL` ให้เอง)
3. ตั้ง Variables :

| ตัวแปร | ค่า |
|---|---|
| `SESSION_SECRET` | ข้อความสุ่มยาว ๆ |
| `PASS_AT`, `PASS_MO`, `PASS_KHEM`, `PASS_WAN`, `PASS_LAILA`, `PASS_ADMIN2` | รหัสผ่านของแต่ละคน (หรือ `DEFAULT_PASS` ค่าเดียวทุกคน) |
| `PANCAKE_API_KEY`, `PANCAKE_SHOP_ID` | คัดลอกจากโปรเจกต์ evo-split-online (shop 1328953496) |
| `ONECALL_USER`, `ONECALL_PASS` | คัดลอกจากโปรเจกต์เดิม |
| `INGEST_KEY` | คีย์เดียวกับสคริปต์ BigSeller/OneCall เดิม |
| `LEGACY_DATABASE_URL` | `${{Postgres.DATABASE_URL}}` ของระบบเดิม (ใส่เพื่อย้ายข้อมูล) |

4. เปิด URL → เลือกชื่อ → ใส่รหัสผ่าน

ไม่ได้ตั้งรหัส : ระบบสร้างรหัสชั่วคราวและพิมพ์ไว้ใน Deploy Logs

## รันในเครื่อง
```bash
npm install
npm run demo        # ข้อมูลตัวอย่าง รหัสผ่านทุกคน 1234 → http://localhost:3000
npm run build:demo  # สร้าง dist/evolution-hub-commerce.html (เดโมไฟล์เดียว)
```

## โครงสร้าง
- `public/core.js` — กฎธุรกิจทั้งหมด (แจก 50:50, KPI, Dashboard) ใช้ร่วมกันทั้ง server และหน้าเว็บ
- `server.js` — API + login + ตัวตั้งเวลาดึงข้อมูล · `integrations.js` — Pancake / OneCall / ระบบเดิม · `store.js` — Postgres หรือไฟล์ JSON + สำรองรายวัน 30 วัน
- `public/app.js`, `app.css`, `index.html` — หน้าเว็บ (ไม่ต้อง build)
