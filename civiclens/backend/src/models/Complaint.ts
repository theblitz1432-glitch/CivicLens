import mongoose, { Schema, Document } from 'mongoose';

export interface IComplaint extends Document {
  userId: mongoose.Types.ObjectId;
  category: string;
  description: string;
  photoUrl: string;
  photoVerified: boolean;
  photoVerificationReason: string;
  damagePercentage: number;
  damageType: string;
  aiDetails: string;
  comparisonReport: string;
  geotagValid: boolean;
  location: { lat: number; lng: number; address: string; block?: string; district?: string };
  status: 'pending' | 'verified' | 'in_progress' | 'resolved' | 'rejected';
  contractorNote: string;
  contractorReview?: {
    review: string; estimatedDays: number; actionTaken: string;
    reviewedAt: Date; contractorId: mongoose.Types.ObjectId;
  };
  assignedTo?: mongoose.Types.ObjectId;
  escalated: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ComplaintSchema = new Schema<IComplaint>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  category: { type: String, required: true },
  description: { type: String, required: true },
  photoUrl: { type: String, default: '' },
  photoVerified: { type: Boolean, default: false },
  photoVerificationReason: { type: String, default: '' },
  damagePercentage: { type: Number, default: 0, min: 0, max: 100 },
  damageType: { type: String, default: 'unknown' },
  aiDetails: { type: String, default: '' },
  comparisonReport: { type: String, default: '' },
  geotagValid: { type: Boolean, default: true },
  location: {
    lat: { type: Number, default: 0 },
    lng: { type: Number, default: 0 },
    address: { type: String, default: '' },
    block: { type: String, default: '' },
    district: { type: String, default: '' },
  },
  status: { type: String, enum: ['pending', 'verified', 'in_progress', 'resolved', 'rejected'], default: 'pending' },
  contractorNote: { type: String, default: '' },
  contractorReview: {
    review: String, estimatedDays: Number, actionTaken: String,
    reviewedAt: Date, contractorId: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  assignedTo: { type: Schema.Types.ObjectId, ref: 'User' },
  escalated: { type: Boolean, default: false },
}, { timestamps: true });

export default mongoose.models.Complaint || mongoose.model<IComplaint>('Complaint', ComplaintSchema);