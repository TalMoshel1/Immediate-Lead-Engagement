// mainCalendarApp.js
require("dotenv").config(); // Load environment variables from .env file

const { google } = require("googleapis");

const CALENDAR_ID = "talmosheldevweb@gmail.com";

// For the purpose of running all tests from one file, we'll initialize auth
// with a broad scope. In a real application, you'd define scopes
// based on the specific operations you need to perform.
// Note: Some scopes might require more specific permissions configured in GCP.
const ALL_POSSIBLE_SCOPES = [
  "https://www.googleapis.com/auth/calendar",
  "https://www.googleapis.com/auth/calendar.readonly",
  "https://www.googleapis.com/auth/calendar.freebusy",
  "https://www.googleapis.com/auth/calendar.events",
  "https://www.googleapis.com/auth/calendar.events.readonly",
  "https://www.googleapis.com/auth/calendar.settings.readonly",
  "https://www.googleapis.com/auth/calendar.addons.execute", // Add-on specific, won't show direct API effect
  "https://www.googleapis.com/auth/calendar.addons.current.event.read", // Add-on specific
  "https://www.googleapis.com/auth/calendar.addons.current.event.write", // Add-on specific
  "https://www.googleapis.com/auth/calendar.events.owned",
  "https://www.googleapis.com/auth/calendar.events.owned.readonly",
  "https://www.googleapis.com/auth/calendar.events.freebusy",
  "https://www.googleapis.com/auth/calendar.app.created",
  "https://www.googleapis.com/auth/calendar.calendarlist",
  "https://www.googleapis.com/auth/calendar.calendarlist.readonly",
  "https://www.googleapis.com/auth/calendar.calendars",
  "https://www.googleapis.com/auth/calendar.calendars.readonly",
  "https://www.googleapis.com/auth/calendar.acls",
  "https://www.googleapis.com/auth/calendar.acls.readonly",
  "https://www.googleapis.com/auth/calendar.events.public.readonly",
];

// Initialize GoogleAuth once with all necessary scopes for testing
const auth = new google.auth.GoogleAuth({
  scopes: ALL_POSSIBLE_SCOPES,
});

/**
 * Creates an event in the specified calendar.
 * @param {string} summary - The event summary (title).
 * @param {string} description - The event description.
 * @param {Date} startTime - The start time of the event.
 * @param {Date} endTime - The end time of the event.
 * @returns {Promise<{event: object, meetingLink: string|null}>} The created event data and meeting link.
 */
async function createCalendarEvent(summary, description, startTime, endTime) {
  try {
    const client = await auth.getClient();
    const calendar = google.calendar({ version: "v3", auth: client });

    const event = {
      summary: summary,
      description: description,
      start: {
        dateTime: startTime.toISOString(),
        timeZone: "Asia/Jerusalem",
      },
      end: {
        dateTime: endTime.toISOString(),
        timeZone: "Asia/Jerusalem",
      },
      conferenceData: {
        createRequest: {
          requestId: `meeting-${Date.now()}`,
          conferenceSolutionKey: {
            type: "hangoutsMeet", // You might need to configure Zoom if desired
          },
        },
      },
    };

    const res = await calendar.events.insert({
      calendarId: CALENDAR_ID,
      resource: event,
      conferenceDataVersion: 1, // Required to create a conference
    });

    console.log("Event created:", res.data.htmlLink);
    let meetingLink = null;
    if (res.data.conferenceData && res.data.conferenceData.entryPoints) {
      const videoEntryPoint = res.data.conferenceData.entryPoints.find(
        (ep) => ep.entryPointType === "video"
      );
      if (videoEntryPoint) {
        meetingLink = videoEntryPoint.uri;
        console.log("Meeting Link:", meetingLink);
      }
    }
    return { event: res.data, meetingLink: meetingLink };
  } catch (error) {
    console.error("Error creating calendar event:", error.message);
    console.error(
      "API Error Response:",
      JSON.stringify(
        error.response ? error.response.data.error : error,
        null,
        2
      )
    );
    throw error;
  }
}

/**
 * Finds available time slots in the specified calendar.
 * @param {string} calendarId - The ID of the calendar to check.
 * @param {Date} startTime - The start of the time range to check.
 * @param {Date} endTime - The end of the time range to check.
 * @param {number} durationMinutes - Desired duration of each free slot in minutes.
 * @returns {Array} An array of available time slots.
 */
