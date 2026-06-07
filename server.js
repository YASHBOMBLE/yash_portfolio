// server.js — QA Portfolio Backend
// Run: node server.js
// Requires: npm install express mongoose nodemailer cors dotenv

require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const nodemailer = require('nodemailer');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(express.json());
app.use(cors());

// ── Serve static portfolio ──────────────────────────────────────────────────
app.use(express.static(path.join(__dirname, 'public')));

// ── MongoDB Connection ──────────────────────────────────────────────────────
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/portfolio', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => {
  console.log('✅ Connected to MongoDB');
}).catch(err => {
  console.error('❌ MongoDB connection error:', err.message);
});

// ── Contact Schema ──────────────────────────────────────────────────────────
const contactSchema = new mongoose.Schema({
  name:      { type: String, required: true, trim: true },
  email:     { type: String, required: true, trim: true, lowercase: true },
  subject:   { type: String, trim: true, default: 'No subject' },
  budget:    { type: String, default: 'Not specified' },
  message:   { type: String, required: true },
  ip:        { type: String },
  status:    { type: String, enum: ['new', 'read', 'replied'], default: 'new' },
  createdAt: { type: Date, default: Date.now },
});

const Contact = mongoose.model('Contact', contactSchema);

// ── Nodemailer Transporter ──────────────────────────────────────────────────
const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE || 'gmail',    // or 'outlook', 'yahoo', etc.
  auth: {
    user: process.env.EMAIL_USER,                   // your Gmail address
    pass: process.env.EMAIL_PASS,                   // Gmail App Password (not login password)
  },
});

