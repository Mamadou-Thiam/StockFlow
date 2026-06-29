import mongoose, { Document, Schema } from 'mongoose';

export interface ICategory extends Document {
  companyId: mongoose.Types.ObjectId;
  name: string;
  description?: string;
  color?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const CategorySchema = new Schema<ICategory>(
  {
    companyId: { type: Schema.Types.ObjectId, ref: 'Company', required: true },
    name: { type: String, required: true },
    description: { type: String },
    color: { type: String },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

CategorySchema.index({ companyId: 1, name: 1 }, { unique: true });

export default mongoose.model<ICategory>('Category', CategorySchema);
