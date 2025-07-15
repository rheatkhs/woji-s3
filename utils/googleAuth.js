const { google } = require("googleapis");
const User = require("../models/User");

async function getGoogleAuth(user) {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );

  oauth2Client.setCredentials({
    access_token: user.google_access_token,
    refresh_token: user.google_refresh_token,
  });

  // Automatically refresh token and save it
  oauth2Client.on("tokens", async (tokens) => {
    if (tokens.access_token) {
      user.google_access_token = tokens.access_token;
      try {
        await user.save();
        console.log("✅ Refreshed and saved Google access token");
      } catch (err) {
        console.warn("⚠️ Failed to save refreshed token:", err.message);
      }
    }
  });

  return oauth2Client;
}

module.exports = { getGoogleAuth };
