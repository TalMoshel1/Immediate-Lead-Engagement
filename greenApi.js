const { GreenApiClient } = require("@green-api/whatsapp-api-client-js-v2");
const dotenv = require("dotenv");
dotenv.config();

const apiTokenInstance = process.env.apiTokenInstance;
const idInstance = process.env.idInstance;

const client = new GreenApiClient({
  idInstance: idInstance,
  apiTokenInstance: apiTokenInstance,
});

async function getNotification() {
  const notification = await client.receiveNotification(30);
  if (notification) {
    console.log('Received notification:', notification.body.typeWebhook);

    // Process the notification
    if (notification.body.typeWebhook === 'incomingMessageReceived') {
      // Handle incoming message
      console.log('Message:', notification.body.messageData);
    }

    // Delete the notification from queue after processing
   return await client.deleteNotification(notification.receiptId);
  }
}

async function postMessage(phoneNumber, message) {

  await client.sendMessage({
    chatId: phoneNumber,
    message: message,
  });
}

module.exports = {  postMessage, getNotification };