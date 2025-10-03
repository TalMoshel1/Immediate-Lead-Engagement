# Immediate-Lead-Engagement

This tool instantly reports the client's Core Web Vitals and automatically schedules a discussion via a mutual email, swiftly converting the lead into a consultation  (In Development). 
-----

This project is currently **in development**. It instantly analyzes a lead's website for **Core Web Vitals** performance and automates the scheduling of a follow-up meeting.

### ⚙️ Technology Stack

The automation leverages the following technologies:

  * **Node.js**: The primary runtime environment.
  * **Green API**: Used for communication/messaging workflows.
  * **Icalendar**: For generating and managing meeting invitation files.
  * **OpenAI**: Powers intelligent text generation or analysis (e.g., summarizing reports or drafting personalized emails).
  * **MongoDB**: The NoSQL database for data storage (e.g., lead information, reports).
  * **Luxon.js**: For robust date and time handling in scheduling.
  * **Google API**: For analyzing Core Web Vitals and Speed Insight.



-----

### 🚀 Running the Project

To run this project locally, follow these steps:

1.  **Install dependencies:**
    ```bash
    npm install
    ```
2.  **Set the API Key:** You must set your **OpenAI API Key** as an environment variable before running the application.
3.  **Execute the main file:**
    ```bash
    node index2.js
    ```
