const { google } = require("googleapis");
const fs = require("fs");

function getDrive(accessToken) {
  const auth = new google.auth.OAuth2();
  auth.setCredentials({ access_token: accessToken });
  return google.drive({ version: "v3", auth });
}

async function uploadToDrive(
  path,
  filename,
  mimeType,
  accessToken,
  folderId = null
) {
  const drive = getDrive(accessToken);

  const metadata = {
    name: filename,
    ...(folderId && { parents: [folderId] }),
  };

  const media = {
    body: fs.createReadStream(path),
    mimeType,
  };

  const res = await drive.files.create({
    requestBody: metadata,
    media,
    fields: "id, name",
  });

  return res.data;
}

async function downloadFromDrive(fileId, accessToken) {
  const drive = getDrive(accessToken);
  const res = await drive.files.get(
    { fileId, alt: "media" },
    { responseType: "stream" }
  );
  return res.data;
}

module.exports = { uploadToDrive, downloadFromDrive };
