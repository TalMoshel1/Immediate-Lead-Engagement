require("dotenv").config();

const express = require("express");
const passport = require("passport");
const session = require("express-session");
const GoogleStrategy = require("passport-google-oauth2").Strategy;
const { google } = require("googleapis");
const bodyParser = require("body-parser");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(
  session({
    secret: process.env.SESSION_SECRET || "a_very_secret_key_for_sessions", // שנה את זה במערכת יצור
    resave: false,
    saveUninitialized: true,
  })
);
app.use(passport.initialize());
app.use(passport.session());

/* 
Unlike user accounts, service accounts don't have passwords.
Instead, service accounts use RSA key pairs for authentication.
If you know the private key of a service account's key pair,
you can use the private key to create a JWT bearer token and use the bearer token to request an access token. 
The resulting access token reflects the service account's
identity and you can use it to interact with Google Cloud APIs on the service account's behalf.
*/

// --- הגדרות Passport.js לאימות מול Google ---
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "/auth/google/callback",
      passReqToCallback: true, // חשוב עבור passport-google-oauth2 כדי לקבל את ה-req
    },
    function (request, accessToken, refreshToken, profile, done) {
      // כאן תוכל לשמור את ה-accessToken, refreshToken (אם קיים), ופרטי המשתמש במסד נתונים
      // לצורך הדוגמה, נחזיר את המשתמש עם הטוקנים שלו.
      // חשוב: במערכת אמיתית, יש לשמור את ה-refreshToken באופן מאובטח אם תרצה לבצע פעולות מאוחר יותר ללא אימות מחדש.
      const user = {
        id: profile.id,
        name: profile.displayName,
        email: profile.emails[0].value,
        accessToken: accessToken,
        refreshToken: refreshToken, // יכול להיות undefined בפעם הראשונה
      };
      return done(null, user);
    }
  )
);

passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((user, done) => {
  done(null, user);
});

// --- מסלולי אימות Google OAuth2 ---

// מסלול להתחלת תהליך האימות
app.get(
  "/auth/google",
  passport.authenticate("google", {
    scope: [
      "profile",
      "email",
      "https://www.googleapis.com/auth/calendar.events",
    ], // בקש הרשאות ליומן
    accessType: "offline", // חשוב לקבל refreshToken
    prompt: "consent", // כדי לוודא קבלת refreshToken
  })
);

// מסלול חזרה לאחר אימות מוצלח
app.get(
  "/auth/google/callback",
  passport.authenticate("google", { failureRedirect: "/login-failed" }),
  (req, res) => {
    // אימות הצליח, המשתמש נמצא ב-req.user
    res.send(`<h1>Authentication successful!</h1><p>Welcome, ${
      req.user.name
    }!</p>
        <p>You can now send a POST request to /add-calendar-event with event details.</p>
        <form action="/add-calendar-event" method="POST">
            <label for="summary">Event Summary:</label><br>
            <input type="text" id="summary" name="summary" value="My Awesome Event"><br>
            <label for="description">Description:</label><br>
            <textarea id="description" name="description">This is a test event from my Node.js app.</textarea><br>
            <label for="start">Start Time (YYYY-MM-DDTHH:MM:SS):</label><br>
            <input type="datetime-local" id="start" name="start" value="${new Date()
              .toISOString()
              .slice(0, 16)}"><br>
            <label for="end">End Time (YYYY-MM-DDTHH:MM:SS):</label><br>
            <input type="datetime-local" id="end" name="end" value="${new Date(
              Date.now() + 3600000
            )
              .toISOString()
              .slice(0, 16)}"><br><br>
            <input type="submit" value="Add Event to Calendar">
        </form>
        `);
  }
);

app.get("/login-failed", (req, res) => {
  res.send("<h1>Authentication failed!</h1><p>Please try again.</p>");
});

// --- מסלול הוספת אירוע ליומן ---

// פונקציית Middleware לוודא שהמשתמש מחובר
function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect("/auth/google"); // אם לא מחובר, הפנה לאימות
}

app.post("/add-calendar-event", ensureAuthenticated, async (req, res) => {
  const { summary, description, start, end } = req.body;
  const user = req.user;

  if (!summary || !start || !end) {
    return res
      .status(400)
      .send(
        "Missing required event details: summary, start, and end are required."
      );
  }

  try {
    const oAuth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI ||
        "http://localhost:3000/auth/google/callback" // צריך להיות ה-callbackURL שהגדרתם ב-Google API Console
    );

    // הגדרת הטוקנים שהתקבלו במהלך האימות
    oAuth2Client.setCredentials({
      access_token: user.accessToken,
      refresh_token: user.refreshToken, // אם קיים, חשוב לשימוש חוזר
    });

    // יצירת קליינט ל-Google Calendar API
    const calendar = google.calendar({ version: "v3", auth: oAuth2Client });

    const event = {
      summary: summary,
      description: description,
      start: {
        dateTime: new Date(start).toISOString(),
        timeZone: "Asia/Jerusalem", // או Timezone רלוונטי אחר
      },
      end: {
        dateTime: new Date(end).toISOString(),
        timeZone: "Asia/Jerusalem", // או Timezone רלוונטי אחר
      },
    };

    const response = await calendar.events.insert({
      calendarId: "primary", // 'primary' מתייחס ליומן הראשי של המשתמש
      resource: event,
    });

    res.status(200).json({
      message: "Event added to Google Calendar successfully!",
      eventId: response.data.id,
      htmlLink: response.data.htmlLink,
    });
  } catch (error) {
    console.error("Error adding event to Google Calendar:", error.message);
    // טיפול במקרה של expired token - ניתן להשתמש ב-refreshToken
    if (
      error.code === 401 ||
      (error.errors && error.errors[0].reason === "authError")
    ) {
      return res
        .status(401)
        .send(
          'Authentication error. Please re-authenticate. <a href="/auth/google">Login with Google</a>'
        );
    }
    res
      .status(500)
      .send(
        "Failed to add event to Google Calendar. Please check server logs."
      );
  }
});

// מסלול בית (Home)
app.get("/", (req, res) => {
  if (req.isAuthenticated()) {
    res.send(`<h1>Hello, ${req.user.name}!</h1>
        <p><a href="/auth/google">Re-authenticate with Google (e.g., to refresh tokens)</a></p>
        <p>You are authenticated. You can now send a POST request to /add-calendar-event with event details.</p>
        <form action="/add-calendar-event" method="POST">
            <label for="summary">Event Summary:</label><br>
            <input type="text" id="summary" name="summary" value="My Awesome Event"><br>
            <label for="description">Description:</label><br>
            <textarea id="description" name="description">This is a test event from my Node.js app.</textarea><br>
            <label for="start">Start Time (YYYY-MM-DDTHH:MM:SS):</label><br>
            <input type="datetime-local" id="start" name="start" value="${new Date()
              .toISOString()
              .slice(0, 16)}"><br>
            <label for="end">End Time (YYYY-MM-DDTHH:MM:SS):</label><br>
            <input type="datetime-local" id="end" name="end" value="${new Date(
              Date.now() + 3600000
            )
              .toISOString()
              .slice(0, 16)}"><br><br>
            <input type="submit" value="Add Event to Calendar">
        </form>
        `);
  } else {
    res.send(
      `<h1>Welcome!</h1><p>Please <a href="/auth/google">Login with Google</a> to add events to your calendar.</p>`
    );
  }
});

// הפעלת השרת
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  console.log(`Open http://localhost:${PORT} in your browser to start.`);
});
