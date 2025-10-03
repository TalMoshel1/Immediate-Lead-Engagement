require("dotenv").config();
const cors = require("cors");
const express = require("express");
const bodyParser = require("body-parser");
const app = express();
const port = process.env.PORT || 3001;
const { postMessage, getNotification } = require("./greenApi.js");
const {
  processIncomingMessage,
  determineNextMessageContent,
  sendGreenAPIMessage,
} = require("./server-greenApi-interactions/index");
const whatsAppClient = require("@green-api/whatsapp-api-client");
const {
  extractNumberPortion,
  formatIsraeliPhoneNumber,
} = require("./functions/phoneNumbers.js");
const { getNumberFromGreenApiFormat } = require("./functions/phoneNumbers.js");
const { findUserByPhone, createUser } = require("./services/mongoDB.js");
const { SubmitDetailsController } = require("./controllers/mongoDB.js");
const { webhookController } = require("./controllers/webhook.js");
const { runDB } = require("./mongoDB-config.js");
const nodemailer = require("nodemailer");
const passport = require("passport");
const {callOpenAIWithMeetingInvite} = require('./services/sendEmail.js')
const { Strategy: GoogleStrategy } = require("passport-google-oauth2");
require("dotenv").config();

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;

// console.log('callOpenAIWithMeetingInvite: ', callOpenAIWithMeetingInvite)
(async () => {
  await callOpenAIWithMeetingInvite(
    // זה הפורמט שצריך להעביר לchat מ 
  JSON.stringify([
    { role: "user", content: { type: "text", text: "היי אשמח שתחזור אליי בנושא תיקון אתר" }, timestamp: "2025-09-08T16:15:09.373+00:00" },
    { role: "system", content: { type: "text", text: "שלום, אני כאן כדי לעזור, מה האימייל שלך?" }, timestamp: "2025-09-08T16:16:09.373+00:00" },
    { role: "user", content: { type: "text", text: "talmoshel555@gmail.com" }, timestamp: "2025-09-08T16:17:09.373+00:00" },
    { role: "system", content: { type: "text", text: "אוקיי, ומתי תרצה לקבוע פגישה?" }, timestamp: "2025-09-08T16:18:09.373+00:00" },
    { role: "user", content: { type: "text", text: "עוד יומיים בארבע אחר הצהריים" }, timestamp: "2025-09-08T16:19:09.373+00:00" }
  ])

 );
})();

const chatHistories = {};

// const extractPhone = extractNumberPortion('972528155507@c.us')

// console.log('extracted phone: ', extractPhone);

const restAPI = whatsAppClient.restAPI({
  idInstance: process.env.idInstance,
  apiTokenInstance: process.env.apiTokenInstance,
});

const corsOptions = {
  origin: [
    "http://localhost:3000",
    "https://9dd67cf0c1f8.ngrok-free.app",
    "https://my-web-service-site.onrender.com/",
    "https://www.talmoshel.co.il",
    "https://talmoshelasaservice2.runmydocker-app.com",
  ],
  methods: "GET,POST",
  credentials: true,
  optionsSuccessStatus: 204,
};

app.use(cors(corsOptions));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// להעיף את השורה למטה מהערה כדי שזה יעבוד
// webhookController(restAPI, app)

/* ************************************* thats working, don't touch this !!!!! **********************************************/
// (async () => {
//   try {

//      await restAPI.settings.setSettings({
//           webhookUrl: 'https://77a8-2a00-a041-e050-a600-b4aa-43bb-d719-ca62.ngrok-free.app/webhooks',
//           incomingWebhook: "yes",
//           stateWebhook: "yes"
//       });

//       const webHookAPI = whatsAppClient.webhookAPI(app, '/webhooks')

//       webHookAPI.onIncomingMessageText((data, idInstance, idMessage, sender, typeMessage, textMessage) => {
//         // console.log(`Incoming Notification data`)

//           console.log(`Incoming Notification data ${JSON.stringify(data)}`) /*this is working! dont touch it*/
//           console.log('data: ',data)

//           const senderName = data.senderData.senderName;

//            postMessage(data.senderData.chatId, `${data.messageData.textMessageData.textMessage} גם לך`)

//       });

//   } catch (error) {
//       console.error('error: ', error);
//       process.exit(1);
//   }
// })();

// app.post("/webhooks", async (req, res) => {
//   console.log('??')
//   // getNotification()
//     const greenApiPayload = req.body;
//     console.log("Received webhook payload:", JSON.stringify(greenApiPayload));
//     const senderChatId = greenApiPayload.senderData.chatId;
//     console.log('chat id: ',  senderChatId)
//     console.log("Received webhook payload:", JSON.stringify(greenApiPayload));

//     const processedMessage = processIncomingMessage(greenApiPayload);

//     if (processedMessage && processedMessage.chatId) {
//       if (!chatHistories[processedMessage.chatId]) {
//         chatHistories[processedMessage.chatId] = [];
//       }

//       if (processedMessage.text !== null) {
//         chatHistories[processedMessage.chatId].push({
//           direction: "in",
//           timestamp: new Date().toISOString(),
//           content: processedMessage.text,
//         });
//       }

//       const nextMessageContent = determineNextMessageContent(
//         chatHistories[processedMessage.chatId]
//       );