async function findFreeTimeSlots(
  calendarId,
  startTime,
  endTime,
  durationMinutes = 30
) {
  try {
    const client = await auth.getClient();
    const calendar = google.calendar({ version: "v3", auth: client });

    const res = await calendar.freebusy.query({
      requestBody: {
        timeMin: startTime.toISOString(),
        timeMax: endTime.toISOString(),
        items: [{ id: calendarId }],
      },
    });

    const busyTimes = res.data.calendars[calendarId].busy || [];
    console.log(
      `\nFree/Busy for ${calendarId} between ${startTime.toLocaleString()} and ${endTime.toLocaleString()}:`
    );
    console.log("Busy periods:", JSON.stringify(busyTimes, null, 2));

    let freeSlots = [];
    let currentCheckTime = new Date(startTime);

    while (
      currentCheckTime.getTime() + durationMinutes * 60 * 1000 <=
      endTime.getTime()
    ) {
      let isBusy = false;
      let nextPotentialBusyEnd = null;

      for (const busy of busyTimes) {
        const busyStart = new Date(busy.start);
        const busyEnd = new Date(busy.end);

        if (
          currentCheckTime < busyEnd &&
          new Date(currentCheckTime.getTime() + durationMinutes * 60 * 1000) >
            busyStart
        ) {
          isBusy = true;
          if (nextPotentialBusyEnd === null || busyEnd > nextPotentialBusyEnd) {
            nextPotentialBusyEnd = busyEnd;
          }
        }
      }

      if (!isBusy) {
        freeSlots.push({
          start: new Date(currentCheckTime),
          end: new Date(
            currentCheckTime.getTime() + durationMinutes * 60 * 1000
          ),
        });
        currentCheckTime = new Date(
          currentCheckTime.getTime() + durationMinutes * 60 * 1000
        );
      } else {
        currentCheckTime = new Date(
          nextPotentialBusyEnd ||
            currentCheckTime.getTime() + durationMinutes * 60 * 1000
        );
      }
    }
    return freeSlots;
  } catch (error) {
    console.error("Error finding free time slots:", error.message);
    throw error;
  }
}

// --- Functions to test each API Scope ---
// Each function attempts a relevant API call for its specific scope.
// Some scopes (like Add-ons related) do not have direct API calls that can be demonstrated this way.

/**
 * Tests the 'https://www.googleapis.com/auth/calendar' scope.
 */
async function testCalendarFullScope() {
  const scope = "https://www.googleapis.com/auth/calendar";
  console.log(`\n--- Testing Scope: ${scope} ---`);
  try {
    const client = await auth.getClient();
    const calendar = google.calendar({ version: "v3", auth: client });
    const res = await calendar.calendarList.list();
    console.log(`API Call: calendar.calendarList.list()`);
    console.log(
      "Result (first 5 items):",
      JSON.stringify(res.data.items.slice(0, 5), null, 2)
    );
  } catch (error) {
    console.error(`Error with scope ${scope}:`, error.message);
    console.error(
      "API Error Response:",
      JSON.stringify(
        error.response ? error.response.data.error : error,
        null,
        2
      )
    );
  }
}

/**
 * Tests the 'https://www.googleapis.com/auth/calendar.readonly' scope.
 */
async function testCalendarReadonlyScope() {
  const scope = "https://www.googleapis.com/auth/calendar.readonly";
  console.log(`\n--- Testing Scope: ${scope} ---`);
  try {
    const client = await auth.getClient();
    const calendar = google.calendar({ version: "v3", auth: client });
    const res = await calendar.calendars.get({ calendarId: CALENDAR_ID });
    console.log(
      `API Call: calendar.calendars.get({ calendarId: '${CALENDAR_ID}' })`
    );
    console.log("Result:", JSON.stringify(res.data, null, 2));
  } catch (error) {
    console.error(`Error with scope ${scope}:`, error.message);
    console.error(
      "API Error Response:",
      JSON.stringify(
        error.response ? error.response.data.error : error,
        null,
        2
      )
    );
  }
}

/**
 * Tests the 'https://www.googleapis.com/auth/calendar.freebusy' scope.
 */
