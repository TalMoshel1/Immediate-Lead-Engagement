const { DateTime } = require("luxon");

require("dotenv").config();

const { OpenAI } = require("openai");

const nodemailer = require("nodemailer");

const fs = require("fs");

const { tools } = require("../utils/tools/tools.js");
const openai = new OpenAI({
  apiKey: process.env.OPENAI_KEY,
});

/**
 * שולח הזמנה לפגישה עם קובץ .ics
 * @param {string} senderEmail - מייל המוען (טל)
 * @param {string} senderName - שם המוען
 * @param {string} recipientEmail - מייל הנמען
 * @param {string} subject - כותרת המייל
 * @param {string} description - תיאור הפגישה
 * @param {string} startDateTime - תאריך התחלה ב-ISO, לדוגמה "2025-09-07T14:00:00+03:00"
 * @param {string} endDateTime - תאריך סיום ב-ISO
 */


// async function sendMeetingInvite(
//   senderEmail,
//   senderName,
//   recipientEmail,
//   subject,
//   description,
//   startDateTime,
//   endDateTime
// ) {
//   // המרה לפורמט iCalendar
//   const icsContent = `
// BEGIN:VCALENDAR
// VERSION:2.0
// PRODID:-//MyCompany//NONSGML v1.0//EN
// METHOD:REQUEST
// BEGIN:VEVENT
// UID:${Date.now()}@example.com
// DTSTAMP:${formatDateToICS(new Date())}
// DTSTART:${formatDateToICS(new Date(startDateTime))}
// DTEND:${formatDateToICS(new Date(endDateTime))}
// SUMMARY:${subject}
// DESCRIPTION:${description}
// ORGANIZER;CN=${senderName}:MAILTO:${senderEmail}
// ATTENDEE;CN=${recipientEmail};RSVP=TRUE:MAILTO:${recipientEmail}
// END:VEVENT
// END:VCALENDAR
// `;

//   // יצירת transporter ב-Nodemailer
//   const transporter = nodemailer.createTransport({
//     service: "gmail",
//     auth: {
//       user: senderEmail,
//       pass: process.env.Tal_Moshel_App_Password,
//     },
//   });

//   const mailOptions = {
//     from: `"${senderName}" <${senderEmail}>`,
//     to: [recipientEmail, senderEmail],
//     subject: subject,
//     text: description,
//     attachments: [
//       {
//         filename: "invite.ics",
//         content: icsContent,
//         contentType: "text/calendar; charset=UTF-8; method=REQUEST",
//       },
//     ],
//   };

//   try {
//     const info = await transporter.sendMail(mailOptions);
//     console.log("מייל נשלח בהצלחה:", info.messageId);
//   } catch (err) {
//     console.error("שגיאה בשליחת המייל:", err);
//   }
// }

async function sendMeetingInvite(
  senderEmail,
  senderName,
  recipientEmail,
  subject,
  description,
  startDateTime,
  endDateTime
) {
  console.log('ics content: ',   senderEmail,
  senderName,
  recipientEmail,
  subject,
  description,
  startDateTime,
  endDateTime)
  // המרה לפורמט iCalendar
  const icsContent = `
BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//MyCompany//NONSGML v1.0//EN
METHOD:REQUEST
BEGIN:VEVENT
UID:${Date.now()}@example.com
DTSTAMP:${formatDateToICS(new Date())}
DTSTART:${formatDateToICS(new Date(startDateTime))}
DTEND:${formatDateToICS(new Date(endDateTime))}
SUMMARY:${subject}
DESCRIPTION:${description}
ORGANIZER;CN=${senderName}:MAILTO:${senderEmail}
ATTENDEE;CN=${recipientEmail};RSVP=TRUE:MAILTO:${recipientEmail}
END:VEVENT
END:VCALENDAR
`;

  // יצירת transporter ב-Nodemailer
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: senderEmail,
      pass: process.env.Tal_Moshel_App_Password,
    },
  });

  const mailOptions = {
    from: `"${senderName}" <${senderEmail}>`,
    to: [recipientEmail, senderEmail],
    subject: subject,
    text: description,
    icalEvent: {
      filename: "invite.ics",
      method: "request",
      content: icsContent,
    },
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("מייל נשלח בהצלחה:", info.messageId);
  } catch (err) {
    console.error("שגיאה בשליחת המייל:", err);
  }
}

