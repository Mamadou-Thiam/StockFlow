import mongoose, { Document, Schema } from 'mongoose';

export interface IClient extends Document {
  companyId: mongoose.Types.ObjectId;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zip?: string;
    country?: string;
  };
  company?: string;
  taxId?: string;
  notes?: string;
  totalPurchases: number;
  balance: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ClientSchema = new Schema<IClient>(
  {
    companyId: { type: Schema.Types.ObjectId, ref: 'Company', required: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String },
    phone: { type: String },
    address: {
      street: { type: String },
      city: { type: String },
      state: { type: String },
      zip: { type: String },
      country: { type: String },
    },
    company: { type: String },
    taxId: { type: String },
    notes: { type: String },
    totalPurchases: { type: Number, default: 0 },
    balance: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model<IClient>('Client', ClientSchema);