// ── Email: Notify YOU (portfolio owner) ────────────────────────────────────
async function sendOwnerNotification({ name, email, subject, budget, message, createdAt }) {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: 'Courier New', monospace; background: #060810; color: #e2e8f0; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; padding: 40px 24px; }
        .header { border-bottom: 1px solid rgba(0,229,255,0.2); padding-bottom: 24px; margin-bottom: 32px; }
        .tag { color: #00e5ff; font-size: 12px; letter-spacing: 3px; text-transform: uppercase; }
        h1 { color: #e2e8f0; font-size: 24px; margin: 8px 0 0; }
        .field { margin-bottom: 20px; }
        .label { font-size: 11px; letter-spacing: 2px; color: #64748b; text-transform: uppercase; margin-bottom: 4px; }
        .value { background: #0d1117; border: 1px solid rgba(0,229,255,0.12); padding: 12px 16px; color: #e2e8f0; font-size: 14px; }
        .message-box { background: #0d1117; border: 1px solid rgba(0,229,255,0.2); border-left: 3px solid #00e5ff; padding: 20px; margin-top: 8px; color: #e2e8f0; font-size: 14px; line-height: 1.7; white-space: pre-wrap; }
        .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid rgba(255,255,255,0.05); font-size: 11px; color: #64748b; }
        .badge { display: inline-block; background: rgba(0,229,255,0.1); border: 1px solid rgba(0,229,255,0.3); color: #00e5ff; padding: 4px 12px; font-size: 11px; letter-spacing: 1px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="tag">// Portfolio Notification</div>
          <h1>📬 New Contact Submission</h1>
        </div>
        <div class="field">
          <div class="label">From</div>
          <div class="value">${name} &lt;${email}&gt;</div>
        </div>
        <div class="field">
          <div class="label">Subject</div>
          <div class="value">${subject}</div>
        </div>
        <div class="field">
          <div class="label">Budget Range</div>
          <div class="value"><span class="badge">${budget}</span></div>
        </div>
        <div class="field">
          <div class="label">Message</div>
          <div class="message-box">${message}</div>
        </div>
        <div class="field">
          <div class="label">Received At</div>
          <div class="value">${new Date(createdAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST</div>
        </div>
        <div class="footer">
          This is an automated notification from your QA Engineer portfolio.<br>
          Reply directly to this email or contact: <a href="mailto:${email}" style="color:#00e5ff;">${email}</a>
        </div>
      </div>
    </body>
    </html>
  `;

  await transporter.sendMail({
    from:    `"Portfolio Bot" <${process.env.EMAIL_USER}>`,
    to:      process.env.OWNER_EMAIL || process.env.EMAIL_USER,
    replyTo: email,
    subject: `🔔 New Contact: ${name} — ${subject}`,
    html,
  });
}

// ── Email: Confirmation to the SENDER ──────────────────────────────────────
async function sendUserConfirmation({ name, email, subject, message }) {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: 'Courier New', monospace; background: #060810; color: #e2e8f0; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; padding: 40px 24px; }
        .header { text-align: center; padding-bottom: 32px; margin-bottom: 32px; border-bottom: 1px solid rgba(0,229,255,0.15); }
        .tag { color: #00e5ff; font-size: 11px; letter-spacing: 3px; text-transform: uppercase; margin-bottom: 12px; }
        h1 { color: #e2e8f0; font-size: 22px; margin: 0; }
        .body-text { color: #94a3b8; font-size: 14px; line-height: 1.8; margin-bottom: 24px; }
        .highlight { color: #00e5ff; }
        .summary-box { background: #0d1117; border: 1px solid rgba(0,229,255,0.12); padding: 24px; margin: 24px 0; }
        .summary-box p { margin: 0 0 12px; font-size: 13px; }
        .summary-box p:last-child { margin: 0; }
        .label { color: #64748b; font-size: 11px; letter-spacing: 1px; text-transform: uppercase; }
        .cta { text-align: center; margin: 32px 0; }
        .cta a { background: #00e5ff; color: #060810; padding: 12px 32px; font-weight: bold; text-decoration: none; font-size: 12px; letter-spacing: 2px; text-transform: uppercase; clip-path: polygon(6px 0%, 100% 0%, calc(100% - 6px) 100%, 0% 100%); display: inline-block; }
        .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid rgba(255,255,255,0.05); font-size: 11px; color: #64748b; text-align: center; line-height: 1.8; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="tag">// Message Received</div>
          <h1>Thanks for reaching out, <span class="highlight">${name}</span>!</h1>
        </div>
        <p class="body-text">
          Your message has been received and stored. I typically respond within <strong>24 hours</strong>.
          Here's a copy of what you sent:
        </p>
        <div class="summary-box">
          <p><span class="label">Subject</span><br>${subject || 'No subject'}</p>
          <p><span class="label">Message</span><br>${message}</p>
        </div>
        <p class="body-text">
          In the meantime, feel free to explore my work on GitHub or connect on LinkedIn.
        </p>
        <div class="footer">
          This is a confirmation receipt. Please do not reply to this email.<br>
          To reach me directly: <span class="highlight">${process.env.OWNER_EMAIL || process.env.EMAIL_USER}</span>
        </div>
      </div>
    </body>
    </html>
  `;

  await transporter.sendMail({
    from:    `"Your Name — QA Engineer" <${process.env.EMAIL_USER}>`,
    to:      email,
    subject: `✅ Got your message! — Your Name Portfolio`,
    html,
  });
}

// ── API: POST /api/contact ──────────────────────────────────────────────────
app.post('/api/contact', async (req, res) => {
  try {
    const { name, email, subject, budget, message } = req.body;

    // Basic validation
    if (!name || !email || !message) {
      return res.status(400).json({ success: false, error: 'Name, email and message are required.' });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ success: false, error: 'Invalid email address.' });
    }

    // Save to MongoDB
    const contact = new Contact({
      name,
      email,
      subject: subject || 'No subject',
      budget:  budget  || 'Not specified',
      message,
      ip: req.ip,
    });
    await contact.save();
    console.log(`📋 Saved contact from ${name} <${email}>`);

    // Send emails (in parallel)
    await Promise.allSettled([
      sendOwnerNotification({ name, email, subject, budget, message, createdAt: contact.createdAt }),
      sendUserConfirmation({ name, email, subject, message }),
    ]);

    res.json({ success: true, message: 'Message sent and saved successfully.' });

  } catch (err) {
    console.error('❌ Contact API error:', err);
    res.status(500).json({ success: false, error: 'Internal server error.' });
  }
});

// ── API: GET /api/contacts (admin view) ────────────────────────────────────
// Protect this with auth in production!
app.get('/api/contacts', async (req, res) => {
  try {
    const contacts = await Contact.find().sort({ createdAt: -1 }).limit(50);
    res.json({ success: true, count: contacts.length, contacts });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── Catch-all: serve portfolio ──────────────────────────────────────────────
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ── Start server ────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
  console.log(`📁 Serving portfolio from /public/`);
});
