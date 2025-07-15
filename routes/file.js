const express = require("express");
const fs = require("fs");
const multer = require("multer");
const { google } = require("googleapis");

const Bucket = require("../models/Bucket");
const File = require("../models/File");
const auth = require("../middlewares/auth");
const { uploadToDrive } = require("../services/drive");
const { generateEncryptedFileName } = require("../utils/filename");

const router = express.Router();
const upload = multer({ dest: "uploads/" });

/**
 * Create a new bucket (S3-style: PUT /:bucketName)
 */
router.put("/:bucketName", auth, async (req, res) => {
  const { bucketName } = req.params;

  const exists = await Bucket.findOne({ name: bucketName, user: req.user._id });
  if (exists) return res.status(400).json({ error: "Bucket already exists" });

  const authClient = new google.auth.OAuth2();
  authClient.setCredentials({ access_token: req.user.google_access_token });
  const drive = google.drive({ version: "v3", auth: authClient });

  try {
    const folder = await drive.files.create({
      requestBody: {
        name: bucketName,
        mimeType: "application/vnd.google-apps.folder",
      },
      fields: "id",
    });

    const bucket = await Bucket.create({
      name: bucketName,
      user: req.user._id,
      drive_folder_id: folder.data.id,
    });

    res.status(201).json({ message: "Bucket created", id: bucket._id });
  } catch (err) {
    console.error("Create bucket failed:", err);
    res.status(500).json({ error: "Failed to create bucket" });
  }
});

/**
 * Upload a file to bucket (S3-style: PUT /:bucketName/:fileName)
 */
router.put(
  "/:bucketName/:fileName",
  auth,
  upload.single("file"),
  async (req, res) => {
    const { bucketName, fileName } = req.params;

    const bucket = await Bucket.findOne({
      name: bucketName,
      user: req.user._id,
    });
    if (!bucket) return res.status(404).json({ error: "Bucket not found" });

    const { path: filePath, mimetype, originalname } = req.file;
    const encryptedName = generateEncryptedFileName(fileName || originalname);

    try {
      const uploaded = await uploadToDrive(
        filePath,
        encryptedName,
        mimetype,
        req.user.google_access_token,
        bucket.drive_folder_id
      );

      await File.create({
        user: req.user._id,
        drive_file_id: uploaded.id,
        file_name: encryptedName,
        original_file_name: originalname,
        mime_type: mimetype,
        bucket: bucket._id,
      });

      fs.unlinkSync(filePath);
      res.status(200).json({ id: uploaded.id, name: encryptedName });
    } catch (err) {
      console.error("Upload failed:", err);
      res.status(500).json({ error: "Upload failed" });
    }
  }
);

/**
 * Stream/download a file (S3-style: GET /:bucketName/:fileName)
 */
router.get("/:bucketName/:fileName", auth, async (req, res) => {
  const { bucketName, fileName } = req.params;

  const bucket = await Bucket.findOne({ name: bucketName, user: req.user._id });
  if (!bucket) return res.status(404).json({ error: "Bucket not found" });

  const file = await File.findOne({
    file_name: fileName,
    user: req.user._id,
    bucket: bucket._id,
  });

  if (!file) return res.status(404).json({ error: "File not found in bucket" });

  const authClient = new google.auth.OAuth2();
  authClient.setCredentials({ access_token: req.user.google_access_token });
  const drive = google.drive({ version: "v3", auth: authClient });

  try {
    const response = await drive.files.get(
      { fileId: file.drive_file_id, alt: "media" },
      { responseType: "stream" }
    );

    res.setHeader("Content-Type", file.mime_type);
    res.setHeader(
      "Content-Disposition",
      `inline; filename="${file.original_file_name}"`
    );
    response.data.pipe(res);
  } catch (err) {
    console.error("Stream failed:", err.message);
    res.status(500).json({ error: "Stream failed" });
  }
});

/**
 * List all files in a bucket (S3-style: GET /:bucketName)
 */
router.get("/:bucketName", auth, async (req, res) => {
  const { bucketName } = req.params;

  const bucket = await Bucket.findOne({ name: bucketName, user: req.user._id });
  if (!bucket) return res.status(404).json({ error: "Bucket not found" });

  const files = await File.find({ bucket: bucket._id }).select("-__v -user");
  res.json({ bucket: bucket.name, files });
});

module.exports = router;
