const { postMessage } = require("../greenApi.js");
const { findUserByPhone, addMessageToUser } = require("../services/mongoDB.js");
const { getNumberFromGreenApiFormat } = require("../functions/phoneNumbers.js");
const whatsAppClient = require("@green-api/whatsapp-api-client");
const { runDbInstance } = require("../mongoDB-config.js");
const { tools } = require("../utils/tools/tools.js");
const { callOpenAIWithTools } = require("../services/openAi.js");

const SYSTEM_PROMPT = {
  role: "system",
  content:
    "אתה עוזר וירטואלי עבור 'טל מושל מפתח תוכנה'. תפקידך הוא לספק ניתוח ביצועי אתרים...",
};

async function webhookController(restAPI, app) {
  runDbInstance.then(async () => {
    console.log("webhook works");
    try {
      // Set webhook settings
      await restAPI.settings.setSettings({
        // webhookUrl: "https://talmoshelasaservice2.runmydocker-app.com/webhooks",
        webhookUrl: "https://9dd67cf0c1f8.ngrok-free.app/webhooks",

        incomingWebhook: "yes",
        stateWebhook: "yes",
      });

      // Initialize webhook API
      const webHookAPI = whatsAppClient.webhookAPI(app, "/webhooks");

      // Handle incoming message text
      webHookAPI.onIncomingMessageText(
        async (
          data,
          idInstance,
          idMessage,
          sender,
          typeMessage,
          textMessage
        ) => {
          console.log(`Incoming Notification data ${JSON.stringify(data)}`); // Log incoming data
          console.log("data: ", data);
          const senderName = data.senderData.senderName;
          const senderPhone = getNumberFromGreenApiFormat(
            data.senderData.chatId
          );
          const isUser = await findUserByPhone(
            getNumberFromGreenApiFormat(data.senderData.chatId)
          );
          console.log("is USER EXISTS: ", isUser.messages);
          if (isUser) {
            console.log(
              " data.messageData.textMessageData.textMessage: ",
              data.messageData.textMessageData.textMessage
            );
            await addMessageToUser(
              senderPhone,
              (role = "user"),
              data.messageData.textMessageData.textMessage
            );
            const aiRepsonse = await callOpenAIWithTools(
              data.messageData.textMessageData.textMessage,
              isUser.messages,
              isUser.userName
            );
            // console.log("AI Response: ", aiRepsonse);

            await addMessageToUser(senderPhone, (role = "system"), aiRepsonse);

            await postMessage(data.senderData.chatId, aiRepsonse);

            /* כשהטול מופעל אני מקבל שגיאה 429 :
             return new RateLimitError(status, error, message, headers);
                   ^

RateLimitError: 429 Request too large for gpt-4-turbo-preview in organization org-OvmQ6j7HS4qsWnFzycJdR2to on tokens per min (TPM): Limit 30000, Requested 59573. The input or output tokens must be reduced in order to run successfully. Visit https://platform.openai.com/account/rate-limits to learn more.



*/
            // addMessageToUser(
            //   senderPhone,
            //   (role = "user"),
            //   data.messageData.textMessageData.textMessage
            // );
            /* כאן אני רוצה לעשות את הקריאה לapi של openai יחד עם system prompt וכל ההודעות של היוזר 
     data.messageData.textMessageData.textMessage   isUser.messages שיגיעו מ


     ואני גם רוצה להכניס ל את ה tools שייבאתי בתחילת הדף

     צור לי פונקציה שתעשה בדיוק את זה

     צור לי משפט תנאי שיבדוק האם message.tool_calls
     הוא בעל ערך או לא 
           */

            // const SystemMessage = await postMessage(
            //   data.senderData.chatId,
            //   `תשובה שסוכן ה AI יביא`
            // );
            // addMessageToUser(senderPhone, (role = "system"), SystemMessage);
          } else {
            console.log("dont send message");
          }
        }
      );
    } catch (error) {
      console.error("error: ", error);
      process.exit(1);
    }
  });
}

module.exports = { webhookController };
