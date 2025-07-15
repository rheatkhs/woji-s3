const express = require("express");
const { google } = require("googleapis");
const { v4: uuidv4 } = require("uuid");
const User = require("../models/User");
require("dotenv").config();

const router = express.Router();

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

const SCOPES = [
  "https://www.googleapis.com/auth/drive.file",
  "openid",
  "email",
  "profile",
];

router.get("/oauth/login", (req, res) => {
  const url = oauth2Client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: SCOPES,
  });
  res.redirect(url);
});

router.get("/oauth/callback", async (req, res) => {
  try {
    const { tokens } = await oauth2Client.getToken(req.query.code);
    oauth2Client.setCredentials(tokens);

    const oauth2 = google.oauth2({ auth: oauth2Client, version: "v2" });
    const { data: userInfo } = await oauth2.userinfo.get();

    const accessToken = uuidv4();
    const user = await User.findOneAndUpdate(
      { email: userInfo.email },
      {
        email: userInfo.email,
        access_token: accessToken,
        google_access_token: tokens.access_token,
        google_refresh_token: tokens.refresh_token,
      },
      { upsert: true, new: true }
    );

    res.json({ accessToken });
  } catch (err) {
    console.error("OAuth error:", err);
    res.status(500).json({ error: "OAuth failed" });
  }
});

module.exports = router;
