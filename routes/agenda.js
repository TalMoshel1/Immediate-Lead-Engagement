const { agenda, startAgenda } = require('../agendaConfig'); 

const express = require('express');
const bodyParser = require('body-parser');
const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.post('/schedule-whatsapp-message', async (req, res) => {
    const { name, phoneNumber } = req.body;

    if (!name || !phoneNumber) {
        return res.status(400).json({ message: "Name and phone number are required." });
    }

    const messageToSend = `שלום ${name}, תודה שנרשמת! נשמח לתת לך פרטים נוספים.`;
    const delayMinutes = 5; // Schedule 5 minutes from now

    try {
        // Schedule a job
        const job = agenda.schedule(`in ${delayMinutes} minutes`, 'send delayed whatsapp message', {
            phoneNumber: phoneNumber,
            message: messageToSend
        });

        // If you need the job ID immediately, you can get it from `job.attrs._id`
        console.log(
            `[Server] Job ${job.attrs._id} scheduled for ${name} (${phoneNumber}). Will run in ${delayMinutes} minutes.`
        );
        res.status(202).json({
            message: `Details received. WhatsApp message scheduled for ${name} in ${delayMinutes} minutes.`,
            jobId: job.attrs._id,
        });
    } catch (error) {
        console.error("[Server] Error scheduling job:", error.message);
        res.status(500).json({
            message: "Failed to schedule WhatsApp message. Please try again.",
        });
    }
});

module.exports = app;