async function testCalendarFreebusyScopeOnly() {
  // Renamed to avoid conflict with findFreeTimeSlots
  const scope = "https://www.googleapis.com/auth/calendar.freebusy";
  console.log(`\n--- Testing Scope: ${scope} ---`);
  try {
    const client = await auth.getClient();
    const calendar = google.calendar({ version: "v3", auth: client });
    const now = new Date();
    const twoHoursLater = new Date(now.getTime() + 2 * 60 * 60 * 1000);
    const res = await calendar.freebusy.query({
      requestBody: {
        timeMin: now.toISOString(),
        timeMax: twoHoursLater.toISOString(),
        items: [{ id: CALENDAR_ID }],
      },
    });
    console.log(`API Call: calendar.freebusy.query for ${CALENDAR_ID}`);
    console.log(
      "Result:",
      JSON.stringify(res.data.calendars[CALENDAR_ID], null, 2)
    );
  } catch (error) {
    console.error(`Error with scope ${scope}:`, error.message);
    console.error(
      "API Error Response:",
      JSON.stringify(
        error.response ? error.response.data.error : error,
        null,
        2
      )
    );
  }
}

/**
 * Tests the 'https://www.googleapis.com/auth/calendar.events' scope.
 */
async function testCalendarEventsScope() {
  const scope = "https://www.googleapis.com/auth/calendar.events";
  console.log(`\n--- Testing Scope: ${scope} ---`);
  try {
    const client = await auth.getClient();
    const calendar = google.calendar({ version: "v3", auth: client });
    const res = await calendar.events.list({
      calendarId: CALENDAR_ID,
      timeMin: new Date().toISOString(),
      maxResults: 5,
      singleEvents: true,
      orderBy: "startTime",
    });
    console.log(
      `API Call: calendar.events.list({ calendarId: '${CALENDAR_ID}' })`
    );
    console.log(
      "Result (first 5 events):",
      JSON.stringify(res.data.items.slice(0, 5), null, 2)
    );
  } catch (error) {
    console.error(`Error with scope ${scope}:`, error.message);
    console.error(
      "API Error Response:",
      JSON.stringify(
        error.response ? error.response.data.error : error,
        null,
        2
      )
    );
  }
}

/**
 * Tests the 'https://www.googleapis.com/auth/calendar.events.readonly' scope.
 */
async function testCalendarEventsReadonlyScope() {
  const scope = "https://www.googleapis.com/auth/calendar.events.readonly";
  console.log(`\n--- Testing Scope: ${scope} ---`);
  try {
    const client = await auth.getClient();
    const calendar = google.calendar({ version: "v3", auth: client });
    const res = await calendar.events.list({
      calendarId: CALENDAR_ID,
      timeMin: new Date().toISOString(),
      maxResults: 5,
      singleEvents: true,
      orderBy: "startTime",
    });
    console.log(
      `API Call: calendar.events.list({ calendarId: '${CALENDAR_ID}' }) (readonly)`
    );
    console.log(
      "Result (first 5 events):",
      JSON.stringify(res.data.items.slice(0, 5), null, 2)
    );
  } catch (error) {
    console.error(`Error with scope ${scope}:`, error.message);
    console.error(
      "API Error Response:",
      JSON.stringify(
        error.response ? error.response.data.error : error,
        null,
        2
      )
    );
  }
}

/**
 * Tests the 'https://www.googleapis.com/auth/calendar.settings.readonly' scope.
 */
async function testCalendarSettingsReadonlyScope() {
  const scope = "https://www.googleapis.com/auth/calendar.settings.readonly";
  console.log(`\n--- Testing Scope: ${scope} ---`);
  try {
    const client = await auth.getClient();
    const calendar = google.calendar({ version: "v3", auth: client });
    const res = await calendar.settings.list();
    console.log(`API Call: calendar.settings.list()`);
    console.log(
      "Result (first 5 settings):",
      JSON.stringify(res.data.items.slice(0, 5), null, 2)
    );
  } catch (error) {
    console.error(`Error with scope ${scope}:`, error.message);
    console.error(
      "API Error Response:",
      JSON.stringify(
        error.response ? error.response.data.error : error,
        null,
        2
      )
    );
  }
}

/**
 * Tests the 'https://www.googleapis.com/auth/calendar.addons.execute' scope.
 */
