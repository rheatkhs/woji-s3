const path = require("path");
const crypto = require("crypto");

function generateEncryptedFileName(originalName) {
  const ext = path.extname(originalName);
  const random = crypto.randomBytes(16).toString("hex");
  return `${random}${ext}`;
}

module.exports = { generateEncryptedFileName };
