const mongoose = require("mongoose");

const fileSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  bucket: { type: mongoose.Schema.Types.ObjectId, ref: "Bucket" },
  drive_file_id: String,
  file_name: String,
  mime_type: String,
  created_at: { type: Date, default: Date.now },
});

module.exports = mongoose.model("File", fileSchema);
