// 1. โหลด Library
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

// 2. โหลดฟังก์ชันที่เราเขียนเองจาก sheetsHandler.js
const { getReadSheetData, appendWriteSheetData } = require('./sheetsHandler.js');

// 3. ตั้งค่า Server
const app = express();
const PORT = process.env.PORT || 3000;

// 4. ตั้งค่า Middleware
app.use(cors()); 
app.use(express.json()); 

app.use(express.static('public'));

// Endpoint สำหรับการ "อ่าน" ข้อมูล
app.get('/api/read-sheet', async (req, res) => {
    try {
        console.log('GET /api/read-sheet - กำลังดึงข้อมูล...');
        const data = await getReadSheetData();
        
        if (!data || data.length === 0) {
            console.error('GET /api/read-sheet - ไม่พบข้อมูล');
            return res.status(404).json({ success: false, error: 'ไม่พบข้อมูล' });
        }
        
        console.log(`GET /api/read-sheet - ส่งข้อมูล ${data.length} แถว`);
        res.json(data); // ส่งข้อมูลกลับไปเป็น JSON

    } catch (error) {
        console.error('GET /api/read-sheet - Server Error:', error.message);
        res.status(500).json({ success: false, error: 'Server Error' });
    }
});

// Endpoint สำหรับการ "เขียน" (บันทึก) ข้อมูล
app.post('/api/append-sheet', async (req, res) => {
    try {
        const { data } = req.body; // ดึงข้อมูลที่หน้าเว็บส่งมา
        
        if (!data) {
            return res.status(400).json({ success: false, error: 'ไม่พบข้อมูลที่จะบันทึก' });
        }

        console.log('POST /api/append-sheet - กำลังบันทึก:', data);
        const result = await appendWriteSheetData(data);

        if (!result) {
            console.error('POST /api/append-sheet - บันทึกไม่สำเร็จ (ดู Error ด้านบน)');
            return res.status(500).json({ success: false, error: 'บันทึกไม่สำเร็จ' });
        }

        console.log('POST /api/append-sheet - บันทึกสำเร็จ!');
        res.json({ success: true, data: result });

    } catch (error) {
        console.error('POST /api/append-sheet - Server Error:', error.message);
        res.status(500).json({ success: false, error: 'Server Error' });
    }
});

// 7. สั่งให้ Server เริ่มทำงาน
app.listen(PORT, () => {
    console.log(`✅ Server is running on http://localhost:${PORT}`);
    console.log(`(ไฟล์หน้าเว็บของคุณอยู่ที่ http://localhost:${PORT}/index.html)`);
});