const express = require("express");
const router = express.Router();
const { google } = require("googleapis");

const auth = require("../middlewares/auth");
const Bucket = require("../models/Bucket");

router.post("/buckets", auth, async (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: "Bucket name required" });

  const authClient = new google.auth.OAuth2();
  authClient.setCredentials({ access_token: req.user.google_access_token });
  const drive = google.drive({ version: "v3", auth: authClient });

  try {
    const folderMetadata = {
      name,
      mimeType: "application/vnd.google-apps.folder",
    };

    const folder = await drive.files.create({
      requestBody: folderMetadata,
      fields: "id, name",
    });

    const bucket = await Bucket.create({
      name,
      drive_folder_id: folder.data.id,
      user: req.user._id,
    });

    res.json(bucket);
  } catch (err) {
    console.error("Create bucket failed:", err);
    res.status(500).json({ error: "Bucket creation failed" });
  }
});

router.get("/buckets", auth, async (req, res) => {
  const buckets = await Bucket.find({ user: req.user._id });
  res.json(buckets);
});

module.exports = router;
