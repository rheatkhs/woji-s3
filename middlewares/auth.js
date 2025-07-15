const User = require("../models/User");

async function auth(req, res, next) {
  const token = req.headers.authorization?.replace("Bearer ", "");
  if (!token) return res.status(401).json({ error: "Missing token" });

  const user = await User.findOne({ access_token: token });
  if (!user) return res.status(401).json({ error: "Invalid token" });

  req.user = user;
  next();
}

module.exports = auth;
