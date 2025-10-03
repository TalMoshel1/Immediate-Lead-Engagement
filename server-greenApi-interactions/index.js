
/**
 * @fileoverview GreenAPI Conversation Processing Functions for Node.js
 *
 * This file contains two core functions designed to help a Node.js server
 * interact with the GreenAPI for WhatsApp message processing:
 *
 * 1. `processIncomingMessage`: Parses and extracts key information from
 * incoming messages received via GreenAPI webhooks.
 * 2. `determineNextMessageContent`: Determines the content of the next
 * outgoing message based on conversation context.
 *
 * This file also includes a basic Express.js server setup to demonstrate
 * how your Node.js server receives incoming messages from GreenAPI
 * via a webhook (e.g., a POST request to an endpoint) and processes them.
 */

// Required Node.js modules for the server setup
const express = require('express');
const bodyParser = require('body-parser');
// You might need 'node-fetch' or 'axios' if you're making actual HTTP requests
// const fetch = require('node-fetch'); // If using node-fetch for API calls
// const axios = require('axios'); // If using axios for API calls

/**
 * Mocks the GreenAPI incoming message structure for demonstration purposes.
 * In a real application, this data would come from the GreenAPI webhook payload.
 *
 * @typedef {object} GreenAPIMessagePayload
 * @property {object} body - The main body of the incoming webhook.
 * @property {string} body.typeWebhook - Type of webhook (e.g., 'incomingMessageReceived').
 * @property {object} body.senderData - Information about the sender.
 * @property {string} body.senderData.chatId - The ID of the chat.
 * @property {string} body.senderData.sender - The sender's phone number.
 * @property {string} body.senderData.senderName - The sender's display name.
 * @property {object} body.messageData - Data related to the message itself.
 * @property {string} body.messageData.typeMessage - Type of message (e.g., 'textMessage', 'imageMessage').
 * @property {object} body.messageData.textMessageData - Data for text messages.
 * @property {string} body.messageData.textMessageData.textMessage - The text content of the message.
 * // Add other message data types as needed (e.g., imageMessageData, etc.)
 */

/**
 * Represents a simplified incoming message object after processing.
 *
 * @typedef {object} ProcessedMessage
 * @property {string} chatId - The ID of the chat where the message originated.
 * @property {string} senderId - The ID of the sender (e.g., phone number).
 * @property {string} senderName - The display name of the sender.
 * @property {string} messageType - The type of message (e.g., 'text', 'image').
 * @property {string|null} text - The text content of the message, if it's a text message.
 * @property {object|null} rawPayload - The full raw payload from GreenAPI for detailed debugging/use.
 */

/**
 * Represents an entry in the conversation history.
 *
 * @typedef {object} ConversationEntry
 * @property {'in'|'out'} direction - 'in' for incoming, 'out' for outgoing.
 * @property {string} timestamp - ISO string of when the message occurred.
 * @property {string} content - The text content of the message.
 */



/**
 * Processes an incoming message payload from GreenAPI's webhook.
 * This function extracts key information from the raw GreenAPI response
 * to make it easier to work with.
 *
 * @param {GreenAPIMessagePayload} greenApiPayload - The raw JSON payload
 * received from the GreenAPI webhook.
 * @returns {ProcessedMessage|null} An object containing processed message
 * data, or null if the payload is not a recognizable incoming message.
 */
function processIncomingMessage(greenApiPayload) {
  // Corrected initial check:
  // - greenApiPayload itself should exist
  // - typeWebhook is directly on greenApiPayload, not greenApiPayload.body
  if (!greenApiPayload || greenApiPayload.typeWebhook !== 'incomingMessageReceived') {
    // This warning will now only show for webhooks that are NOT 'incomingMessageReceived'
    // or if the payload itself is empty.
    console.warn("Non-incoming or malformed webhook type received by processIncomingMessage:", JSON.stringify(greenApiPayload));
    return null;
  }

  // Corrected destructuring: senderData and messageData are directly on greenApiPayload
  const { senderData, messageData } = greenApiPayload;

  // Add a check to ensure senderData and messageData exist
  if (!senderData || !messageData) {
      console.warn("Incoming message payload missing senderData or messageData:", JSON.stringify(greenApiPayload));
      return null;
  }

  const processedMessage = {
    chatId: senderData.chatId || null, // No need for ?. here if you check existence above
    senderId: senderData.sender || null,
    senderName: senderData.senderName || 'Unknown',
    messageType: messageData.typeMessage || 'unknown',
    text: null,
    rawPayload: greenApiPayload, // Keep the raw payload for full context if needed
  };

  // Extract content based on message type
  switch (processedMessage.messageType) {
    case 'textMessage':
      // messageData.textMessageData should exist for text messages
      processedMessage.text = messageData.textMessageData?.textMessage || '';
      break;
    case 'imageMessage':
      // You would typically handle image URLs here, e.g., processedMessage.imageUrl = messageData?.fileLink;
      console.log(`Received image message from ${processedMessage.senderName} (${processedMessage.senderId}).`);
      // You might return a different structure for image messages, or handle them directly
      break;
    case 'locationMessage':
      // Handle location data
      console.log(`Received location message from ${processedMessage.senderName} (${processedMessage.senderId}).`);
      break;
    // Add more cases for other message types (audioMessage, videoMessage, etc.)
    default:
      console.log(`Received unhandled message type: ${processedMessage.messageType} from ${processedMessage.senderName} (${processedMessage.senderId}).`);
      break;
  }

  // If you only want to process text messages, you might add a check here
  // if (processedMessage.messageType !== 'textMessage') {
  //     return null; // Don't process non-text messages further
  // }

  console.log(`Processed incoming message from ${processedMessage.senderName}: "${processedMessage.text}" (Type: ${processedMessage.messageType})`);
  return processedMessage;
}

