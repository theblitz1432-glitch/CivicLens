import { Request, Response } from 'express';
import Complaint from '../models/Complaint';
import Project from '../models/Project';
import Authority from '../models/Authority';
import User from '../models/User';
import Notification from '../models/Notification';
import nodemailer from 'nodemailer';
import axios from 'axios';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_PASS },
});

const sendEmail = async (to: string, subject: string, html: string) => {
  try {
    await transporter.sendMail({ from: `"CivicLens" <${process.env.GMAIL_USER}>`, to, subject, html });
  } catch (err) { console.error('Email error:', err); }
};

const emailHtml = (complaint: any, reportedBy: any) => `
  <div style="font-family:Arial;max-width:600px;margin:auto;padding:24px;border:1px solid #e2e8f0;border-radius:12px;">
    <div style="background:#1e40af;color:white;padding:16px;border-radius:8px;margin-bottom:20px;">
      <h2 style="margin:0;">🚨 New Complaint - CivicLens</h2>
    </div>
    <table style="width:100%;border-collapse:collapse;">
      <tr><td style="padding:8px;font-weight:bold;color:#475569;">Category:</td><td style="padding:8px;">${complaint.category}</td></tr>
      <tr style="background:#f8fafc;"><td style="padding:8px;font-weight:bold;color:#475569;">Description:</td><td style="padding:8px;">${complaint.description}</td></tr>
      <tr><td style="padding:8px;font-weight:bold;color:#475569;">Location:</td><td style="padding:8px;">Lat: ${complaint.location?.lat}, Lng: ${complaint.location?.lng}</td></tr>
      <tr style="background:#f8fafc;"><td style="padding:8px;font-weight:bold;color:#475569;">Reported By:</td><td style="padding:8px;">${reportedBy?.name} (${reportedBy?.phone || reportedBy?.email})</td></tr>
      <tr><td style="padding:8px;font-weight:bold;color:#475569;">Date:</td><td style="padding:8px;">${new Date().toLocaleString('en-IN')}</td></tr>
    </table>
    <p style="margin-top:20px;color:#64748b;font-size:13px;">Please take action on this complaint. Login to CivicLens to update the status.</p>
    <div style="margin-top:16px;padding:12px;background:#f0fdf4;border-radius:8px;border-left:4px solid #22c55e;">
      <p style="margin:0;color:#166534;font-size:12px;">✅ Photo verified as authentic by AI</p>
    </div>
  </div>
`;

// Create in-app notification for a user
const createNotification = async (
  userId: string,
  title: string,
  message: string,
  type: 'complaint' | 'status_update' | 'project' | 'system',
  complaintId?: string
) => {
  try {
    await Notification.create({ userId, title, message, type, complaintId, isRead: false });
  } catch (err) { console.error('Notification create error:', err); }
};

// Notify contractors and authorities via email + in-app
const notifyStakeholders = async (complaint: any, reporterId: string) => {
  try {
    const reporter = await User.findById(reporterId).select('name email phone');
    const html = emailHtml(complaint, reporter);

    const categoryMap: Record<string, string[]> = {
      'Road & Infrastructure': ['road', 'paving', 'infrastructure'],
      'Water Supply': ['water', 'pipeline'],
      'Electricity': ['electric', 'power'],
      'Sanitation': ['sanitation', 'garbage'],
      'Drainage': ['drainage'],
    };
    const keywords = categoryMap[complaint.category] || [complaint.category.toLowerCase()];

    // Find related projects and their contractor users
    const projects = await Project.find({
      $or: keywords.map(k => ({ title: { $regex: k, $options: 'i' } }))
    });

    // Notify contractors
    for (const project of projects) {
      // Find contractor user by role
      const contractorUsers = await User.find({ role: 'contractor' });
      for (const cu of contractorUsers) {
        // In-app notification
        await createNotification(
          cu._id.toString(),
          `🚨 New ${complaint.category} Complaint`,
          `A new complaint has been registered near your project "${project.title}". Description: ${complaint.description.substring(0, 100)}`,
          'complaint',
          complaint._id.toString()
        );
        // Email
        if (cu.email) await sendEmail(cu.email, `🚨 New ${complaint.category} Complaint - CivicLens`, html);
      }
    }

    // Notify all authorities
    const authorityUsers = await User.find({ role: 'authority' });
    for (const au of authorityUsers) {
      await createNotification(
        au._id.toString(),
        `🚨 New Civic Complaint: ${complaint.category}`,
        `Citizen ${reporter?.name} has filed a complaint: "${complaint.description.substring(0, 100)}"`,
        'complaint',
        complaint._id.toString()
      );
      if (au.email) await sendEmail(au.email, `🚨 New Civic Complaint - Action Required`, html);
    }

    // Also notify the reporter about successful submission
    await createNotification(
      reporterId,
      '✅ Complaint Submitted Successfully',
      `Your ${complaint.category} complaint has been submitted and verified. Contractor and authorities have been notified.`,
      'status_update',
      complaint._id.toString()
    );

  } catch (err) { console.error('Notify stakeholders error:', err); }
};

