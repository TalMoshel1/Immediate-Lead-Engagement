const express = require('express');
const router = express.Router();// Create
const { postMessage } = require('../greenApi.js'); 
const {agendaEvery} = require('../agendaConfig.js')
const nodemailer = require('nodemailer');

require('dotenv').config();


router.post('/submit-details', (req, res) => {
    const userDetails = req.body;

    if (!userDetails || Object.keys(userDetails).length === 0) {
        return res.status(400).json({ error: 'No user details provided' });
    }

    // agendaEvery()
    const postMessageExecution = async () => {
        return await postMessage();
      };

      postMessageExecution()


    res.status(200).json({
        message: 'User details submitted successfully',
        data: userDetails
    });
});

router.post('/send-mail', async (req, res) => { // הפונקציה צריכה להיות אסינכרונית כדי להשתמש ב-await
    const userDetails = req.body;

    console.log('proccess.env.EMAIL_PASSWORD: ', proccess.env.EMAIL_PASSWORD)

    if (!userDetails || Object.keys(userDetails).length === 0) {
        return res.status(400).json({ error: 'No user details provided' });
    }

    try {
        // שלב 1: יצירת אובייקט "טרנספורטר" (Transporter)
        // טרנספורטר הוא האובייקט שמכיל את פרטי השרת SMTP (כמו שם משתמש וסיסמה).
        // חשוב מאוד: אל תשמור סיסמאות בקוד! השתמש במשתני סביבה (process.env).
        // הדוגמה הזו היא לשימוש עם Gmail, אך ניתן להתאים אותה לספקי מייל אחרים.
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                // החלף את הפרטים הבאים עם שם המשתמש והסיסמה של חשבון המייל שלך.
                // אם אתה משתמש ב-Gmail, תצטרך ליצור "סיסמת יישום" (App Password)
                // ולא להשתמש בסיסמה הרגילה של החשבון.
                user: 'talmosheldevweb@gmail.com', 
                pass: proccess.env.EMAIL_PASSWORD
            }
        });

        // שלב 2: בניית תוכן האימייל
        // יצירת מחרוזת מפורמטת המכילה את פרטי המשתמש שהתקבלו בבקשה.
        const emailBody = `
            <h1>פרטי משתמש חדשים:</h1>
            <p><strong>שם:</strong> ${userDetails || 'לא צוין'}</p>
 
        `;

        // שלב 3: הגדרת אפשרויות המייל
        const mailOptions = {
            from: 'talmoshel444@gmail.com', // כתובת המייל השולחת
            to: 'talmoshel444@gmail.com',   // כתובת המייל המקבלת (לשם יישלחו הפרטים)
            subject: 'מתעניין חדש באתר',
            html: emailBody
        };

        // שלב 4: שליחת המייל
        await transporter.sendMail(mailOptions);
        
        // אם השליחה הצליחה, נחזיר תגובה חיובית
        res.status(200).json({
            message: 'Email sent successfully!',
            data: userDetails
        });

    } catch (error) {
        // אם התרחשה שגיאה במהלך השליחה, נדפיס אותה וניידע את המשתמש
        console.error('Error sending email:', error);
        res.status(500).json({
            message: 'Failed to send email.',
            error: error.message
        });
    }
});



module.exports = router; 