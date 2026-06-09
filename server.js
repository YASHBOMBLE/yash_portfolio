require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const nodemailer = require('nodemailer');
const cors = require('cors');
const path = require('path');

const app = express();

app.use(express.json());
app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => console.error('❌ MongoDB connection error:', err.message));

// Contact Schema
const contactSchema = new mongoose.Schema({
  name: String,
  email: String,
  subject: String,
  budget: String,
  message: String,
  ip: String,
  status: {
    type: String,
    default: 'new'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Contact = mongoose.model('Contact', contactSchema);

// Gmail SMTP Transport
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Verify mail connection
transporter.verify((error) => {
  if (error) {
    console.error('❌ Mail configuration error:', error);
  } else {
    console.log('✅ Mail server ready');
  }
});

// Send mail to owner
async function sendOwnerNotification(data) {
  return transporter.sendMail({
    from: {
      name: 'Portfolio Bot',
      address: process.env.EMAIL_USER
    },
    to: process.env.OWNER_EMAIL,
    replyTo: data.email,
    subject: `🔔 New Contact: ${data.name}`,
    html: `
      <h2>New Contact Submission</h2>
      <p><strong>Name:</strong> ${data.name}</p>
      <p><strong>Email:</strong> ${data.email}</p>
      <p><strong>Subject:</strong> ${data.subject}</p>
      <p><strong>Budget:</strong> ${data.budget}</p>
      <p><strong>Message:</strong></p>
      <p>${data.message}</p>
    `
  });
}

// Send confirmation to user
async function sendUserConfirmation(data) {
  return transporter.sendMail({
    from: {
      name: 'QA Portfolio',
      address: process.env.EMAIL_USER
    },
    to: data.email,
    subject: '✅ We received your message',
    html: `
      <h2>Thank You ${data.name}</h2>
      <p>Your message has been received successfully.</p>
      <p><strong>Subject:</strong> ${data.subject}</p>
      <p>${data.message}</p>
    `
  });
}

// Contact API
app.post('/api/contact', async (req, res) => {
  try {
    const { name, email, subject, budget, message } = req.body;

    if (!name || !email || !message) {
      return res.status(400).json({
        success: false,
        error: 'Name, email and message are required'
      });
    }

    const contact = await Contact.create({
      name,
      email,
      subject: subject || 'No Subject',
      budget: budget || 'Not Specified',
      message,
      ip: req.ip
    });

    const results = await Promise.allSettled([
      sendOwnerNotification({
        name,
        email,
        subject,
        budget,
        message
      }),
      sendUserConfirmation({
        name,
        email,
        subject,
        message
      })
    ]);

    results.forEach((result, index) => {
      if (result.status === 'rejected') {
        console.error(
          `❌ Email ${index + 1} failed:`,
          result.reason
        );
      }
    });

    res.json({
      success: true,
      message: 'Message saved and emails processed'
    });

  } catch (err) {
    console.error('❌ Contact API error:', err);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

// Email Test Route
app.get('/test-email', async (req, res) => {
  try {
    const info = await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: process.env.EMAIL_USER,
      subject: 'Render Email Test',
      text: 'Email service is working.'
    });

    res.json({
      success: true,
      messageId: info.messageId
    });

  } catch (err) {
    console.error(err);

    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

// Health Check
app.get('/health', (req, res) => {
  res.json({
    success: true,
    status: 'Running'
  });
});

// Start Server
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});