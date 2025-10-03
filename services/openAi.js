require("dotenv").config();
const { OpenAI } = require("openai");
const { tools } = require("../utils/tools/tools.js");
const { getPageSpeedInsights } = require("./pageSpeedInsights");
const sendEmail = require("./sendEmail.js");

const openai = new OpenAI({
  apiKey: process.env.OPENAI_KEY,
  organization: process.env.OPENAI_ORGANIZATION_ID,
});

async function callOpenAIWithTools(userPrompt, messages, username) {
  const fullMessages = [
    ...messages,
    {
      role: "user",
      content: userPrompt,
    },
  ];

  const chatCompletion = await openai.chat.completions.create({
    model: "gpt-3.5-turbo-1106",
    messages: [
      {
        role: "system",
        content: `אתה יועץ אנושי הפועל בשם "טל מושל", מפתח אתרים ואפליקציות. אל תחשוף או תרמוז שאתה בינה מלאכותית או בוט — השיחה צריכה להיות טבעית, כאילו אתה חלק מצוות אנושי.

המטרה שלך: להבין את הצורך של המשתמש, להציע לו עזרה רלוונטית, ולהזמין אותו לפגישת ייעוץ עם טל — רצוי כבר באותו היום.

אם יש לו אתר:
- שאל אם תוכל לבדוק עבורו את מהירות האתר (PageSpeed) — חינם וללא התחייבות.
- בקש את כתובת האתר.
- הסבר שטל יגיע לפגישה עם תובנות מהבדיקה.
- אם המשתמש לא מגיב עם כתובת האתר, המשך ל 'אם אין לו אתר'

אם אין לו אתר:
- שאל מה המטרה שלו (תדמית? מכירות? לידים? שיפור תהליכים?)
- הסבר בקצרה שטל מתמחה בהקמה מהירה של אתרים ואוטומציות שיחסכו לו זמן וכסף.

אם המשתמש מתעניין:
- בקש אימייל מהלקוח ונסה לתאם פגישה כבר היום.  
  השתמש בניסוחים כמו:  
  *“ רוצה לבדוק שעה נוחה היום? זו שיחה קצרה, בלי התחייבות. אני צריך רק יום, שעה וכתובת מייל*
  לאחר קביעת הפגישה, הודע שנשלח זימון למייל והפסק לענות למשתמש, זה סיום השיחה
ענה בעברית בלבד, בשפה אנושית, חמה, בלי מונחים טכניים מיותרים.  
המטרה: לגרום למשתמש לרצות להיפגש עם טל.`,
      },

      ...fullMessages.slice(-5),
    ],
    tools: tools,
    tool_choice: "auto",
  });

  const message = chatCompletion.choices[0].message;

  if (message.tool_calls) {
    const results = [];

    for (const toolCall of message.tool_calls) {
      console.log("toolCall: ", toolCall);
      const { name, arguments: argsJson } = toolCall.function;
      const args = JSON.parse(argsJson);


               if (name === "sendMeetingInvite") {
            await sendEmail.callOpenAIWithMeetingInvite(fullMessages)

      //         results.push({
      //   tool_call_id: toolCall.id,
      //   role: "tool",
      //   name: "sendMeetingInvite",
      //   content: `✅ הזימון נשלח בהצלחה למייל ${args.recipientEmail}.`,
      // });
          }

      if (name === "getPageSpeedInsights") {
        const result = await getPageSpeedInsights(args.url);

        function summarizePageSpeedResult(result) {
          console.log("summarizePageSpeedResult: ", result);

          // ודא שהנתונים קיימים לפני שאתה מנסה לגשת אליהם
          const requestedUrl = result.lighthouseResult?.requestedUrl || "N/A";
          const finalUrl = result.lighthouseResult?.finalUrl || "N/A";

          // ציון ביצועים
          const performanceScore = result.lighthouseResult?.categories
            ?.performance?.score
            ? (
                result.lighthouseResult.categories.performance.score * 100
              ).toFixed(0)
            : "N/A";

          // מדדי Core Web Vitals
          const lcpDisplayValue =
            result.lighthouseResult?.audits["largest-contentful-paint"]
              ?.displayValue || "N/A";
          // FID (First Input Delay) הוחלף ב-INP (Interaction to Next Paint)
          const inpDisplayValue =
            result.lighthouseResult?.audits["interactive"]?.displayValue ||
            "N/A"; // 'interactive' הוא מדד קרוב ל-INP
          const clsDisplayValue =
            result.lighthouseResult?.audits["cumulative-layout-shift"]
              ?.displayValue || "N/A";

          // המלצות - נצטרך למשוך אותן מה-audits עם ציון נמוך או 'warnings'
          const recommendations = [];
          if (result.lighthouseResult?.audits) {
            for (const auditKey in result.lighthouseResult.audits) {
              const audit = result.lighthouseResult.audits[auditKey];
              // נכלול רק ביקורות שיש להן ציון נמוך מ-1 (כלומר, לא עברו באופן מלא) ובעלות תיאור
              if (audit.score !== 1 && audit.title) {
                recommendations.push(audit.title);
              }
            }
          }
          // אם יש אזהרות הרצה, נוסיף אותן כהמלצות
          if (
            result.lighthouseResult?.runWarnings &&
            result.lighthouseResult.runWarnings.length > 0
          ) {
            result.lighthouseResult.runWarnings.forEach((warning) => {
              recommendations.push(`Warning: ${warning}`);
            });
          }

          // הגבל את מספר ההמלצות המוצגות
          const summarizedRecommendations =
            recommendations.length > 0
              ? recommendations.slice(0, 3).join(", ") +
                (recommendations.length > 3 ? "..." : "")
              : "No specific recommendations found or page could not be fully loaded.";

          return `
        🔍 PageSpeed Summary for ${requestedUrl} (Final URL: ${finalUrl}):
        - Performance Score: ${performanceScore}
        - LCP (Largest Contentful Paint): ${lcpDisplayValue}
        - INP (Interaction to Next Paint): ${inpDisplayValue}
        - CLS (Cumulative Layout Shift): ${clsDisplayValue}
        - Recommendations: ${summarizedRecommendations}
          `;
        }

        const summary = summarizePageSpeedResult(result);
        results.push({
          tool_call_id: toolCall.id,
          role: "tool",
          name: "getPageSpeedInsights",
          content: JSON.stringify(summary),
        });
      }

      /* RateLimitError: 429 Request too large for gpt-4-turbo-preview in organization org-OvmQ6j7HS4qsWnFzycJdR2to on tokens per min (TPM): Limit 30000, Requested 59573. The input or output tokens must be reduced in order to run successfully. Visit https://platform.openai.com/account/rate-limits to learn more.
    at APIError.generate (C:\
    */

      const finalResponse = await openai.chat.completions.create({
        model: "gpt-3.5-turbo-1106",
        messages: [
          {
            role: "system",
            content:
              "אתה עוזר וירטואלי עבור 'טל מושל מפתח תוכנה'. תפקידך הוא לספק ניתוח ביצועי אתרים ולעזור למשתמש בכל נושא טכנולוגי, בצורה ישירה, ברורה וחכמה.",
          },
          ...messages,
          {
            role: "user",
            content: userPrompt,
          },
          message,
          ...results,
        ],
      });

      return finalResponse.choices[0].message.content;
    }
  } else {
    return message.content;
  }
}
module.exports = { callOpenAIWithTools };
