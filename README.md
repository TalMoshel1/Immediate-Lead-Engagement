# 🚀 Immediate-Lead-Engagement

**Status:** 🧩 *Under Development*

## 📖 Overview

**Immediate-Lead-Engagement** is a Node.js-based backend that creates **instant, intelligent engagement** with users who submit their details on a website.

When a visitor provides their **name** and **phone number**, the system automatically:

1. **Analyzes the user’s website performance** using the **Google PageSpeed Insights API**.
2. **Summarizes the results** through **OpenAI** for clear, conversational output.
3. **Sends the report instantly** to the user via **GreenAPI (WhatsApp integration)**.
4. **Invites the user to schedule a meeting**, generating an **iCalendar (.ics)** event file and sharing it with both parties.
5. **Logs all user interactions and details** in **MongoDB** for further analysis and follow-up.

---

## 🧠 Purpose

> *To turn every lead submission into a real-time interaction — giving immediate value, building trust, and scheduling meetings automatically.*

Instead of waiting for manual follow-up, users receive instant engagement that shows care and professionalism from the very first contact.

---

## 🏗️ Tech Stack

| Technology                 | Purpose                                    |
| -------------------------- | ------------------------------------------ |
| **Node.js / Express**      | Backend server                             |
| **MongoDB**                | User and interaction storage               |
| **GreenAPI**               | WhatsApp messaging integration             |
| **OpenAI API**             | Dynamic message generation & summarization |
| **PageSpeed Insights API** | Website performance analysis               |
| **iCalendar (ics)**        | Calendar event creation                    |

---

## ⚙️ How It Works

1. **User Submission (Frontend)**

   * The user submits their **name**, **phone number**, and optionally their **website URL**.

2. **Instant Response (Backend)**

   * The backend uses the **PageSpeed Insights API** to analyze the user’s site.
   * **OpenAI** summarizes the performance results in friendly, understandable language.
   * The message is sent via **WhatsApp** using **GreenAPI**.

3. **Meeting Scheduling**

   * The system asks the user to choose a preferred meeting time.
   * Once confirmed, an **.ics calendar invite** is created using the **iCalendar** library and sent to both the user and the business owner.

4. **Data Storage**

   * All user details and conversation data are stored securely in **MongoDB**.
   * This allows for insights into engagement rates and lead quality.

---


## 🔧 Installation & Setup

1. **Clone the repository**

   ```bash
   git clone https://github.com/<your-username>/Immediate-Lead-Engagement.git
   cd Immediate-Lead-Engagement
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env` file:

   ```bash
   OPENAI_KEY
   OPENAI_ORGANIZATION_ID
   MONGODB_URI
   idInstance, apiTokenInstance (for whatsappClient.restAPI)
   ```

4. **Run the project**

   ```bash
   node index2.js
   ```

---

## 🧪 Example Flow

1. User submits:

   ```
   Name: John Doe  
   Phone: +1234567890  
   Website: johndoe.com
   ```

2. System performs:

   * PageSpeed test
   * AI-based summary
   * WhatsApp message delivery

3. Example message:

   ```
   Hey John 👋  
   We just analyzed johndoe.com — your PageSpeed score is 91/100 🚀  
   Would you like to schedule a quick meeting to discuss how we can optimize it further?
   ```

4. Once confirmed, the system generates and sends a **calendar invite** automatically.

---

## 🧩 Current Status

✅ Fully working features:

* Real-time PageSpeed Insights integration
* AI-powered summary and WhatsApp message delivery
* Automatic meeting scheduling via iCalendar
* MongoDB-based user interaction storage

🧩 *Still under development:*

* UI enhancements and business dashboard for analytics
* Multi-language support
* Advanced personalization and follow-up automation

---

## 🤝 Contributing

Contributions and ideas are welcome.
Please open an issue or submit a pull request to propose changes or improvements.
