// 1. โหลด Library
require('dotenv').config(); // สำหรับ .env
const { GoogleAuth } = require('google-auth-library');
const { google } = require('googleapis');
const fs = require('fs'); // เพิ่ม fs (File System)

// 2. (สำคัญ) ดึงค่ามาจาก .env หรือ Hardcode
// Vercel จะดึงจาก Environment Variables ที่เราตั้งค่าไว้
const READ_SPREADSHEET_ID = process.env.READ_SPREADSHEET_ID || "156Pq9FjUuG0EdsvoET-YmWGAHE-vBVkNtv2MC00QbCM";
const WRITE_SPREADSHEET_ID = process.env.WRITE_SPREADSHEET_ID || "1YtvxoP8wcDVqZH1YcPBtYolELTW2jFQDzD8yyHCx5cU";

// 3. (สำคัญ) ตั้งค่าการเชื่อมต่อ Google Auth (แบบที่ใช้ได้ทั้ง Local และ Vercel)
let auth;
const SCOPES = 'https://www.googleapis.com/auth/spreadsheets';

try {
  // 3.1 ตรวจสอบว่าเราอยู่บน Vercel (มี GOOGLE_SERVICE_ACCOUNT_JSON) หรือไม่
  if (process.env.GOOGLE_SERVICE_ACCOUNT_JSON) {
    console.log('Using Vercel Environment Variable for Auth');
    const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);
    auth = new GoogleAuth({
      credentials: {
        client_email: credentials.client_email,
        private_key: credentials.private_key,
      },
      scopes: SCOPES,
    });
  } 
  // 3.2 ถ้าไม่ ให้ใช้ keyFile (สำหรับรันบนเครื่อง Local)
  else if (fs.existsSync('service-account-key.json')) {
    console.log('Using local service-account-key.json for Auth');
    auth = new GoogleAuth({
      keyFile: 'service-account-key.json',
      scopes: SCOPES,
    });
  } else {
    throw new Error('No Google credentials found. Missing service-account-key.json or GOOGLE_SERVICE_ACCOUNT_JSON env var.');
  }

} catch (error) {
  console.error("ERROR initializing Google Auth:", error.message);
}

// ---------------------------------
// A. Function to fetch data (READ) 
// ---------------------------------
async function getReadSheetData() {
  if (!auth) {
    console.error("Auth is not initialized.");
    return null;
  }
  try {
    console.log('Attempting to read from spreadsheet:', READ_SPREADSHEET_ID);
    
    // (ใช้ auth ที่เราสร้างไว้ ไม่ใช่ API_KEY)
    const client = await auth.getClient();
    const sheets = google.sheets({ version: 'v4', auth: client }); 

    const sheetNames = ['อาจารย์ภายใน (21Oct2025)']; // จากโค้ดใหม่ของคุณ
    
    for (const sheetName of sheetNames) {
      try {
        console.log(`Trying sheet name: ${sheetName}`);
        
        const response = await sheets.spreadsheets.values.get({
          auth, // (ใช้ auth ที่เราสร้างไว้)
          spreadsheetId: READ_SPREADSHEET_ID,
          range: `${sheetName}!A:Z`,
        });
        
        const rows = response.data.values;
        
        if (!rows || rows.length === 0) {
          console.log(`No data in ${sheetName}`);
          continue;
        }
        
        console.log(`Found data in ${sheetName}! ${rows.length} rows`);
        
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
        return dataObjects; // คืนค่าข้อมูลที่อ่านได้
        
      } catch (error) {
        console.log(`Failed with ${sheetName}: ${error.message}`);
        continue;
      }
    }
    
    console.error('Could not read from any sheet name');
    return [];

  } catch (error) {
    console.error('Error fetching read sheet data:', error.message);
    return [];
  }
}

// -----------------------------------
// B. Function to append data (WRITE) 
// -----------------------------------
async function appendWriteSheetData(dataToAppend) {
  if (!auth) {
    console.error("Auth is not initialized.");
    return null;
  }
  try {
    console.log('Attempting to write to spreadsheet:', WRITE_SPREADSHEET_ID);
    console.log('Data to append:', dataToAppend);
        
    // (ใช้ auth ที่เราสร้างไว้)
    const client = await auth.getClient();
    const sheets = google.sheets({ version: 'v4', auth: client });
    
    const values = [dataToAppend];
    const sheetNames = ['1']; // จากโค้ดใหม่ของคุณ
    
    for (const sheetName of sheetNames) {
      try {
        console.log(`Trying to write to: ${sheetName}`);
        
        const response = await sheets.spreadsheets.values.append({
          auth, // (ใช้ auth ที่เราสร้างไว้)
          spreadsheetId: WRITE_SPREADSHEET_ID,
          range: `${sheetName}!A:Z`,
          valueInputOption: 'USER_ENTERED',
          resource: { values },
        });

        console.log(`Write successful to ${sheetName}!`);
        return response.data; // คืนค่าเมื่อเขียนสำเร็จ
        
      } catch (error) {
        console.log(`Failed writing to ${sheetName}: ${error.message}`);
        console.error('Google API Error:', error.response ? JSON.stringify(error.response.data, null, 2) : error.message);
        continue;
      }
    }
    
    console.error('Could not write to any sheet');
    return null;
      
  } catch (error) {
    console.error('Error in appendWriteSheetData function:', error.message);
    return null;
  }
}

// 6. Export ฟังก์ชันเพื่อให้ server.js เรียกใช้ได้
module.exports = { 
  getReadSheetData, 
  appendWriteSheetData 
}