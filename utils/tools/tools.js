
const tools = [
    {
      type: "function",
      function: {
        name: "getPageSpeedInsights",
        
        description: "Get Google PageSpeed Insights for a given URL.",
        parameters: {
          type: "object",
          properties: {
            url: { type: "string", description: "The full URL to check (including https://)" }
          },
          required: ["url"],
          additionalProperties: false
        }
      }
    },

    {
  type: "function",
  function: {
    name: "sendMeetingInvite",
    description: "Sends a meeting invitation. The start and end dates and time for the meeting, in Israel Time (IST). Requires start and end dates/times in ISO 8601 format for the Israel time zone. The meeting duration is always 30 minutes.",
    parameters: {
      type: "object",
      properties: {
        recipientEmail: {
          type: "string",
          description: "The client's email address."
        },
        startDateTime: {
          type: "string",
          description: "The meeting start date and time in ISO 8601 format for the Israel time zone (e.g., '2025-09-07T14:00:00+03:00')."
        },
        endDateTime: {
          type: "string",
          description: "The meeting end date and time in ISO 8601 format for the Israel time zone, exactly 30 minutes after the start time."
        }
      },
      required: ["recipientEmail", "startDateTime", "endDateTime"],
      additionalProperties: false
    }
  }
}
  ];

  module.exports = {tools};