import mongoose, { Schema, Document } from 'mongoose';

export interface INotification extends Document {
  userId: mongoose.Types.ObjectId;
  title: string;
  message: string;
  type: 'complaint' | 'status_update' | 'project' | 'system';
  isRead: boolean;
  complaintId?: mongoose.Types.ObjectId;
  createdAt: Date;
}

const NotificationSchema = new Schema<INotification>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  type: { type: String, enum: ['complaint', 'status_update', 'project', 'system'], default: 'complaint' },
  isRead: { type: Boolean, default: false },
  complaintId: { type: Schema.Types.ObjectId, ref: 'Complaint' },
}, { timestamps: true });

export default mongoose.models.Notification || mongoose.model<INotification>('Notification', NotificationSchema);