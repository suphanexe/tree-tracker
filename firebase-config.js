/**
 * Smart Tree Tracker - Firebase Configuration
 * 
 * ไม่จำเป็นต้องตั้งค่าหากใช้ localStorage (ค่าเริ่มต้น)
 * ระบบจะทำงานได้ทันทีโดยไม่ต้องใช้ Firebase!
 * 
 * ต้องการใช้ Firebase? 
 * 1. ไปที่ https://console.firebase.google.com/ → สร้างโปรเจ็ค
 * 2. เปิด Realtime Database
 * 3. ไปที่ Project Settings → General → Your apps → Web app
 * 4. คัดลอกค่าด้านล่างมาแทนที่
 * 5. เปลี่ยน useFirebase = true ใน app.js
 */

const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
    databaseURL: "https://YOUR_PROJECT_ID-default-rtdb.firebaseio.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT_ID.appspot.com",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID"
};

// Uncomment to enable Firebase
// if (typeof firebase !== 'undefined') {
//     firebase.initializeApp(firebaseConfig);
//     console.log('🔥 Firebase initialized!');
// }
