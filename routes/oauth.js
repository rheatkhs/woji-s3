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

/**
 * 🔐 Step 1: Redirect to Google login
 */
router.get("/oauth/login", (req, res) => {
  const url = oauth2Client.generateAuthUrl({
    access_type: "offline", // ✅ required to get refresh_token
    prompt: "consent", // ✅ force showing consent screen to ensure refresh_token
    scope: SCOPES,
  });
  res.redirect(url);
});

/**
 * 🔁 Step 2: Google callback handler
 */
router.get("/oauth/callback", async (req, res) => {
  try {
    const { tokens } = await oauth2Client.getToken(req.query.code);

    oauth2Client.setCredentials(tokens);

    const oauth2 = google.oauth2({ auth: oauth2Client, version: "v2" });
    const { data: userInfo } = await oauth2.userinfo.get();

    const accessToken = uuidv4();

    // ✅ Only update google_refresh_token if it's returned
    const updateData = {
      email: userInfo.email,
      access_token: accessToken,
      google_access_token: tokens.access_token,
    };

    if (tokens.refresh_token) {
      updateData.google_refresh_token = tokens.refresh_token;
    }

    const user = await User.findOneAndUpdate(
      { email: userInfo.email },
      updateData,
      { upsert: true, new: true }
    );

    res.json({ accessToken });
  } catch (err) {
    console.error("OAuth callback failed:", err.response?.data || err.message);
    res.status(500).json({ error: "OAuth failed" });
  }
});

module.exports = router;
