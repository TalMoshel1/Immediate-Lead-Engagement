const { GreenApiClient } = require("@green-api/whatsapp-api-client-js-v2");
const dotenv = require("dotenv");
const passport = require("passport"); // Use require for passport
const GoogleStrategy = require("passport-google-oauth2").Strategy; // Require Strategy directly
require("./auth.js"); // Use require for local files
const express = require("express"); // Use require for express
const app = express();

const port = process.env.PORT || 3001;

dotenv.config();

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;

passport.use(
  new GoogleStrategy(
    {
      clientID: GOOGLE_CLIENT_ID,
      clientSecret: GOOGLE_CLIENT_SECRET,
      callbackURL: "http://localhost:3001/google/callback",
      passReqToCallback: true,
    },
    function (
      // request,
      accessToken,
      refreshToken,
      profile,
      done
    ) {
      console.log("profile: ", profile);
      return done(null, profile);

      //   return done(err, profile);
    }
  )
);

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

function isLoggedIn(req, res, next) {
  req.res ? next() : res.sendStatus(401);
}

app.get("/", (req, res) => {
  res.send('<a href="/auth/google">Authentication with Google</a>');
});

app.get("/protected", isLoggedIn, (req, res) => {
  res.send("hello");
});

app.get(
  "/auth/google",
  passport.authenticate("google", { scope: ["email", "profile"] })
);

app.get(
  "/google/callback",
  passport.authenticate("google", {
    successRedirect: "/protected",
    failureRedirect: "/auth/failure",
  })
);

app.get("/auth/failure", (req, res) => {
  res.send("something went wrong");
});

const apiTokenInstance = process.env.apiTokenInstance;
const idInstance = process.env.idInstance;

const client = new GreenApiClient({
  idInstance: idInstance,
  apiTokenInstance: apiTokenInstance,
});


(async () => {
  await client.sendMessage({
    chatId: "972522233573@c.us",
    message: "הודעה חדשה!",
  });
})();

passport.serializeUser(function (user, done) {
  done(null, user);
});

passport.deserializeUser(function (user, done) {
  done(null, user);
});