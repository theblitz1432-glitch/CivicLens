import { Request, Response } from 'express';
import Notification from '../models/Notification';

// Get notifications for logged in user
export const getNotifications = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const notifications = await Notification.find({ userId })
      .sort({ createdAt: -1 })
      .limit(50);
    const unreadCount = await Notification.countDocuments({ userId, isRead: false });
    res.json({ success: true, notifications, unreadCount });
  } catch {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Mark single notification as read
export const markAsRead = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user?.id;
    await Notification.findOneAndUpdate({ _id: id, userId }, { isRead: true });
    res.json({ success: true });
  } catch {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Mark all as read
export const markAllRead = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    await Notification.updateMany({ userId, isRead: false }, { isRead: true });
    res.json({ success: true });
  } catch {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Delete notification
export const deleteNotification = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user?.id;
    await Notification.findOneAndDelete({ _id: id, userId });
    res.json({ success: true });
  } catch {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};