import mongoose, { Document, Schema } from 'mongoose';

export interface ICompany extends Document {
  name: string;
  email: string;
  phone?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zip?: string;
    country?: string;
  };
  logo?: string;
  colors?: {
    primary?: string;
    secondary?: string;
  };
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const CompanySchema = new Schema<ICompany>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phone: { type: String },
    address: {
      street: { type: String },
      city: { type: String },
      state: { type: String },
      zip: { type: String },
      country: { type: String },
    },
    logo: { type: String },
    colors: {
      primary: { type: String },
      secondary: { type: String },
    },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model<ICompany>('Company', CompanySchema);
