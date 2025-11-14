var getBathText = function (inputNumber) {
 var getText = function (input) {
  var toNumber = input.toString();
  var numbers = toNumber.split('').reverse();
  var numberText = "/หนึ่ง/สอง/สาม/สี่/ห้า/หก/เจ็ด/แปด/เก้า/สิบ".split('/');
  var unitText = "/สิบ/ร้อย/พัน/หมื่น/แสน/ล้าน".split('/');
  var output = "";
  for (var i = 0; i < numbers.length; i++) {
   var number = parseInt(numbers[i]);
   var text = numberText[number];
   var unit = unitText[i];

   if (number == 0) continue;
   
   if (i == 1 && number == 2) {
    output = "ยี่สิบ" + output;
    continue;
   }
   if (i == 1 && number == 1) {
    output = "สิบ" + output;
    continue;
   }
   // จัดการ "หนึ่ง"
   if (i > 0 && number == 1 && i != 6) {
    if (i == 0 && numbers.length > 1 && numbers[i+1] > 0) {
     // กรณี 11, 21, ... ให้เป็น "เอ็ด"
     output = "เอ็ด" + output; 
    } else {
     output = text + unit + output;
    }
   } else if (i == 0 && number == 1 && numbers.length > 1 && numbers[i+1] > 0) {
    // กรณี 11, 21, ... ให้เป็น "เอ็ด"
    output = "เอ็ด" + output;
   } else {
    output = text + unit + output;
   }
  }
  // จัดการ "เอ็ด" ที่หลักล้าน
  output = output.replace("หนึ่งล้าน", "ล้าน");
  // จัดการ "หนึ่ง" ที่หลักสิบ
  if (output.startsWith("หนึ่งสิบ")) {
   output = "สิบ" + output.substring(7); // "หนึ่งสิบ" -> "สิบ"
  }

  return output;
 }

 var fullNumber = Math.floor(inputNumber);
 var decimal = inputNumber - fullNumber;
 
 // แปลงทศนิยมเป็นเลขจำนวนเต็ม (สตางค์)
 var decimalText = "";
 if (decimal > 0) {
  // คูณ 100 และปัดเศษทศนิยม
  decimal = Math.round(decimal * 100);
  if(decimal > 0) {
   decimalText = getText(decimal) + "สตางค์";
  }
 }

 var fullNumberText = getText(fullNumber);
 
 if (fullNumberText === "" && decimalText === "") {
  return "ศูนย์บาทถ้วน";
 }
 
 if (fullNumberText === "") {
  return decimalText;
 }

 if (decimalText === "") {
  return fullNumberText + "บาทถ้วน";
 } else {
  return fullNumberText + "บาท" + decimalText;
 }
};

/* * ▼▼▼ บรรทัดนี้คือส่วนที่สำคัญที่สุด ▼▼▼
* เราสั่งให้ฟังก์ชัน "getBathText" ของเรา
* ไปรับหน้าที่แทน "window.BAHTTEXT" ตัวเก่า
*/
window.BAHTTEXT = getBathText;