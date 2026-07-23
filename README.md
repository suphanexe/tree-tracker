# 🌳 Smart Tree Tracker

ระบบติดตามดูแลต้นไม้อัจฉริยะ — สแกน QR Code เพื่อรายงานสถานะต้นไม้แบบเรียลไทม์

## ✨ ฟีเจอร์

| ฟีเจอร์ | รายละเอียด |
|---------|-----------|
| 📷 สแกน QR Code | ใช้กล้องมือถือสแกน QR Code ที่ติดกับต้นไม้ |
| 📝 รายงานสถานะ | บันทึกสถานะต้นไม้ (ปกติ, ต้องการน้ำ, เป็นโรค, ฯลฯ) |
| 🔧 บันทึกการกระทำ | รดน้ำ, ใส่ปุ๋ย, ฉีดยา, ตัดแต่ง, ตรวจสอบ |
| 📷 อัปโหลดรูป | ถ่ายรูปร่องรอยโรคประกอบรายงาน |
| 📊 Admin Dashboard | ดูสถิติและประวัติทั้งหมด |
| 🔍 ค้นหา/กรอง | ค้นหาตามรหัสต้นไม้, ผู้ดูแล, หรือบันทึก |
| 📥 ส่งออก CSV | ดึงข้อมูลไปใช้ใน Excel |
| 🌙 Responsive | ใช้งานได้ทั้งมือถือและคอมพิวเตอร์ |
| 💾 ทำงานออฟไลน์ | **ไม่ต้องใช้อินเทอร์เน็ต!** ข้อมูลเก็บในเครื่อง |

## 🚀 วิธีเริ่มใช้งาน

### ไม่ต้องตั้งค่าอะไรเลย! แค่เปิดไฟล์ `index.html`

```
1. เปิด index.html ในบราวเซอร์ (Chrome แนะนำ)
2. คลิก "เริ่มสแกน QR Code"
3. อนุญาตให้ใช้กล้อง
4. สแกน QR Code รูปแบบ TREE-001
5. กรอกข้อมูลแล้วกดบันทึก
```

### QR Code ที่ใช้ได้: `TREE-001`, `TREE-002`, `TREE-003`, ...

สร้าง QR Code ฟรีได้ที่: https://www.qr-code-generator.com/

## 📂 โครงสร้างไฟล์

```
smart-tree-tracker/
├── index.html           # หน้าสแกน QR Code (หน้าแรก)
├── admin.html           # Admin Dashboard
├── style.css            # สไตล์ส่วนกลาง
├── app.js               # ฟังก์ชันหลัก (สแกน + ฟอร์ม)
├── admin.js             # ฟังก์ชัน Dashboard
├── db.js                # ระบบฐานข้อมูล (localStorage)
├── firebase-config.js   # ตั้งค่า Firebase (ไม่จำเป็น)
└── README.md            # คู่มือนี้
```

## ☁️ ต้องการใช้ Firebase แทน localStorage?

ระบบใช้ **localStorage** เป็นค่าเริ่มต้น (ไม่ต้องตั้งค่า ไม่ต้องใช้อินเทอร์เน็ต)

ถ้าต้องการใช้ Firebase เพื่อแชร์ข้อมูลระหว่างเครื่อง:

1. ไปที่ [Firebase Console](https://console.firebase.google.com/)
2. สร้างโปรเจ็ค → เปิด Realtime Database
3. คัดลอก Config ไปวางใน `firebase-config.js`
4. เปลี่ยน `useFirebase: false` → `useFirebase: true` ใน `app.js`
5. **สำคัญ:** เพิ่ม Firebase SDK scripts ใน `index.html` และ `admin.html`:

```html
<script src="https://www.gstatic.com/firebasejs/8.10.1/firebase-app.js"></script>
<script src="https://www.gstatic.com/firebasejs/8.10.1/firebase-database.js"></script>
```

## ☁️ ต้องการอัปโหลดขึ้น GitHub Pages?

1. สร้าง Repo บน GitHub
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/smart-tree-tracker.git
git push -u origin main
```

2. Settings → Pages → Deploy from branch: `main`, folder: `/ (root)`

3. เว็บจะอยู่ที่: `https://YOUR_USERNAME.github.io/smart-tree-tracker/`

## 🎯 รูปแบบ QR Code

ค่าเริ่มต้น: `TREE-` + ตัวเลข (เช่น `TREE-001`)

แก้ไขได้ใน `app.js`:
```javascript
const CONFIG = {
    qrPrefix: 'TREE-',  // เปลี่ยนเป็นรหัสที่คุณต้องการ
    // ...
};
```

## 🔧 การปรับแต่ง

### สีและธีม
แก้ไข CSS variables ใน `style.css`:
```css
:root {
    --primary: #2D8A4E;    /* สีหลัก */
    --primary-dark: #1A5C34;
    --primary-light: #4CAF50;
}
```

### เพิ่มสถานะต้นไม้
1. แก้ไข `<select id="status">` ใน `index.html`
2. แก้ไข `getStatusText()` ใน `db.js`
3. เพิ่ม CSS class `.status-xxxxx` ใน `style.css`

## 📊 โครงสร้างข้อมูล

```json
{
    "id": "abc123...",
    "treeId": "TREE-001",
    "caretaker": "สมชาย",
    "status": "normal",
    "action": "watered",
    "notes": "รดน้ำเช้า",
    "photoUrl": "data:image/jpeg;base64,...",
    "timestamp": 1704067200000
}
```

## 💰 ต้นทุน

| โหมด | ราคา |
|------|------|
| localStorage (ค่าเริ่มต้น) | **ฟรี 100%** — ไม่ต้องใช้เน็ต |
| Firebase | ฟรี (1GB storage) |
| GitHub Pages | ฟรี |

## 📝 License

MIT License — ใช้งานได้อิสระ
