// agendaConfig.js
const Agenda = require('agenda');
const dotenv = require('dotenv');
const { postMessage } = require('./greenApi.js'); 


dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/automation-bot';

// Initialize Agenda
const agenda = new Agenda({
    db: { address: MONGODB_URI, collection: 'agendaJobs' }, 
    processEvery: '1 second', 
});


async function agendaEvery() {
    console.log('Scheduling one-time message...');
    agenda.define('welcomeMessage', async () => { 
        console.log('agendaEvery')
        try {
            await postMessage(); 
        } catch (error) {
        }
    });
      
    await agenda.start();
      
    // Schedule the 'welcomeMessage' job to run once after 5 seconds.
    // To send after 3 hours, replace '5 seconds' with '3 hours'.
    // const DELAY_TIME = '3 hours'; // Uncomment and use this for a 3-hour delay
    const DELAY_TIME = '5 seconds'; 
    await agenda.schedule(`in ${DELAY_TIME}`, 'welcomeMessage');

    console.log(`Message scheduled to be sent in ${DELAY_TIME}.`);
}






module.exports = {  agendaEvery };