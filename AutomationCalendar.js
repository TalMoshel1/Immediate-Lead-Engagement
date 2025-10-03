// Load environment variables from .env file
require('dotenv').config();

const { google } = require('googleapis');


const CALENDAR_ID = 'talmosheldevweb@gmail.com'; 


const SCOPES = ['https://www.googleapis.com/auth/calendar'];

const auth = new google.auth.GoogleAuth({
  scopes: SCOPES,
});

/**
 * Creates an event in the specified calendar.
 * @param {string} summary - The event summary (title).
 * @param {string} description - The event description.
 * @param {Date} startTime - The start time of the event.
 * @param {Date} endTime - The end time of the event.
 */

// async function getCalendarDetails(calendarId) {
//     try {
//       const client = await auth.getClient();
//       const calendar = google.calendar({ version: 'v3', auth: client });
  
//       console.log(`Attempting to get details for calendar ID: ${calendarId}`);
//       const res = await calendar.calendars.get({
//         calendarId: calendarId,
//       });
  
//       console.log('Successfully retrieved calendar details:');
//       console.log('Summary:', res.data.summary);
//       console.log('ID:', res.data.id);
//       console.log('Access Role:', res.data.accessRole); // This is important!
  
//       return res.data;
//     } catch (error) {
//       console.error(`Error getting calendar details for ${calendarId}:`, error.message);
//       // Log the full error response for more details, especially error.errors
//       console.error('API Error Response:', JSON.stringify(error.response ? error.response.data.error : error, null, 2));
//       throw error;
//     }
//   }
  
  // --- Example Usage ---
//   (async () => {
//     try {
//       // --- COMMENT OUT OTHER CALLS (createNewCalendar, listAccessibleCalendars, createCalendarEvent) ---
  
//       // --- UNCOMMENT THIS LINE TO TEST GETTING SPECIFIC CALENDAR DETAILS ---
//       await getCalendarDetails(CALENDAR_ID);
  
//     } catch (err) {
//       console.error('Failed to get calendar details:', err);
//     }
//   })();

// Add this new function
// async function listAccessibleCalendars() {
//   try {
//     const client = await auth.getClient();
//     const calendar = google.calendar({ version: 'v3', auth: client });

//     console.log('Attempting to list calendars accessible by the service account...');
//     const res = await calendar.calendarList.list();
//     const calendars = res.data.items;

//     if (calendars.length) {
//       console.log('Calendars accessible by this Service Account:');
//       calendars.forEach((cal) => {
//         console.log(`- ${cal.summary} (${cal.id})`);
//       });
//     } else {
//       console.log('No calendars found for this Service Account.');
//     }
//   } catch (error) {
//     console.error('Error listing calendars:', error.message);
//     // Log more details for debugging if needed: console.error(error.errors);
//     throw error;
//   }
// }

// Replace your createCalendarEvent call with this in the IIFE:
// (async () => {
//   try {
//     await listAccessibleCalendars();
//   } catch (err) {
//     console.error('Failed to list calendars:', err);
//   }
// })();
async function createCalendarEvent(summary, description, startTime, endTime) {
  try {
    const client = await auth.getClient(); // Get the authenticated client
    const calendar = google.calendar({ version: 'v3', auth: client });

    const event = {
      summary: summary,
      description: description,
      start: {
        dateTime: startTime.toISOString(),
        timeZone: 'Asia/Jerusalem', // Set your desired timezone
      },
      end: {
        dateTime: endTime.toISOString(),
        timeZone: 'Asia/Jerusalem',
      },
    };

    const res = await calendar.events.insert({
      calendarId: CALENDAR_ID,
      resource: event,
    });

    console.log('Event created:', res.data.htmlLink);
    return res.data;

  } catch (error) {
    console.error('Error creating calendar event:', error.message);
    // More detailed error for debugging: console.error(JSON.stringify(error.errors, null, 2));
    throw error;
  }
}

(async () => {
    const now = new Date();
    const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000); // 1 hour from now
  
    try {
      await createCalendarEvent(
        'Node.js Automated Event (SUCCESS!)', // You can change the summary
        'This event should now be created!',
        now,
        oneHourLater
      );
      console.log("Successfully attempted to create an event. Please check your Google Calendar!");
  
    } catch (err) {
      console.error('Failed to create event after fix:', err);
    }
  })();


// async function createNewCalendar(calendarName, description) {
//     try {
//       const client = await auth.getClient();
//       const calendar = google.calendar({ version: 'v3', auth: client });
  
//       const newCalendar = {
//         summary: calendarName,
//         description: description,
//       };
  
//       const res = await calendar.calendars.insert({
//         resource: newCalendar,
//       });
  
//       console.log('New calendar created:', res.data.summary, 'ID:', res.data.id);
//       return res.data;
//     } catch (error) {
//       console.error('Error creating new calendar:', error.message);
//       throw error;
//     }
//   }
  
  // --- Example Usage ---
//   (async () => {
//     try {
//       // --- COMMENT OUT THIS LINE FOR NOW ---
//       // await createCalendarEvent(
//       //   'Node.js Automated Event',
//       //   'This event was created by a Service Account directly sharing access.',
//       //   new Date(),
//       //   new Date(Date.now() + 60 * 60 * 1000)
//       // );
  
//       // --- UNCOMMENT THIS LINE TO TEST CALENDAR CREATION ---
//       await createNewCalendar('Service Account Test Calendar ' + new Date().toLocaleTimeString(), 'Created by my Node.js service account.');
  
//     } catch (err) {
//       console.error('Failed to run example:', err);
//     }
//   })();