async function testCalendarAddonsExecuteScope() {
  const scope = "https://www.googleapis.com/auth/calendar.addons.execute";
  console.log(`\n--- Testing Scope: ${scope} ---`);
  console.log(
    `Note: This scope (${scope}) is primarily for Google Workspace Add-ons. Direct API calls usually don't demonstrate its functionality directly.`
  );
  console.log(
    "It grants an add-on permission to execute functions on behalf of the user."
  );
}

/**
 * Tests the 'https://www.googleapis.com/auth/calendar.addons.current.event.read' scope.
 */
async function testCalendarAddonsCurrentEventReadScope() {
  const scope =
    "https://www.googleapis.com/auth/calendar.addons.current.event.read";
  console.log(`\n--- Testing Scope: ${scope} ---`);
  console.log(
    `Note: This scope (${scope}) is for Google Workspace Add-ons to read the current event. No direct API call to demonstrate.`
  );
}

/**
 * Tests the 'https://www.googleapis.com/auth/calendar.addons.current.event.write' scope.
 */
async function testCalendarAddonsCurrentEventWriteScope() {
  const scope =
    "https://www.googleapis.com/auth/calendar.addons.current.event.write";
  console.log(`\n--- Testing Scope: ${scope} ---`);
  console.log(
    `Note: This scope (${scope}) is for Google Workspace Add-ons to write to the current event. No direct API call to demonstrate.`
  );
}

/**
 * Tests the 'https://www.googleapis.com/auth/calendar.events.owned' scope.
 */
async function testCalendarEventsOwnedScope() {
  const scope = "https://www.googleapis.com/auth/calendar.events.owned";
  console.log(`\n--- Testing Scope: ${scope} ---`);
  try {
    const client = await auth.getClient();
    const calendar = google.calendar({ version: "v3", auth: client });
    const res = await calendar.events.list({
      calendarId: CALENDAR_ID,
      timeMin: new Date().toISOString(),
      maxResults: 5,
      singleEvents: true,
      orderBy: "startTime",
    });
    console.log(
      `API Call: calendar.events.list({ calendarId: '${CALENDAR_ID}' }) (for owned events)`
    );
    console.log(
      "Result (first 5 owned events):",
      JSON.stringify(res.data.items.slice(0, 5), null, 2)
    );
  } catch (error) {
    console.error(`Error with scope ${scope}:`, error.message);
    console.error(
      "API Error Response:",
      JSON.stringify(
        error.response ? error.response.data.error : error,
        null,
        2
      )
    );
  }
}

/**
 * Tests the 'https://www.googleapis.com/auth/calendar.events.owned.readonly' scope.
 */
async function testCalendarEventsOwnedReadonlyScope() {
  const scope =
    "https://www.googleapis.com/auth/calendar.events.owned.readonly";
  console.log(`\n--- Testing Scope: ${scope} ---`);
  try {
    const client = await auth.getClient();
    const calendar = google.calendar({ version: "v3", auth: client });
    const res = await calendar.events.list({
      calendarId: CALENDAR_ID,
      timeMin: new Date().toISOString(),
      maxResults: 5,
      singleEvents: true,
      orderBy: "startTime",
    });
    console.log(
      `API Call: calendar.events.list({ calendarId: '${CALENDAR_ID}' }) (for owned events, readonly)`
    );
    console.log(
      "Result (first 5 owned events):",
      JSON.stringify(res.data.items.slice(0, 5), null, 2)
    );
  } catch (error) {
    console.error(`Error with scope ${scope}:`, error.message);
    console.error(
      "API Error Response:",
      JSON.stringify(
        error.response ? error.response.data.error : error,
        null,
        2
      )
    );
  }
}

/**
 * Tests the 'https://www.googleapis.com/auth/calendar.events.freebusy' scope.
 */
async function testCalendarEventsFreebusyScope() {
  const scope = "https://www.googleapis.com/auth/calendar.events.freebusy";
  console.log(`\n--- Testing Scope: ${scope} ---`);
  try {
    const client = await auth.getClient();
    const calendar = google.calendar({ version: "v3", auth: client });
    const now = new Date();
    const twoHoursLater = new Date(now.getTime() + 2 * 60 * 60 * 1000);
    const res = await calendar.freebusy.query({
      requestBody: {
        timeMin: now.toISOString(),
        timeMax: twoHoursLater.toISOString(),
        items: [{ id: CALENDAR_ID }],
      },
    });
    console.log(`API Call: calendar.freebusy.query for ${CALENDAR_ID}`);
    console.log(
      "Result:",
      JSON.stringify(res.data.calendars[CALENDAR_ID], null, 2)
    );
  } catch (error) {
    console.error(`Error with scope ${scope}:`, error.message);
    console.error(
      "API Error Response:",
      JSON.stringify(
        error.response ? error.response.data.error : error,
        null,
        2
      )
    );
  }
}

