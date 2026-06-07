# QA Engineer Portfolio — Setup Guide

## 📁 Project Structure

```
portfolio/
├── public/
│   └── index.html        ← Your animated portfolio (copy here)
├── server.js             ← Node.js backend
├── package.json
├── .env                  ← Your secrets (never commit this!)
└── .env.example          ← Template
```

---

## 🚀 Quick Start

### Step 1 — Setup folders
```bash
mkdir portfolio
cd portfolio
mkdir public
# Move index.html → public/index.html
# Move server.js, package.json, .env.example to root
cp .env.example .env
```

### Step 2 — Install dependencies
```bash
npm install
```

### Step 3 — Configure .env
Open `.env` and fill in:

```env
MONGODB_URI=mongodb://localhost:27017/portfolio
EMAIL_SERVICE=gmail
EMAIL_USER=yourname@gmail.com
EMAIL_PASS=xxxx xxxx xxxx xxxx    ← Gmail App Password
OWNER_EMAIL=yourname@gmail.com
PORT=3000
```

### Step 4 — Gmail App Password (required!)
1. Go to [myaccount.google.com](https://myaccount.google.com) → **Security**
2. Enable **2-Step Verification**
3. Go to **App passwords** → choose Mail + Other
4. Copy the 16-character password into `EMAIL_PASS` in `.env`

### Step 5 — Start MongoDB
```bash
# If using local MongoDB:
mongod

# Or use MongoDB Atlas (cloud) — just paste the URI in .env
```

### Step 6 — Run the server
```bash
# Production
npm start

# Development (auto-restart on changes)
npm run dev
```

Open **http://localhost:3000** — your portfolio is live! 🎉

---

## 📬 How the Contact Form Works

When someone submits the form:

1. **Data saved to MongoDB** — stored in the `contacts` collection
2. **You get an email** — styled notification with full details + reply-to set
3. **Visitor gets a confirmation** — professional email receipt

---

## 🗄️ View Submissions (Admin)

```
GET http://localhost:3000/api/contacts
```

Returns all contact submissions (newest first).
> ⚠️ Add authentication before deploying to production!

---

## ✏️ Personalize the Portfolio

Open `public/index.html` and update:

| Find | Replace with |
|------|-------------|
| `Your Name` | Your actual name |
| `your@email.com` | Your email |
| `yourprofile` | Your LinkedIn handle |
| `yourusername` | Your GitHub username |
| Stats (5, 42, 1200) | Your real stats |
| Experience & Projects | Your real content |

---

## 🌐 Deploy to Production

### Option A — Railway (easiest)
```bash
npm install -g @railway/cli
railway login
railway init
railway add mongodb
railway up
```

### Option B — Render
1. Push to GitHub
2. New Web Service → connect repo
3. Add environment variables in dashboard
4. Deploy!

### Option C — VPS (DigitalOcean/AWS)
```bash
# Install PM2 for process management
npm install -g pm2
pm2 start server.js --name "portfolio"
pm2 save
pm2 startup
```

---

## 🐛 Troubleshooting

**MongoDB connection failed**
→ Make sure `mongod` is running, or check your Atlas URI

**Email not sending**
→ Verify Gmail App Password (not your login password)
→ Check `EMAIL_USER` and `EMAIL_PASS` in `.env`

**Form shows error in browser**
→ Make sure server is running on port 3000
→ Check browser console for network errors
