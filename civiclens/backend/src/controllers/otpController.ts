import { Request, Response } from 'express';
import nodemailer from 'nodemailer';
import axios from 'axios';

// In-memory OTP store: { email/phone: { otp, expiresAt } }
const otpStore: Record<string, { otp: string; expiresAt: number }> = {};

const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

// Send Email OTP
export const sendEmailOTP = async (req: Request, res: Response) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ success: false, message: 'Email is required' });

  const otp = generateOTP();
  otpStore[email] = { otp, expiresAt: Date.now() + 10 * 60 * 1000 }; // 10 min expiry

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_PASS,
    },
  });

  try {
    await transporter.sendMail({
      from: `"CivicLens" <${process.env.GMAIL_USER}>`,
      to: email,
      subject: 'CivicLens - Email Verification OTP',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 400px; margin: auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px;">
          <h2 style="color: #4f46e5;">CivicLens Email Verification</h2>
          <p>Your OTP code is:</p>
          <h1 style="letter-spacing: 8px; color: #1e293b;">${otp}</h1>
          <p style="color: #64748b;">This code expires in 10 minutes. Do not share it with anyone.</p>
        </div>
      `,
    });

    res.json({ success: true, message: 'OTP sent to email' });
  } catch (error) {
    console.error('Email OTP error:', error);
    res.status(500).json({ success: false, message: 'Failed to send email OTP' });
  }
};

// Send Phone OTP
export const sendPhoneOTP = async (req: Request, res: Response) => {
  const { phone } = req.body;
  if (!phone) return res.status(400).json({ success: false, message: 'Phone is required' });

  // Clean phone number - remove +91, spaces, hyphens
  const cleanPhone = phone.replace(/\D/g, '').slice(-10);

  const otp = generateOTP();
  otpStore[cleanPhone] = { otp, expiresAt: Date.now() + 10 * 60 * 1000 };

  try {
    await axios.get('https://www.fast2sms.com/dev/bulkV2', {
    params: {
    authorization: process.env.FAST2SMS_API_KEY,
    message: `Your CivicLens OTP is ${otp}. Valid for 10 minutes.`,
    language: 'english',
    route: 'q',
    numbers: cleanPhone,
  },
});

    res.json({ success: true, message: 'OTP sent to phone' });
  } catch (error) {
    console.error('Phone OTP error:', error);
    res.status(500).json({ success: false, message: 'Failed to send phone OTP' });
  }
};

// Verify OTP
export const verifyOTP = async (req: Request, res: Response) => {
  const { key, otp } = req.body;

  if (!key || !otp) return res.status(400).json({ success: false, message: 'Key and OTP are required' });

  // Clean key in case it's a phone number
  const cleanKey = key.replace(/\D/g, '').slice(-10);
  const lookupKey = otpStore[cleanKey] ? cleanKey : key;

  const record = otpStore[lookupKey];
  if (!record) return res.status(400).json({ success: false, message: 'OTP not found. Please request again.' });
  if (Date.now() > record.expiresAt) {
    delete otpStore[lookupKey];
    return res.status(400).json({ success: false, message: 'OTP expired. Please request again.' });
  }
  if (record.otp !== otp) return res.status(400).json({ success: false, message: 'Invalid OTP' });

  delete otpStore[lookupKey];
  res.json({ success: true, message: 'OTP verified successfully' });
};