/**
 * Tests the 'https://www.googleapis.com/auth/calendar.app.created' scope.
 */
async function testCalendarAppCreatedScope() {
  const scope = "https://www.googleapis.com/auth/calendar.app.created";
  console.log(`\n--- Testing Scope: ${scope} ---`);
  try {
    const client = await auth.getClient();
    const calendar = google.calendar({ version: "v3", auth: client });
    const newCalendarName = `App Created Test Cal ${new Date().toLocaleTimeString()}`;
    const res = await calendar.calendars.insert({
      resource: {
        summary: newCalendarName,
        description: "Test calendar created with app.created scope",
      },
    });
    console.log(
      `API Call: calendar.calendars.insert() for '${newCalendarName}'`
    );
    console.log("Result:", JSON.stringify(res.data, null, 2));
    // Optionally delete the created calendar:
    // await calendar.calendars.delete({ calendarId: res.data.id });
    // console.log(`Deleted created calendar: ${res.data.id}`);
  } catch (error) {
    console.error(`Error with scope ${scope}:`, error.message);
    console.error(
      "API Error ",
      JSON.stringify(
        error.response ? error.response.data.error : error,
        null,
        2
      )
    );
  }
}

/**
 * Tests the 'https://www.googleapis.com/auth/calendar.calendarlist' scope.
 */
async function testCalendarCalendarlistScope() {
  const scope = "https://www.googleapis.com/auth/calendar.calendarlist";
  console.log(`\n--- Testing Scope: ${scope} ---`);
  try {
    const client = await auth.getClient();
    const calendar = google.calendar({ version: "v3", auth: client });
    const res = await calendar.calendarList.list();
    console.log(`API Call: calendar.calendarList.list()`);
    console.log(
      "Result (first 5 items):",
      JSON.stringify(res.data.items.slice(0, 5), null, 2)
    );
  } catch (error) {
    console.error(`Error with scope ${scope}:`, error.message);
    console.error(
      "API Error Response:",
      JSON.stringify(
        error.response ? error.response.data.error : error,
        null,
        2
      )
    );
  }
}

/**
 * Tests the 'https://www.googleapis.com/auth/calendar.calendarlist.readonly' scope.
 */
async function testCalendarCalendarlistReadonlyScope() {
  const scope =
    "https://www.googleapis.com/auth/calendar.calendarlist.readonly";
  console.log(`\n--- Testing Scope: ${scope} ---`);
  try {
    const client = await auth.getClient();
    const calendar = google.calendar({ version: "v3", auth: client });
    const res = await calendar.calendarList.list();
    console.log(`API Call: calendar.calendarList.list() (readonly)`);
    console.log(
      "Result (first 5 items):",
      JSON.stringify(res.data.items.slice(0, 5), null, 2)
    );
  } catch (error) {
    console.error(`Error with scope ${scope}:`, error.message);
    console.error(
      "API Error Response:",
      JSON.stringify(
        error.response ? error.response.data.error : error,
        null,
        2
      )
    );
  }
}

/**
 * Tests the 'https://www.googleapis.com/auth/calendar.calendars' scope.
 */
async function testCalendarCalendarsScope() {
  const scope = "https://www.googleapis.com/auth/calendar.calendars";
  console.log(`\n--- Testing Scope: ${scope} ---`);
  try {
    const client = await auth.getClient();
    const calendar = google.calendar({ version: "v3", auth: client });
    const newCalendarName = `Calendars Scope Test Cal ${new Date().toLocaleTimeString()}`;
    const res = await calendar.calendars.insert({
      resource: {
        summary: newCalendarName,
        description: "Test calendar created with calendars scope",
      },
    });
    console.log(
      `API Call: calendar.calendars.insert() for '${newCalendarName}'`
    );
    console.log("Result:", JSON.stringify(res.data, null, 2));
    const getRes = await calendar.calendars.get({ calendarId: CALENDAR_ID });
    console.log(
      `API Call: calendar.calendars.get({ calendarId: '${CALENDAR_ID}' })`
    );
    console.log("Result (get):", JSON.stringify(getRes.data, null, 2));
    // Optionally delete:
    // await calendar.calendars.delete({ calendarId: res.data.id });
    // console.log(`Deleted created calendar: ${res.data.id}`);
  } catch (error) {
    console.error(`Error with scope ${scope}:`, error.message);
    console.error(
      "API Error Response:",
      JSON.stringify(
        error.response ? error.response.data.error : error,
        null,
        2
      )
    );
  }
}

