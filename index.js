require("dotenv").config();
const cors = require("cors");
const express = require("express");
const bodyParser = require("body-parser");
const app = express();
const port = process.env.PORT || 3001;


const {
  processIncomingMessage,
  determineNextMessageContent,
  sendGreenAPIMessage,
} = require("./server-greenApi-interactions/index");
const { postMessage } = require('./greenApi.js'); 


const corsOptions = {
  origin: "http://localhost:3000",
  methods: "GET,POST",
  credentials: true,
  optionsSuccessStatus: 204
};

// 🟢 שים את זה לפני כל ראוט
app.use(cors(corsOptions));
// app.options('*', cors(corsOptions)); // ✅ זה מה שאתה צריך

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));



// app.options('*', cors(corsOptions)); // 👈 Handle preflight requests


// In a real app, you'd have a more robust session/conversation management system,
// perhaps using a database like MongoDB, PostgreSQL, or Redis.
// This is a simple in-memory store for demonstration.
const chatHistories = {};

app.post("/webhook", async (req, res) => {
  const greenApiPayload = req.body;
  console.log("Received webhook payload:", JSON.stringify(greenApiPayload));

  const processedMessage = processIncomingMessage(greenApiPayload);

  if (processedMessage && processedMessage.chatId) {
    // Initialize history for a new chat if it doesn't exist
    if (!chatHistories[processedMessage.chatId]) {
      chatHistories[processedMessage.chatId] = [];
    }

    // Add incoming message to history
    if (processedMessage.text !== null) {
      chatHistories[processedMessage.chatId].push({
        direction: "in",
        timestamp: new Date().toISOString(),
        content: processedMessage.text,
      });
    }

    // Determine the response
    const nextMessageContent = determineNextMessageContent(
      chatHistories[processedMessage.chatId]
    );

    // Add outgoing message to history
    chatHistories[processedMessage.chatId].push({
      direction: "out",
      timestamp: new Date().toISOString(),
      content: nextMessageContent,
    });

    // TODO: Here you would call your actual GreenAPI sendMessage function
    // For example: await sendGreenAPIMessage(processedMessage.chatId, nextMessageContent);
    console.log(
      `\n[Simulated Send] Responding to ${processedMessage.chatId} with: "${nextMessageContent}"`
    );

    res.status(200).send("Message processed");
  } else {
    res.status(400).send("Invalid webhook payload");
  }
});

/* Authentication with google*/

app.get("/", (req, res) => {
  res.send('<a href="/auth/google">Authentication with Google</a>');
});

app.post("/submit-details", (req, res) => {
  const userDetails = req.body;

  if (!userDetails || Object.keys(userDetails).length === 0) {
    return res.status(400).json({ error: "No user details provided" });
  }

  // agendaEvery()


  try {
    // agendaEvery() // If uncommented, ensure it doesn't crash
    postMessage(); // Ensure this doesn't crash
    res.status(200).json({
        message: "User details submitted successfully",
        data: userDetails,
    });
} catch (error) {
    console.error("Error in submit-details route:", error);
    res.status(500).json({ error: "Internal server error" });
}

});

app.listen(port, () => {
  console.log(`Server running on port ${port} !@!@!@`);
});

// app.use(userDetailsRoute);



// app.get('/protected', (req, res) => {
//   res.send('hello');
// });

module.exports = app;