/**
 * Determines the content of the next message to be sent by the Node.js server
 * based on the current conversation history. This function acts as the "brain"
 * of your bot's response logic.
 *
 * @param {ConversationEntry[]} conversationHistory - An array of objects
 * representing the chronological sequence of messages in the conversation.
 * The last entry is the most recent incoming message.
 * @returns {string} The content (text) of the message to be sent next.
 * Returns an empty string or a default message if no specific response is determined.
 */
function determineNextMessageContent(conversationHistory) {
  // Always log the full history for debugging
  console.log("Current Conversation History:", JSON.stringify(conversationHistory, null, 2));

  if (!conversationHistory || conversationHistory.length === 0) {
    return "Hello! How can I help you today?";
  }

  // Get the last incoming message (the one we just received and need to respond to)
  const lastIncomingMessage = conversationHistory
    .filter(entry => entry.direction === 'in')
    .pop();

  if (!lastIncomingMessage) {
    return "It seems I received something, but I can't find a clear last incoming message. Can you please rephrase?";
  }

  const lastMessageText = lastIncomingMessage.content.toLowerCase().trim();

  // --- Implement your custom response logic here ---
  // This is where you would integrate different functions or AI models
  // to generate dynamic responses based on the `lastMessageText`
  // and the `conversationHistory`.

  if (lastMessageText.includes("hello") || lastMessageText.includes("hi")) {
    return "Hi there! How are you doing?";
  } else if (lastMessageText.includes("how are you")) {
    return "I'm just a bot, but I'm doing great! Thanks for asking.";
  } else if (lastMessageText.includes("help") || lastMessageText.includes("support")) {
    return "I can help with general inquiries. What specifically do you need assistance with?";
  } else if (lastMessageText.includes("order status")) {
    // Example: Call another internal function or service
    // return getOrderStatusFunction();
    return "Please provide your order number to check its status.";
  } else if (lastMessageText.includes("bye") || lastMessageText.includes("goodbye")) {
    return "Goodbye! Have a great day!";
  } else if (lastMessageText.includes("tell me a joke")) {
    // Example of calling an external or internal 'joke' function
    return "Why don't scientists trust atoms? Because they make up everything!";
  }
  else if (lastMessageText.includes("weather")) {
    return "I can tell you the weather, but I need to know your location. Could you please provide it?";
  }

  // Fallback or default response if no specific match
  return "I'm not sure how to respond to that. Can you try rephrasing or ask something else?";
}

/**
 * Mocks the GreenAPI `sendMessage` function.
 * In a real Node.js server, this would be an API call to GreenAPI.
 * @param {string} chatId - The ID of the chat to send the message to.
 * @param {string} messageText - The text content of the message.
 */
async function sendGreenAPIMessage(chatId, messageText) {
  console.log(`\n--- Sending Message to ${chatId}: "${messageText}" ---\n`);
  // In a real application, you would use a library like 'axios' or 'node-fetch'
  // to make an HTTP POST request to the GreenAPI's sendMessage endpoint.
  // Example using node-fetch (install with `npm install node-fetch` if not in browser environment):
  /*
  try {
    const greenApiInstanceId = 'YOUR_INSTANCE_ID'; // Replace with your GreenAPI Instance ID
    const greenApiToken = 'YOUR_API_TOKEN';     // Replace with your GreenAPI API Token
    const url = `https://api.green-api.com/waInstance${greenApiInstanceId}/sendMessage/${greenApiToken}`;
    const payload = {
      chatId: chatId,
      message: messageText
    };
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await response.json();
    console.log("GreenAPI send message response:", data);
    return data; // Return response for success indication if needed
  } catch (error) {
    console.error("Error sending message via GreenAPI:", error);
    throw error; // Propagate error
  }
  */
  // For demonstration, we'll just log and return a mock success
  return { status: 'success', message: 'Mock message sent' };
}


// --- Node.js Express Server Setup for Webhook ---



// Middleware to parse JSON request bodies
bodyParser.json()

// In a production application, you would use a persistent storage
// like a database (MongoDB, PostgreSQL, Redis) to store conversation histories.
// This in-memory object is for demonstration purposes only and will reset
// every time the server restarts.



// Export functions for use in other Node.js modules if needed
module.exports = {
  processIncomingMessage,
  determineNextMessageContent,
  sendGreenAPIMessage, // Export the send function as well
};