function formatDateToICS(date) {
  const dt = DateTime.fromJSDate(date, { zone: "Asia/Jerusalem" });
  return dt.toFormat("yyyyLLdd'T'HHmmss");
}

// -------------------------------------------------------------------------------------------------------------------------------------

/**
 * הפונקציה החדשה המשלבת את המודל של OpenAI.
 * היא מנתחת את פרומפט המשתמש, וממירה אותו לקריאה לפונקציית sendMeetingInvite.
 * @param {string} userPrompt - הפרומפט המלא מהמשתמש.
 */
async function callOpenAIWithMeetingInvite(fullMessages) {
  console.log("userPrompt: ", fullMessages);

  /* 

  הזמן הנוכחי בישראל הוא: 

  ${new Date().toLocaleString("he-IL", {
        timeZone: "Asia/Jerusalem",
      })}  
        */

  const messages = [
    {
      role: "system",
      content: `אתה יועץ וירטואלי המטפל בקביעת פגישות. תפקידך הוא לזהות בקשת קביעת פגישה, לברר את כתובת המייל של הלקוח, ולמצוא את התאריך והשעה המתאימים.




דוגמאות לפורמט המבוקש: '2025-09-09T14:00:00+03:00'. אם המשתמש מציין שעה ללא יום, השתמש בתאריך הנוכחי. אם מצוין יום בשבוע ('יום שלישי'), מצא את התאריך של יום שלישי הקרוב וצור את הפורמט המתאים. שים לב שאתה לא טועה בשעה וביום שהמשתמש ביקש`,
    },
    { role: "user", content: fullMessages },
  ];
  // console.log("??");
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo-1106",
      messages: messages,
      tools: tools,
      tool_choice: "auto",
    });
    // console.log("response: ", response);

    const responseMessage = response.choices[0].message;
    // console.log("responseMessage ", responseMessage);
    if (responseMessage.tool_calls) {
      const toolCall = responseMessage.tool_calls[0];
      console.log('toolCall: ', toolCall);

      /* 
      console.log('toolCall: ', toolCall):
      זה מה שיוצא:


      {
  id: 'call_Yhk2HyXsqBLkuU1Phcn7PCmo',
  type: 'function',
  function: {
    name: 'sendMeetingInvite',
    arguments: '{"recipientEmail":"talmoshel555@gmail.com","startDateTime":"2025-09-10T14:00:00+03:00","endDateTime":"2025-09-10T14:30:00+03:00"}'
  }
}
  */


      const functionName = toolCall.function.name;
      const functionArgs = JSON.parse(toolCall.function.arguments);

      if (functionName === "sendMeetingInvite") {
        const { recipientEmail, startDateTime, endDateTime } = functionArgs;
                const startDateTimeLocal = DateTime.fromISO(startDateTime);
const endDateTimeLocal = DateTime.fromISO(endDateTime);

        // console.log("functionArgs: ", functionArgs);

        // המרה לפורמט ISO 8601 עם קיזוז הזמן של ישראל
        // const isoStartDateTime = DateTime.fromISO(startDateTime, {
        //   zone: "Asia/Jerusalem",
        // }).toISO({ includeOffset: true });
        // const isoEndDateTime = DateTime.fromISO(endDateTime, {
        //   zone: "Asia/Jerusalem",
        // }).toISO({ includeOffset: true });



        console.log("startDateTimeLocal: ", startDateTimeLocal);
        console.log("endDateTimeLocal: ", endDateTimeLocal);

        await sendMeetingInvite(
          "talmosheldevweb@gmail.com",
          "טל מושל",
          recipientEmail,
          "פגישת ייעוץ עם טל מושל",
          "פגישת ייעוץ קצרה וחינמית בנושא בניית אתרים.",
          startDateTimeLocal,
          endDateTimeLocal
        );

        return `✅ הזימון נשלח בהצלחה למייל ${recipientEmail}.`;
      }
    } else {
      console.log(
        "no responseMessage.tool_calls: ",
        responseMessage.tool_calls
      );

      // console.log("תשובת OpenAI:", responseMessage.content);
      return responseMessage.content;
    }
  } catch (error) {
    console.error("שגיאה בתקשורת עם OpenAI:", error);
    return "אירעה שגיאה. נסה שוב מאוחר יותר.";
  }
}

module.exports = { sendMeetingInvite, callOpenAIWithMeetingInvite };
