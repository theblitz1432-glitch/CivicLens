import { Request, Response } from 'express';
import ContractorRating from '../models/ContractorRating';
import Complaint from '../models/Complaint';
import Notification from '../models/Notification';

// Citizen submits a star rating for contractor after complaint resolved
export const submitRating = async (req: Request, res: Response) => {
  try {
    const { complaintId, stars, review } = req.body;
    const citizenId = (req as any).user?.id;

    if (!complaintId || !stars) return res.status(400).json({ success: false, message: 'complaintId and stars required' });
    if (stars < 1 || stars > 5) return res.status(400).json({ success: false, message: 'Stars must be 1–5' });

    // Check complaint belongs to this citizen and is resolved
    const complaint = await Complaint.findOne({ _id: complaintId, userId: citizenId });
    if (!complaint) return res.status(404).json({ success: false, message: 'Complaint not found' });
    if (complaint.status !== 'resolved') return res.status(400).json({ success: false, message: 'Can only rate after complaint is resolved' });

    // Prevent duplicate rating
    const existing = await ContractorRating.findOne({ complaintId, citizenId });
    if (existing) return res.status(400).json({ success: false, message: 'You have already rated this complaint' });

    // Find contractor user to link rating
    const User = require('../models/User').default;
    const contractor = await User.findOne({ role: 'contractor' });
    const contractorId = contractor?._id || citizenId;

    const rating = await ContractorRating.create({ complaintId, citizenId, contractorId, stars, review });

    // Notify contractor
    await Notification.create({
      userId: contractorId,
      title: `⭐ New Rating: ${stars}/5`,
      message: `A citizen rated your work ${stars} star${stars > 1 ? 's' : ''} for "${complaint.category}" complaint. ${review ? `Comment: "${review}"` : ''}`,
      type: 'system',
      isRead: false,
    });

    res.status(201).json({ success: true, rating });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Get average rating for a contractor
export const getContractorRating = async (req: Request, res: Response) => {
  try {
    const { contractorId } = req.params;
    const ratings = await ContractorRating.find({ contractorId }).populate('citizenId', 'name').sort({ createdAt: -1 });
    const avg = ratings.length > 0 ? (ratings.reduce((s, r) => s + r.stars, 0) / ratings.length) : 0;
    res.json({ success: true, average: Math.round(avg * 10) / 10, total: ratings.length, ratings });
  } catch { res.status(500).json({ success: false, message: 'Server error' }); }
};

// Get all ratings (for authority dashboard)
export const getAllRatings = async (req: Request, res: Response) => {
  try {
    const ratings = await ContractorRating.find()
      .populate('citizenId', 'name')
      .populate('contractorId', 'name')
      .populate('complaintId', 'category')
      .sort({ createdAt: -1 })
      .limit(50);
    const avg = ratings.length > 0 ? (ratings.reduce((s, r) => s + r.stars, 0) / ratings.length) : 0;
    res.json({ success: true, average: Math.round(avg * 10) / 10, total: ratings.length, ratings });
  } catch { res.status(500).json({ success: false, message: 'Server error' }); }
};

// Check if citizen already rated a complaint
export const checkRated = async (req: Request, res: Response) => {
  try {
    const { complaintId } = req.params;
    const citizenId = (req as any).user?.id;
    const existing = await ContractorRating.findOne({ complaintId, citizenId });
    res.json({ success: true, alreadyRated: !!existing, rating: existing });
  } catch { res.status(500).json({ success: false, message: 'Server error' }); }
};