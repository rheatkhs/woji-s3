const crypto = require("crypto");
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
 * Create a new bucket (PUT /:bucketName)
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
 * Delete a bucket (DELETE /:bucketName)
 */
router.delete("/:bucketName", auth, async (req, res) => {
  const { bucketName } = req.params;

  try {
    // Step 1: Find the bucket
    const bucket = await Bucket.findOne({
      name: bucketName,
      user: req.user._id,
    });
    if (!bucket) return res.status(404).json({ error: "Bucket not found" });

    const authClient = new google.auth.OAuth2();
    authClient.setCredentials({ access_token: req.user.google_access_token });
    const drive = google.drive({ version: "v3", auth: authClient });

    // Step 2: Find all files in the bucket
    const files = await File.find({ bucket: bucket._id });

    // Step 3: Delete each file from Google Drive
    for (const file of files) {
      try {
        await drive.files.delete({ fileId: file.drive_file_id });
      } catch (err) {
        console.warn(
          `Failed to delete file ${file.file_name} from Drive:`,
          err.message
        );
      }
    }

    // Step 4: Delete the folder itself
    try {
      await drive.files.delete({ fileId: bucket.drive_folder_id });
    } catch (err) {
      console.warn(`Failed to delete bucket folder from Drive:`, err.message);
    }

    // Step 5: Remove all file documents
    await File.deleteMany({ bucket: bucket._id });

    // Step 6: Remove the bucket document
    await bucket.deleteOne();

    res.json({
      message: `Bucket '${bucketName}' and all its files have been deleted.`,
    });
  } catch (err) {
    console.error("Bucket delete error:", err.message);
    res.status(500).json({ error: "Failed to delete bucket" });
  }
});

/**
 * Upload a file (PUT /:bucketName/:fileName)
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
 * Stream/download file (GET /:bucketName/:fileName)
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
      `inline; filename="${file.original_file_name || file.file_name}"`
    );
    response.data.pipe(res);
  } catch (err) {
    console.error("Stream failed:", err.message);
    res.status(500).json({ error: "Stream failed" });
  }
});

/**
 * Delete files in bucket (DELETE /:bucketName/:fileName)
 */
router.delete("/:bucketName/:fileName", auth, async (req, res) => {
  const { bucketName, fileName } = req.params;

  try {
    // Find the bucket
    const bucket = await Bucket.findOne({
      name: bucketName,
      user: req.user._id,
    });
    if (!bucket) return res.status(404).json({ error: "Bucket not found" });

    // Find the file in the bucket
    const file = await File.findOne({
      file_name: fileName,
      user: req.user._id,
      bucket: bucket._id,
    });
    if (!file) return res.status(404).json({ error: "File not found" });

    // Delete file from Google Drive
    const authClient = new google.auth.OAuth2();
    authClient.setCredentials({ access_token: req.user.google_access_token });
    const drive = google.drive({ version: "v3", auth: authClient });

    await drive.files.delete({
      fileId: file.drive_file_id,
    });

    // Remove file from MongoDB
    await file.deleteOne();

    res.json({ message: "File deleted successfully" });
  } catch (err) {
    console.error("Delete file error:", err.message);
    res.status(500).json({ error: "Failed to delete file" });
  }
});

/**
 * List files in bucket (GET /:bucketName)
 */
router.get("/:bucketName", auth, async (req, res) => {
  const { bucketName } = req.params;

  const bucket = await Bucket.findOne({ name: bucketName, user: req.user._id });
  if (!bucket) return res.status(404).json({ error: "Bucket not found" });

  const files = await File.find({ bucket: bucket._id }).select("-__v -user");
  res.json({ bucket: bucket.name, files });
});

/**
 * Generate token (internal use)
 */
function generateToken() {
  return crypto.randomBytes(24).toString("hex");
}

/**
 * Generate public pre-signed URL (POST /presign/:bucketName/:fileName)
 */
router.post("/presign/:bucketName/:fileName", auth, async (req, res) => {
  const { bucketName, fileName } = req.params;

  try {
    const bucket = await Bucket.findOne({
      name: bucketName,
      user: req.user._id,
    });
    if (!bucket) return res.status(404).json({ error: "Bucket not found" });

    const file = await File.findOne({
      file_name: fileName,
      user: req.user._id,
      bucket: bucket._id,
    });

    if (!file) return res.status(404).json({ error: "File not found" });

    const token = generateToken();
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 365 * 5); // 5 years

    file.public_token = token;
    file.expires_at = expiresAt;
    await file.save();

    const url = `${req.protocol}://${req.get(
      "host"
    )}/public/${bucketName}/${fileName}?token=${token}`;
    res.json({ url, expires_at: expiresAt.toISOString() });
  } catch (err) {
    console.error("Presign error:", err);
    res.status(500).json({ error: "Failed to generate presigned URL" });
  }
});

/**
 * Access file with public token (GET /public/:bucketName/:fileName?token=xxx)
 */
router.get("/public/:bucketName/:fileName", async (req, res) => {
  const { bucketName, fileName } = req.params;
  const { token, download } = req.query;

  if (!token) return res.status(401).json({ error: "Missing token" });

  try {
    const bucket = await Bucket.findOne({ name: bucketName });
    if (!bucket) return res.status(404).json({ error: "Bucket not found" });

    const file = await File.findOne({
      file_name: fileName,
      bucket: bucket._id,
      public_token: token,
    }).populate("user");

    if (!file) {
      console.warn("🔒 Public token lookup failed", {
        bucketName,
        fileName,
        token,
      });
      return res.status(404).json({ error: "File not found or token invalid" });
    }

    if (file.expires_at && new Date() > file.expires_at) {
      return res.status(403).json({ error: "Token expired" });
    }

    const authClient = new google.auth.OAuth2();
    authClient.setCredentials({ access_token: file.user.google_access_token });
    const drive = google.drive({ version: "v3", auth: authClient });

    const response = await drive.files.get(
      { fileId: file.drive_file_id, alt: "media" },
      { responseType: "stream" }
    );

    res.setHeader("Content-Type", file.mime_type);
    res.setHeader(
      "Content-Disposition",
      download === "true"
        ? `attachment; filename="${file.original_file_name}"`
        : `inline; filename="${file.original_file_name}"`
    );

    response.data.pipe(res);
  } catch (err) {
    console.error("Public download failed:", err.message);
    res.status(500).json({ error: "Streaming failed" });
  }
});

router.delete("/presign/:bucketName/:fileName", auth, async (req, res) => {
  const { bucketName, fileName } = req.params;

  try {
    const bucket = await Bucket.findOne({
      name: bucketName,
      user: req.user._id,
    });
    if (!bucket) return res.status(404).json({ error: "Bucket not found" });

    const file = await File.findOne({
      file_name: fileName,
      user: req.user._id,
      bucket: bucket._id,
    });

    if (!file || !file.public_token) {
      return res.status(404).json({ error: "No active token for this file" });
    }

    file.public_token = null;
    file.expires_at = null;
    await file.save();

    res.json({ message: "Public token revoked successfully" });
  } catch (err) {
    console.error("Revoke token error:", err);
    res.status(500).json({ error: "Failed to revoke token" });
  }
});

module.exports = router;
