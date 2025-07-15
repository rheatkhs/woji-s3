const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const auth = require("./middlewares/auth");
const oauthRoutes = require("./routes/oauth");
const fileRoutes = require("./routes/file");

dotenv.config();
const app = express();
const upload = multer({ dest: "uploads/" });

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ MongoDB connection failed:", err));

app.use(express.json());
app.use("/", oauthRoutes);
app.use("/", fileRoutes);

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
