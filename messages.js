// whatsappService.js

// 1. Require necessary modules first
const { GreenApiClient } = require('@green-api/whatsapp-api-client-js-v2');
const dotenv = require('dotenv');

// 2. Load environment variables as early as possible
dotenv.config();

// 3. Define constants from environment variables
const apiTokenInstance = process.env.apiTokenInstance;
const idInstance = process.env.idInstance;

// 4. Perform initial checks/validations
if (!idInstance || !apiTokenInstance) {
    console.error("Missing GreenAPI idInstance or apiTokenInstance in .env file.");
    throw new Error("GreenAPI credentials are not set in environment variables.");
}

// 5. Initialize the GreenAPI client
const client = new GreenApiClient({
    idInstance: idInstance,
    apiTokenInstance: apiTokenInstance
});

/**
 * פונקציה לשליחת הודעת וואטסאפ באמצעות GreenAPI.
 * @param {string} phoneNumber - מספר הטלפון אליו לשלוח (לדוגמה: '972501234567').
 * הפונקציה תמיר אותו לפורמט 'chatId' המתאים של GreenAPI.
 * @param {string} message - תוכן ההודעה לשליחה.
 * @returns {Promise<object>} אובייקט התגובה מ-GreenAPI.
 */
async function sendWhatsAppMessage(phoneNumber, message) {
    // פורמט מספרי טלפון לוואטסאפ: "972501234567@c.us"
    // ודא שמספר הטלפון מנוקה ומעוצב ללא קידומת 0 (לדוגמה, 0501234567 יהפוך ל-972501234567)
    const cleanedPhoneNumber = phoneNumber.replace(/^0/, ''); // מסיר 0 מוביל אם קיים
    const chatId = `972${cleanedPhoneNumber}@c.us`; // מוסיף קידומת מדינה 972

    try {
        console.log(`Attempting to send message to ${chatId}: "${message}"`);
        const response = await client.sendMessage({
            chatId: chatId,
            message: message
        });
        console.log('WhatsApp message sent successfully:', response);
        return response;
    } catch (error) {
        console.error('Error sending WhatsApp message:', error.message);
        throw error; // זרוק את השגיאה כדי שפונקציות קוראות יוכלו לטפל בה
    }
}


sendWhatsAppMessage('0522233573', 'hello hello')
// 6. Export the function using CommonJS syntax
module.exports = { sendWhatsAppMessage };

// 7. Example usage (commented out by default, uncomment for testing)
/*
(async () => {
    // נסה לשלוח הודעה לבדיקה (החלף במספר אמיתי שלך)
    // הערה: ודא שמספר הטלפון הוא בפורמט בינלאומי ללא סימן + בהתחלה (לדוגמה: 972501234567)
    // או רק המספר ללא 0 מוביל (לדוגמה: 501234567) והפונקציה תטפל בזה
    try {
        await sendWhatsAppMessage('0522233573', 'Hello from the WhatsApp service!'); // Use your actual test number
        console.log("GreenAPI service test message sent successfully.");
    } catch (error) {
        console.error("Failed to send initial test message:", error.message);
    }
})();
*/