/**
 * Tests the 'https://www.googleapis.com/auth/calendar.calendars.readonly' scope.
 */
async function testCalendarCalendarsReadonlyScope() {
  const scope = "https://www.googleapis.com/auth/calendar.calendars.readonly";
  console.log(`\n--- Testing Scope: ${scope} ---`);
  try {
    const client = await auth.getClient();
    const calendar = google.calendar({ version: "v3", auth: client });
    const res = await calendar.calendars.get({ calendarId: CALENDAR_ID });
    console.log(
      `API Call: calendar.calendars.get({ calendarId: '${CALENDAR_ID}' }) (readonly)`
    );
    console.log("Result:", JSON.stringify(res.data, null, 2));
  } catch (error) {
    console.error(`Error with scope ${scope}:`, error.message);
    console.error(
      "API Error Response:",
      JSON.stringify(
        error.response ? error.response.data.error : error,
        null,
        2
      )
    );
  }
}

/**
 * Tests the 'https://www.googleapis.com/auth/calendar.acls' scope.
 */
async function testCalendarAclsScope() {
  const scope = "https://www.googleapis.com/auth/calendar.acls";
  console.log(`\n--- Testing Scope: ${scope} ---`);
  try {
    const client = await auth.getClient();
    const calendar = google.calendar({ version: "v3", auth: client });
    const res = await calendar.acl.list({ calendarId: CALENDAR_ID });
    console.log(
      `API Call: calendar.acl.list({ calendarId: '${CALENDAR_ID}' })`
    );
    console.log(
      "Result (ACLs for calendar):",
      JSON.stringify(res.data.items, null, 2)
    );
  } catch (error) {
    console.error(`Error with scope ${scope}:`, error.message);
    console.error(
      "API Error Response:",
      JSON.stringify(
        error.response ? error.response.data.error : error,
        null,
        2
      )
    );
  }
}

/**
 * Tests the 'https://www.googleapis.com/auth/calendar.acls.readonly' scope.
 */
async function testCalendarAclsReadonlyScope() {
  const scope = "https://www.googleapis.com/auth/calendar.acls.readonly";
  console.log(`\n--- Testing Scope: ${scope} ---`);
  try {
    const client = await auth.getClient();
    const calendar = google.calendar({ version: "v3", auth: client });
    const res = await calendar.acl.list({ calendarId: CALENDAR_ID });
    console.log(
      `API Call: calendar.acl.list({ calendarId: '${CALENDAR_ID}' }) (readonly)`
    );
    console.log(
      "Result (ACLs for calendar):",
      JSON.stringify(res.data.items, null, 2)
    );
  } catch (error) {
    console.error(`Error with scope ${scope}:`, error.message);
    console.error(
      "API Error Response:",
      JSON.stringify(
        error.response ? error.response.data.error : error,
        null,
        2
      )
    );
  }
}

/**
 * Tests the 'https://www.googleapis.com/auth/calendar.events.public.readonly' scope.
 */
async function testCalendarEventsPublicReadonlyScope() {
  const scope =
    "https://www.googleapis.com/auth/calendar.events.public.readonly";
  console.log(`\n--- Testing Scope: ${scope} ---`);
  try {
    const client = await auth.getClient();
    const calendar = google.calendar({ version: "v3", auth: client });
    const res = await calendar.events.list({
      calendarId: CALENDAR_ID, // Use a known public calendar ID if available
      timeMin: new Date().toISOString(),
      maxResults: 5,
      singleEvents: true,
      orderBy: "startTime",
    });
    console.log(
      `API Call: calendar.events.list({ calendarId: '${CALENDAR_ID}' }) (public readonly)`
    );
    console.log(
      "Result (first 5 public events):",
      JSON.stringify(res.data.items.slice(0, 5), null, 2)
    );
  } catch (error) {
    console.error(`Error with scope ${scope}:`, error.message);
    console.error(
      "API Error Response:",
      JSON.stringify(
        error.response ? error.response.data.error : error,
        null,
        2
      )
    );
  }
}

