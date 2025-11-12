// sheetsHandler.js (แก้ไขแล้ว)

require('dotenv').config();

const { google } = require('googleapis');
// ▼▼▼ เพิ่มบรรทัดนี้ ▼▼▼
const { GoogleAuth } = require('google-auth-library');

// 2. ดึงค่ามาจาก process.env
const READ_SPREADSHEET_ID = "156Pq9FjUuG0EdsvoET-YmWGAHE-vBVkNtv2MC00QbCM";
const WRITE_SPREADSHEET_ID = "1YtvxoP8wcDVqZH1YcPBtYolELTW2jFQDzD8yyHCx5cU";
const API_KEY = process.env.API_KEY;

// (แนะนำ) 3. ตรวจสอบว่าโหลดค่ามาครบหรือไม่
if (!READ_SPREADSHEET_ID || !WRITE_SPREADSHEET_ID || !API_KEY) {
    console.error('❌ Error: Missing environment variables (API_KEY, READ_SPREADSHEET_ID, or WRITE_SPREADSHEET_ID).');
    console.error('โปรดตรวจสอบไฟล์ .env ของคุณว่ากำหนดค่าครบถ้วนหรือไม่');
}

// ----------------------------------------------------
// A. Function to fetch data (READ) - (ส่วนนี้เหมือนเดิมทุกอย่าง)
// ----------------------------------------------------
async function getReadSheetData() {
    try {
       console.log('Attempting to read from spreadsheet:', READ_SPREADSHEET_ID);
           const sheets = google.sheets({ 
          version: 'v4', 
          auth: API_KEY // ใช้อ่านได้ (ถ้าชีตเป็น Public)
       });

       const sheetNames = ['อาจารย์ภายใน (21Oct2025)'];
       
       for (const sheetName of sheetNames) {
          try {
          console.log(`Trying sheet name: ${sheetName}`);
          
          const response = await sheets.spreadsheets.values.get({
            spreadsheetId: READ_SPREADSHEET_ID,
            range: `${sheetName}!A:Z`,
          });
          
          const rows = response.data.values;
          
          if (!rows || rows.length === 0) {
            console.log(`No data in ${sheetName}`);
            continue;
          }
          
          console.log(`✅ Found data in ${sheetName}! ${rows.length} rows`);
          
          const [headers, ...dataRows] = rows;
          
          console.log('Headers:', headers);
          
          const dataObjects = dataRows.map((row, index) => {
            const item = { id: index + 2 };
            headers.forEach((header, i) => {
             item[header] = row[i] || '';
            });
            return item;
          });
          
          console.log('Sample data:', JSON.stringify(dataObjects[0], null, 2));
          
          return dataObjects;
          
          } catch (error) {
          console.log(`Failed with ${sheetName}: ${error.message}`);
          continue;
          }
       }
       
       console.error('❌ Could not read from any sheet name');
       return [];

    } catch (error) {
       console.error('Error fetching read sheet data:');
       console.error('Error message:', error.message);
       console.error('Error code:', error.code);
       return [];
    }
}

// ----------------------------------------------------
// B. Function to append data (WRITE) - (▼▼▼ แก้ไขส่วนนี้ ▼▼▼)
// ----------------------------------------------------
async function appendWriteSheetData(dataToAppend) {
    try {
       console.log('Attempting to write to spreadsheet:', WRITE_SPREADSHEET_ID);
       console.log('Data to append:', dataToAppend);
           // 1. สร้าง Auth Client โดยใช้ Service Account (ไฟล์ JSON)
       const auth = new GoogleAuth({
          keyFile: 'service-account-key.json', // ชื่อไฟล์ JSON ที่คุณดาวน์โหลดมา
          scopes: ['https://www.googleapis.com/auth/spreadsheets'], // ขอบเขตสิทธิ์ที่ขอ
       });

       // 2. สร้าง Sheets client โดยใช้ Auth ที่เราเพิ่งสร้าง
       const sheets = google.sheets({ 
          version: 'v4', 
          auth: auth // ◀◀◀ เปลี่ยนจาก API_KEY เป็น auth object
       });
       
       const values = [dataToAppend];
       
       // ลองหลายชื่อ Sheet (แก้เป็น array)
       const sheetNames = ['1']; // ชื่อชีตที่จะเขียน
       
       for (const sheetName of sheetNames) {
          try {
          console.log(`Trying to write to: ${sheetName}`);
          
          const response = await sheets.spreadsheets.values.append({
            spreadsheetId: WRITE_SPREADSHEET_ID,
            range: `${sheetName}!A:Z`,
            valueInputOption: 'USER_ENTERED',
            resource: { values },
          });

          console.log(`✅ Write successful to ${sheetName}!`);
          console.log('Updated range:', response.data.updates.updatedRange);
          return response.data;
          
          } catch (error) {
          console.log(`Failed writing to ${sheetName}: ${error.message}`);
          // แสดง Error ที่มาจาก Google API ให้ชัดเจน (ซึ่งก็คือ Error 403 ที่คุณเจอ)
          console.error('Google API Error:', error.response ? JSON.stringify(error.response.data, null, 2) : error.message);
          continue;
          }
       }
       
       console.error('❌ Could not write to any sheet');
       return null;
       
    } catch (error) {
       console.error('Error in appendWriteSheetData function:', error.message);
       return null;
    }
}

module.exports = { getReadSheetData, appendWriteSheetData }