const mongoose = require("mongoose");

const fileSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  bucket: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Bucket",
    required: true,
  },
  drive_file_id: { type: String, required: true },
  file_name: { type: String, required: true }, // encrypted file name
  original_file_name: { type: String }, // optional, used for display
  mime_type: { type: String },
  public_token: { type: String }, // 🔑 pre-signed access token
  expires_at: { type: Date }, // ⏳ token expiration
  created_at: { type: Date, default: Date.now },
});

module.exports = mongoose.model("File", fileSchema);