// --- Main execution block to run all tests and the core logic ---
(async () => {
  console.log("Starting Google Calendar API operations and scope tests...");
  console.log(
    "Ensure your service account has all necessary permissions configured in Google Cloud Console and shared access to the CALENDAR_ID."
  );

  // --- Run all individual scope tests ---
  console.log("\n--- Running all individual scope tests ---");
  await testCalendarFullScope();
  await testCalendarReadonlyScope();
  await testCalendarFreebusyScopeOnly(); // Renamed
  await testCalendarEventsScope();
  await testCalendarEventsReadonlyScope();
  await testCalendarSettingsReadonlyScope();
  await testCalendarAddonsExecuteScope(); // No direct API call demonstration
  await testCalendarAddonsCurrentEventReadScope(); // No direct API call demonstration
  await testCalendarAddonsCurrentEventWriteScope(); // No direct API call demonstration
  await testCalendarEventsOwnedScope();
  await testCalendarEventsOwnedReadonlyScope();
  await testCalendarEventsFreebusyScope();
  await testCalendarAppCreatedScope();
  await testCalendarCalendarlistScope();
  await testCalendarCalendarlistReadonlyScope();
  await testCalendarCalendarsScope();
  await testCalendarCalendarsReadonlyScope();
  await testCalendarAclsScope();
  await testCalendarAclsReadonlyScope();
  await testCalendarEventsPublicReadonlyScope();

  // --- Core Application Logic: Find Free Time & Create Meeting ---
  console.log(
    "\n--- Starting Core Application Logic: Finding Free Time & Creating Meeting ---"
  );
  try {
    const now = new Date();
    // Set tomorrow to 9 AM
    const tomorrow = new Date();
    tomorrow.setDate(now.getDate() + 1);
    tomorrow.setHours(9, 0, 0, 0);

    // Set end of tomorrow to 5 PM
    const endOfTomorrow = new Date(tomorrow);
    endOfTomorrow.setHours(17, 0, 0, 0);

    console.log(
      `Checking availability for ${CALENDAR_ID} from ${tomorrow.toLocaleString()} to ${endOfTomorrow.toLocaleString()}`
    );

    const availableSlots = await findFreeTimeSlots(
      CALENDAR_ID,
      tomorrow,
      endOfTomorrow,
      60
    ); // Check for 60-minute slots

    if (availableSlots.length > 0) {
      console.log("\nSuggested available slots:");
      availableSlots.forEach((slot, index) => {
        console.log(
          `${
            index + 1
          }. ${slot.start.toLocaleString()} - ${slot.end.toLocaleString()}`
        );
      });

      // Simulate user selection (picking the first available slot)
      const selectedSlot = availableSlots[0];
      console.log(
        `\nSimulating user selecting: ${selectedSlot.start.toLocaleString()} - ${selectedSlot.end.toLocaleString()}`
      );

      const eventSummary = "פגישת ייעוץ אוטומטית (מאת האפליקציה)";
      const eventDescription =
        "פגישת ייעוץ שנקבעה אוטומטית על סמך זמינות היומן.";

      const { event, meetingLink } = await createCalendarEvent(
        eventSummary,
        eventDescription,
        selectedSlot.start,
        selectedSlot.end
      );

      console.log("\nMeeting successfully created!");
      if (meetingLink) {
        console.log(`שלום! נקבעה לך פגישה ביומן בכתובת: ${event.htmlLink}`);
        console.log(`קישור לפגישת הזום/Meet: ${meetingLink}`);
      } else {
        console.log(`שלום! נקבעה לך פגישה ביומן בכתובת: ${event.htmlLink}`);
        console.log(
          "לא נוצר קישור לפגישת וידאו באופן אוטומטי. ודא שתצורת ה-conferenceData נכונה ושהפתרון זמין."
        );
      }
    } else {
      console.log(
        "No available slots found in the specified range. Please try a different date or time."
      );
    }
  } catch (err) {
    console.error(
      "Failed during finding free time or creating event in core logic:",
      err
    );
  }
})();
