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

app.get("/", (req, res) => {
  res.send('<a href="/google/callback">Authentication with Google</a>');
});



app.listen(port, () => {
  console.log(`Server running on port ${port} £$%£$%sdf`);
});


module.exports = app;