//       chatHistories[processedMessage.chatId].push({
//         direction: "out",
//         timestamp: new Date().toISOString(),
//         content: nextMessageContent,
//       });

//       console.log(
//         `\n[Simulated Send] Responding to ${processedMessage.chatId} with: "${nextMessageContent}"`
//       );

//       res.status(200).send("Message processed");
//     } else {
//       res.status(200).send("Ignored payload (invalid/non-incoming)"); // <-- CHANGE THIS LINE
//     }
//   });

// function isLoggedIn(req, res, next) {
//   req.res ? next() : res.sendStatus(401);
// }

app.get("/", (req, res) => {
  res.send('<a href="/google/callback">Authentication with Google</a>');
});

// app.get("protected", isLoggedIn, (req, res) => {
//   res.send("hello");
// });

// app.get(
//   "/auth/google",
//   passport.authenticate("google", { scope: ["email", "profile"] })
// );

// app.get(
//   "/google/callback",
//   passport.authenticate("google", {
//     successRedirect: "/protected",
//     failureRedirect: "/auth/failure",
//   })
// );

// app.get("/auth/failure", (req, res) => {
//   res.send("something went wrong");
// });

// (async () => {
//     const restAPI = whatsAppClient.restAPI(({
//         idInstance: process.env.idInstance,
//         apiTokenInstance: process.env.apiTokenInstance
//     }))
//     try {
//         await restAPI.webhookService.startReceivingNotifications()
//         restAPI.webhookService.onReceivingMessageText((body) => {
//             console.log('onReceivingMessageText', body)
//             restAPI.webhookService.stopReceivingNotifications();
//             console.log("Notifications is about to stop in 5 sec if no messages will be queued...")
//         })
//         restAPI.webhookService.onReceivingDeviceStatus((body) => {
//             console.log('onReceivingDeviceStatus', body)
//         })
//         restAPI.webhookService.onReceivingAccountStatus((body) => {
//             console.log('onReceivingAccountStatus', body)
//         })
//     } catch (ex) {
//         console.error(ex);
//     }
// })();

// app.post("/submit-details", SubmitDetailsController);

// app.post('/send-mail', async (req, res) => { // הפונקציה צריכה להיות אסינכרונית כדי להשתמש ב-await
//     const userDetails = req.body;
//     console.log('??')
//     console.log('proccess.env.EMAIL_PASSWORD: ', process.env.EMAIL_PASSWORD)
//     console.log('userDetails', userDetails)

//     if (!userDetails || Object.keys(userDetails).length === 0) {
//         return res.status(400).json({ error: 'No user details provided' });
//     }

//     try {
//         // שלב 1: יצירת אובייקט "טרנספורטר" (Transporter)
//         // טרנספורטר הוא האובייקט שמכיל את פרטי השרת SMTP (כמו שם משתמש וסיסמה).
//         // חשוב מאוד: אל תשמור סיסמאות בקוד! השתמש במשתני סביבה (process.env).
//         // הדוגמה הזו היא לשימוש עם Gmail, אך ניתן להתאים אותה לספקי מייל אחרים.
//         const transporter = nodemailer.createTransport({
//             service: 'gmail',
//             auth: {
//                 // החלף את הפרטים הבאים עם שם המשתמש והסיסמה של חשבון המייל שלך.
//                 // אם אתה משתמש ב-Gmail, תצטרך ליצור "סיסמת יישום" (App Password)
//                 // ולא להשתמש בסיסמה הרגילה של החשבון.
//                 user: 'talmosheldevweb@gmail.com',
//                 pass: process.env.Tal_Moshel_App_Password
//             }
//         });

//         // שלב 2: בניית תוכן האימייל
//         // יצירת מחרוזת מפורמטת המכילה את פרטי המשתמש שהתקבלו בבקשה.
//         const emailBody = `
//             <h1>פרטי משתמש חדשים:</h1>
//             <p><strong>שם:</strong> ${userDetails.name || 'לא צוין'} <strong>טלפון:</strong> ${userDetails.phone || 'לא צוין'}</p>

//         `;

//         // שלב 3: הגדרת אפשרויות המייל
//         const mailOptions = {
//             from: 'talmoshel444@gmail.com', // כתובת המייל השולחת
//             to: 'talmoshel444@gmail.com',   // כתובת המייל המקבלת (לשם יישלחו הפרטים)
//             subject: 'מתעניין חדש באתר',
//             html: emailBody
//         };

//         // שלב 4: שליחת המייל
//         await transporter.sendMail(mailOptions);

//         // אם השליחה הצליחה, נחזיר תגובה חיובית
//         res.status(200).json({
//             message: 'Email sent successfully!',
//             data: userDetails
//         });

//     } catch (error) {
//         // אם התרחשה שגיאה במהלך השליחה, נדפיס אותה וניידע את המשתמש
//         console.error('Error sending email:', error);
//         res.status(500).json({
//             message: 'Failed to send email.',
//             error: error.message
//         });
//     }
// });

// app.post("/test-post", (req, res) => {
//   console.log("Received POST to /test-post");
//   res.status(200).send("Test POST successful!");
// });

app.listen(port, () => {
  console.log(`Server running on port ${port} £$%£$%sdf`);
});

// app.use(userDetailsRoute);

// app.get('/protected', (req, res) => {
//   res.send('hello');
// });

module.exports = app;
