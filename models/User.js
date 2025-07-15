const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  email: { type: String, unique: true },
  access_token: String,
  google_access_token: String,
  google_refresh_token: String,
});

module.exports = mongoose.model("User", userSchema);
