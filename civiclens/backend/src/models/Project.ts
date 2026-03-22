import mongoose, { Schema, Document } from 'mongoose';

export interface IProject extends Document {
  title: string;
  description: string;
  location: string;
  coordinates?: { lat: number; lng: number };
  status: 'planned' | 'upcoming' | 'in_progress' | 'delayed' | 'completed';
  completionPercentage: number;
  contractor: { name: string; phone: string; email: string; userId?: mongoose.Types.ObjectId };
  authority: { name: string; designation: string; office: string };
  startDate: Date;
  expectedEndDate: Date;
  budget: number;
  // PRD: Mandatory geotagged before/after photos
  beforePhoto: string;      // taken at project start
  beforePhotoDate?: Date;
  afterPhoto: string;       // taken at project completion
  afterPhotoDate?: Date;
  // Progress milestones
  milestones: {
    title: string;
    completionPct: number;
    photo?: string;
    note?: string;
    date: Date;
    uploadedBy: mongoose.Types.ObjectId;
  }[];
  // Reports
  reports: {
    title: string;
    description: string;
    photoUrl: string;
    completionUpdate: number;
    uploadedAt: Date;
    uploadedBy: mongoose.Types.ObjectId;
  }[];
  // PRD: Transparency scorecard
  totalComplaints?: number;
  avgContractorRating?: number;
  createdAt: Date;
}

const ProjectSchema = new Schema<IProject>({
  title: { type: String, required: true },
  description: { type: String, default: '' },
  location: { type: String, required: true },
  coordinates: { lat: { type: Number, default: 0 }, lng: { type: Number, default: 0 } },
  status: { type: String, enum: ['planned', 'upcoming', 'in_progress', 'delayed', 'completed'], default: 'planned' },
  completionPercentage: { type: Number, default: 0, min: 0, max: 100 },
  contractor: {
    name: { type: String, required: true },
    phone: { type: String, default: '' },
    email: { type: String, default: '' },
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  authority: {
    name: { type: String, required: true },
    designation: { type: String, default: '' },
    office: { type: String, default: '' },
  },
  startDate: { type: Date, default: Date.now },
  expectedEndDate: { type: Date, default: Date.now },
  budget: { type: Number, default: 0 },
  beforePhoto: { type: String, default: '' },
  beforePhotoDate: { type: Date },
  afterPhoto: { type: String, default: '' },
  afterPhotoDate: { type: Date },
  milestones: [{
    title: { type: String },
    completionPct: { type: Number, default: 0 },
    photo: { type: String },
    note: { type: String },
    date: { type: Date, default: Date.now },
    uploadedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  }],
  reports: [{
    title: { type: String },
    description: { type: String },
    photoUrl: { type: String },
    completionUpdate: { type: Number, default: 0 },
    uploadedAt: { type: Date, default: Date.now },
    uploadedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  }],
  totalComplaints: { type: Number, default: 0 },
  avgContractorRating: { type: Number, default: 0 },
}, { timestamps: true });

export default mongoose.models.Project || mongoose.model<IProject>('Project', ProjectSchema);