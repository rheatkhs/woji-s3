# 🪣 Woji-S3 — "Totally Not S3™" Powered by Google Drive

> Because why pay AWS when you can duct-tape Google Drive into an object store like a real dev™️

[![Built with Duct Tape](https://img.shields.io/badge/built%20with-duct%20tape-blue.svg)](#)
[![Runs on Coffee](https://img.shields.io/badge/fueled%20by-coffee-ff69b4.svg)](#)
[![License: MIT](https://img.shields.io/badge/license-MIT-yellow.svg)](#license)

This is a budget S3 clone. No EC2. No S3. No AWS bill. Just your free Google Drive account, Express, and vibes.

---

## 😎 Features

- ☕ Login with Google because we’re too lazy to build our own auth
- 📁 Buckets that are actually Drive folders but we lie to ourselves
- 🕵️‍♂️ Encrypted filenames so you feel hacker-y
- 📤 Uploads that work... mostly
- 🎬 Stream files like it's Netflix (but for PNGs)
- 🔗 Public URLs with expiration — like Snapchat, but for files
- 🧹 DELETE endpoints for when you rage quit your project

---

## 🔧 Tech (aka things I copied from StackOverflow)

- Node.js + Express.js
- Google Drive API (a blessing and a curse)
- MongoDB for "serious persistence™"
- Multer — the least painful way to upload files in Express
- OAuth2 because we love complicated flows for simple problems

---

## 📡 API Endpoints That Make You Feel Like AWS

### 🔐 Auth Stuff

| Method | Endpoint         | Does What                     |
|--------|------------------|-------------------------------|
| GET    | `/oauth/login`   | Yeets you to Google login     |
| GET    | `/oauth/callback`| Google yeets you back here    |

Returns `{ accessToken: "✨magic✨" }`

---

### 📁 Bucketology

| Method | Route                        | Meaning                        |
|--------|------------------------------|--------------------------------|
| PUT    | `/:bucketName`               | Creates a fake S3 bucket       |
| PATCH  | `/:bucketName/visibility`    | Toggles public/private drama   |
| GET    | `/:bucketName`               | Lists files like a nosy friend |
| DELETE | `/:bucketName`               | Destroys your dreams and files |

---

### 📂 File Shenanigans

| Method | Route                              | Functionality                  |
|--------|------------------------------------|--------------------------------|
| PUT    | `/:bucketName/:fileName`           | Upload file with secret name   |
| GET    | `/:bucketName/:fileName`           | Streams file like a cool kid   |
| DELETE | `/:bucketName/:fileName`           | Deletes it like an ex's photo  |

---

### 🌍 Public Internet Chaos

| Method | Route                                          | What it Does                             |
|--------|------------------------------------------------|------------------------------------------|
| POST   | `/presign/:bucketName/:fileName`              | Makes your file famous (temporarily)     |
| DELETE | `/presign/:bucketName/:fileName`              | Takes the fame away                      |
| GET    | `/public/:bucketName/:fileName`               | Anyone can see it (S3-style 🔓)          |

📝 Add `?token=xyz` for private links  
📥 Add `?download=true` if you're too good to stream

---

## 🛠 How to Run This Masterpiece

### 1. Clone the repo like a hacker:

```bash
git clone https://github.com/your-name/woji-s3.git
cd woji-s3
```

### 2. Install chaos:

```bash
npm install
```

### 3. Setup your secret `.env`:

```env
PORT=8000
MONGODB_URI=mongodb://localhost:27017/woji-s3

GOOGLE_CLIENT_ID=google-scammed-you
GOOGLE_CLIENT_SECRET=top-secret
GOOGLE_REDIRECT_URI=http://localhost:8000/oauth/callback
```

### 4. Start the beast:

```bash
npm run dev
```

Or if you like living dangerously:

```bash
node index.js
```

---

## 🚀 Quickstart (aka copy/paste until it works)

1. Open browser → `http://localhost:8000/oauth/login`
2. Login with Google → get `accessToken`
3. Make API calls like a pro:
   ```http
   Authorization: Bearer your-token
   ```

---

## 📂 File Tree (100% hand-crafted)

```
.
├── routes/
│   ├── file.js         // all your bucket dreams
│   └── oauth.js        // where the Google magic happens
├── models/
│   ├── Bucket.js
│   ├── File.js
│   └── User.js
├── services/
│   └── drive.js        // how the files get into Drive 🪄
├── utils/
│   ├── googleAuth.js   // auto-refresh fairy
│   └── filename.js     // encryption voodoo
├── middlewares/
│   └── auth.js         // bearer of tokens
├── uploads/            // temporary chaos
├── index.js
└── .env
```

---

## 🧠 Future "Definitely Not Promises"

- 🧊 File versioning like Git, but worse
- 🗑 Trash can for when you accidentally delete `final_final_v2_REAL.png`
- 🎨 Admin panel for your inner UI designer
- 🛡 Token expiration timers that actually expire
- 📊 Analytics for bragging to your team

---

## 📄 License

Because someone told me to.

```
MIT License

Copyright (c) 2025

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

---

## 🧼 Final Thoughts

If AWS S3 and Google Drive had a child raised by Node.js devs with caffeine addiction, this would be it.

PRs welcome. Bugs expected. Fun guaranteed. 🎉
