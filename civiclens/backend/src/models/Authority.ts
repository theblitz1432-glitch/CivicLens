import mongoose, { Schema, Document } from 'mongoose';

export interface IAuthority extends Document {
  name: string;
  designation: string;
  department: string;
  office: string;
  phone: string;
  email: string;
  area: string;
  imageUrl: string;
}

const AuthoritySchema = new Schema<IAuthority>({
  name: { type: String, required: true },
  designation: { type: String, required: true },
  department: { type: String, default: '' },
  office: { type: String, default: '' },
  phone: { type: String, default: '' },
  email: { type: String, default: '' },
  area: { type: String, default: '' },
  imageUrl: { type: String, default: '' },
}, { timestamps: true });

export default mongoose.models.Authority || mongoose.model<IAuthority>('Authority', AuthoritySchema);