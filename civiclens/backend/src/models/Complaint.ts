import mongoose, { Schema, Document } from 'mongoose';

export interface IComplaint extends Document {
  userId: mongoose.Types.ObjectId;
  category: string;
  description: string;
  photoUrl: string;
  photoVerified: boolean;
  photoVerificationReason: string;
  location: {
    lat: number;
    lng: number;
    address: string;
  };
  status: 'pending' | 'verified' | 'in_progress' | 'resolved' | 'rejected';
  assignedTo?: mongoose.Types.ObjectId;
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
  location: {
    lat: { type: Number, default: 0 },
    lng: { type: Number, default: 0 },
    address: { type: String, default: '' },
  },
  status: { type: String, enum: ['pending', 'verified', 'in_progress', 'resolved', 'rejected'], default: 'pending' },
  assignedTo: { type: Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

export default mongoose.models.Complaint || mongoose.model<IComplaint>('Complaint', ComplaintSchema);