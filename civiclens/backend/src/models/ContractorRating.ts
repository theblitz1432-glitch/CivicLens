import mongoose, { Schema, Document } from 'mongoose';

export interface IContractorRating extends Document {
  complaintId: mongoose.Types.ObjectId;
  citizenId: mongoose.Types.ObjectId;
  contractorId: mongoose.Types.ObjectId;
  stars: number; // 1-5
  review: string;
  createdAt: Date;
}

const ContractorRatingSchema = new Schema<IContractorRating>({
  complaintId: { type: Schema.Types.ObjectId, ref: 'Complaint', required: true },
  citizenId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  contractorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  stars: { type: Number, required: true, min: 1, max: 5 },
  review: { type: String, default: '' },
}, { timestamps: true });

export default mongoose.models.ContractorRating || mongoose.model<IContractorRating>('ContractorRating', ContractorRatingSchema);