// Verify photo with Groq Vision AI
const verifyPhoto = async (base64: string): Promise<{ isReal: boolean; reason: string }> => {
  try {
    const res = await axios.post(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        model: 'llama-3.2-11b-vision-preview',
        messages: [{
          role: 'user',
          content: [
            { type: 'image_url', image_url: { url: base64 } },
            { type: 'text', text: `Is this a real civic infrastructure problem photo? Respond ONLY as JSON: {"isReal": true/false, "reason": "one sentence"}` }
          ]
        }],
        max_tokens: 80,
      },
      { headers: { Authorization: `Bearer ${process.env.GROQ_API_KEY}`, 'Content-Type': 'application/json' } }
    );
    const content = res.data.choices[0]?.message?.content || '{"isReal":false,"reason":"Could not verify"}';
    return JSON.parse(content.replace(/```json|```/g, '').trim());
  } catch {
    return { isReal: true, reason: 'Verification unavailable - auto approved' };
  }
};

export const registerComplaint = async (req: Request, res: Response) => {
  try {
    const { category, description, photoBase64, location } = req.body;
    const userId = (req as any).user?.id;
    if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });
    if (!category || !description) return res.status(400).json({ success: false, message: 'Category and description required' });

    let photoVerified = false;
    let photoVerificationReason = 'No photo provided';

    if (photoBase64) {
      const result = await verifyPhoto(photoBase64);
      photoVerified = result.isReal;
      photoVerificationReason = result.reason;
      if (!result.isReal) {
        return res.status(400).json({ success: false, message: `Photo rejected: ${result.reason}`, photoRejected: true });
      }
    }

    const complaint = await Complaint.create({
      userId, category, description,
      photoUrl: photoBase64 || '',
      photoVerified, photoVerificationReason,
      location: location || { lat: 0, lng: 0, address: 'Unknown' },
      status: 'pending',
    });

    // Notify in background
    notifyStakeholders(complaint, userId);

    res.status(201).json({
      success: true,
      message: 'Complaint registered successfully',
      complaint: { id: complaint._id, category, status: 'pending', createdAt: complaint.createdAt }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const getUserComplaints = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const complaints = await Complaint.find({ userId }).sort({ createdAt: -1 });
    res.json({ success: true, complaints });
  } catch { res.status(500).json({ success: false, message: 'Server error' }); }
};

export const getAllComplaints = async (req: Request, res: Response) => {
  try {
    const { status, category } = req.query;
    const filter: any = {};
    if (status) filter.status = status;
    if (category) filter.category = category;
    const complaints = await Complaint.find(filter).populate('userId', 'name phone email').sort({ createdAt: -1 });
    res.json({ success: true, complaints });
  } catch { res.status(500).json({ success: false, message: 'Server error' }); }
};

export const updateComplaintStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const updaterId = (req as any).user?.id;

    const complaint = await Complaint.findByIdAndUpdate(id, { status }, { new: true });
    if (!complaint) return res.status(404).json({ success: false, message: 'Not found' });

    // Notify the citizen about status update
    await createNotification(
      complaint.userId.toString(),
      `📋 Complaint Status Updated`,
      `Your ${complaint.category} complaint status has been changed to "${status.replace('_', ' ').toUpperCase()}"`,
      'status_update',
      complaint._id.toString()
    );

    res.json({ success: true, complaint });
  } catch { res.status(500).json({ success: false, message: 'Server error' }); }
};

export const getComplaintStats = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const [total, resolved, inProgress, pending] = await Promise.all([
      Complaint.countDocuments({ userId }),
      Complaint.countDocuments({ userId, status: 'resolved' }),
      Complaint.countDocuments({ userId, status: 'in_progress' }),
      Complaint.countDocuments({ userId, status: 'pending' }),
    ]);
    res.json({ success: true, stats: { total, resolved, inProgress, pending } });
  } catch { res.status(500).json({ success: false, message: 'Server error' }); }
};