import mongoose, { Schema, Document } from 'mongoose';

export interface IProject extends Document {
  title: string;
  description: string;
  location: string;
  status: 'upcoming' | 'in_progress' | 'delayed' | 'completed';
  completionPercentage: number;
  contractor: {
    name: string;
    phone: string;
    id?: mongoose.Types.ObjectId;
  };
  authority: {
    name: string;
    designation: string;
    office: string;
  };
  startDate: Date;
  expectedEndDate: Date;
  budget: number;
  createdAt: Date;
}

const ProjectSchema = new Schema<IProject>({
  title: { type: String, required: true },
  description: { type: String, default: '' },
  location: { type: String, required: true },
  status: { type: String, enum: ['upcoming', 'in_progress', 'delayed', 'completed'], default: 'upcoming' },
  completionPercentage: { type: Number, default: 0, min: 0, max: 100 },
  contractor: {
    name: { type: String, required: true },
    phone: { type: String, default: '' },
    id: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  authority: {
    name: { type: String, required: true },
    designation: { type: String, default: '' },
    office: { type: String, default: '' },
  },
  startDate: { type: Date, default: Date.now },
  expectedEndDate: { type: Date, default: Date.now },
  budget: { type: Number, default: 0 },
}, { timestamps: true });

export default mongoose.models.Project || mongoose.model<IProject>('Project', ProjectSchema);