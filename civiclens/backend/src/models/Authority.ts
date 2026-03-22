import mongoose, { Schema, Document } from 'mongoose';

export interface IAuthority extends Document {
  name: string;
  role: string;
  panchayat: string;
  block: string;         // ← used for area-based filtering
  district: string;
  address: string;
  gender: string;
  caste: string;
  education: string;
  father_husband_name: string;
  phone?: string;
  email?: string;
  source?: string;
}

const AuthoritySchema = new Schema<IAuthority>({
  name:                { type: String, required: true },
  role:                { type: String, default: 'sarpanch' },
  panchayat:           { type: String, default: '' },
  block:               { type: String, default: '' },   // ADAMPUR / BARWALA / HANSI-I etc.
  district:            { type: String, default: '' },
  address:             { type: String, default: '' },
  gender:              { type: String, default: '' },
  caste:               { type: String, default: '' },
  education:           { type: String, default: '' },
  father_husband_name: { type: String, default: '' },
  phone:               { type: String, default: '' },
  email:               { type: String, default: '' },
  source:              { type: String, default: '' },
}, { timestamps: true });

// Index for fast area queries
AuthoritySchema.index({ block: 1, district: 1 });

export default mongoose.models?.Authority
  ? mongoose.model<IAuthority>('Authority')
  : mongoose.model<IAuthority>('Authority', AuthoritySchema);