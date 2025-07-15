# 🪣 Woji-S3 — Google Drive-Powered Object Storage (S3-Style)

[![Node.js](https://img.shields.io/badge/Node.js-18.x-green.svg)](https://nodejs.org)
[![Express](https://img.shields.io/badge/Express.js-lightgrey.svg)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-green)](https://www.mongodb.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](#license)

Woji-S3 is an open-source object storage API built with **Node.js**, **Express**, and **Google Drive**. It mirrors the behavior of AWS S3 — allowing you to create custom buckets, upload encrypted files, stream them, and generate pre-signed public URLs.

---

## ✨ Features

- ✅ OAuth 2.0 login with Google
- 📂 S3-style buckets using Google Drive folders
- 🔒 Authenticated file uploads with encrypted names
- 📥 File streaming & downloading
- 🔗 Pre-signed URLs with expiration
- 🌐 Public buckets (no token required)
- 🗑️ Full file & bucket deletion
- 💾 MongoDB backend for metadata

---

## 📦 Tech Stack

- **Node.js + Express.js**
- **MongoDB (via Mongoose)**
- **Google Drive API**
- **OAuth 2.0** (access & refresh tokens)
- **Multer** for file upload middleware

---

## 🧪 API Endpoints Overview

### 🔐 Auth

| Method | Endpoint         | Description                    |
|--------|------------------|--------------------------------|
| GET    | `/oauth/login`   | Redirect to Google login       |
| GET    | `/oauth/callback`| Handle OAuth callback          |

---

### 📁 Bucket Management

| Method | Endpoint                        | Description                        |
|--------|----------------------------------|------------------------------------|
| PUT    | `/:bucketName`                   | Create a new bucket                |
| PATCH  | `/:bucketName/visibility`        | Make bucket public or private      |
| GET    | `/:bucketName`                   | List all files in the bucket       |
| DELETE | `/:bucketName`                   | Delete a bucket and its files      |

---

### 📂 File Operations

| Method | Endpoint                            | Description                       |
|--------|--------------------------------------|-----------------------------------|
| PUT    | `/:bucketName/:fileName`            | Upload file to bucket             |
| GET    | `/:bucketName/:fileName`            | Stream/download private file      |
| DELETE | `/:bucketName/:fileName`            | Delete file from Drive + MongoDB  |

---

### 🌍 Public Access

| Method | Endpoint                                         | Description                                 |
|--------|--------------------------------------------------|---------------------------------------------|
| POST   | `/presign/:bucketName/:fileName`                | Generate a pre-signed public download link  |
| DELETE | `/presign/:bucketName/:fileName`                | Revoke public token                         |
| GET    | `/public/:bucketName/:fileName?token=xxx`       | Public access to file (with or without token) |

- Add `?download=true` to force file download
- If the bucket is public, token is not required

---

## 🛠️ Installation & Setup

### 1. Clone the repo

```bash
git clone https://github.com/rheatkhs/woji-s3.git
cd woji-s3
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create a `.env` file:

```env
PORT=8000
MONGODB_URI=your-mongodb-uri

GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=http://localhost:8000/oauth/callback
```

### 4. Start the development server

```bash
npm run dev
```

Or to run in production:

```bash
node index.js
```

---

## 🧾 Example Workflow

1. **Login using Google**  
   Visit: `http://localhost:8000/oauth/login`  
   You’ll be redirected to Google, and get back an `accessToken`.

2. **Use the access token in requests:**  
   All private routes require:

   ```
   Authorization: Bearer <accessToken>
   ```

3. **Create a bucket:**

```http
PUT /my-bucket-name
```

4. **Upload a file:**

```http
PUT /my-bucket-name/myfile.png
Content-Type: multipart/form-data
Authorization: Bearer <accessToken>
```

5. **Download the file (private):**

```http
GET /my-bucket-name/myfile.png
Authorization: Bearer <accessToken>
```

6. **Generate public pre-signed link:**

```http
POST /presign/my-bucket-name/myfile.png
Authorization: Bearer <accessToken>
```

Response:

```json
{
  "url": "http://localhost:8000/public/my-bucket-name/myfile.png?token=abc123",
  "expires_at": "2030-01-01T00:00:00Z"
}
```

7. **Mark entire bucket as public:**

```http
PATCH /my-bucket-name/visibility
Authorization: Bearer <accessToken>
Content-Type: application/json

{
  "public": true
}
```

8. **Stream or download public file (no auth):**

```http
GET /public/my-bucket-name/myfile.png
```

Optionally force download:

```
GET /public/my-bucket-name/myfile.png?download=true
```

---

## 📂 Folder Structure

```
.
├── routes/
│   ├── file.js           # All bucket and file operations
│   └── oauth.js          # Google OAuth 2.0 auth
├── models/
│   ├── Bucket.js
│   ├── File.js
│   └── User.js
├── middlewares/
│   └── auth.js           # Bearer token authentication
├── services/
│   └── drive.js          # Google Drive API uploader
├── utils/
│   ├── filename.js       # Encrypted filename generator
│   └── googleAuth.js     # Refresh token handler
├── uploads/              # Temp upload directory
├── .env
├── index.js
└── package.json
```

---

## 🧠 Future Ideas

- JWT-based sessions
- Admin dashboard
- Soft-deletes & recovery
- File access analytics
- Multi-user permissions

---

## 📄 License

MIT License

```
MIT License

Permission is hereby granted, free of charge, to any person obtaining a copy  
of this software and associated documentation files (the "Software"), to deal  
in the Software without restriction, including without limitation the rights  
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell  
copies of the Software, and to permit persons to whom the Software is  
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in  
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR  
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,  
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE  
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER  
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,  
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN  
THE SOFTWARE.
```