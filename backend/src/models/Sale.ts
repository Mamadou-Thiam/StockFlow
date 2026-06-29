import mongoose, { Document, Schema } from 'mongoose';

export interface ISaleItem {
  productId: mongoose.Types.ObjectId;
  name: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
  taxAmount: number;
  total: number;
}

export interface ISale extends Document {
  companyId: mongoose.Types.ObjectId;
  invoiceNumber?: string;
  items: ISaleItem[];
  subtotal: number;
  taxTotal: number;
  discount: number;
  discountType: 'percentage' | 'fixed';
  total: number;
  paymentMethod: 'cash' | 'card' | 'transfer' | 'other';
  status: 'completed' | 'cancelled' | 'returned';
  clientId?: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  notes?: string;
  returnedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const SaleItemSchema = new Schema<ISaleItem>(
  {
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    name: { type: String, required: true },
    sku: { type: String, required: true },
    quantity: { type: Number, required: true },
    unitPrice: { type: Number, required: true },
    taxRate: { type: Number, required: true },
    taxAmount: { type: Number, required: true },
    total: { type: Number, required: true },
  },
  { _id: false }
);

const SaleSchema = new Schema<ISale>(
  {
    companyId: { type: Schema.Types.ObjectId, ref: 'Company', required: true },
    invoiceNumber: { type: String, unique: true, sparse: true },
    items: { type: [SaleItemSchema], required: true },
    subtotal: { type: Number, required: true },
    taxTotal: { type: Number, required: true },
    discount: { type: Number, default: 0 },
    discountType: {
      type: String,
      enum: ['percentage', 'fixed'],
      default: 'percentage',
    },
    total: { type: Number, required: true },
    paymentMethod: {
      type: String,
      enum: ['cash', 'card', 'transfer', 'other'],
      default: 'cash',
    },
    status: {
      type: String,
      enum: ['completed', 'cancelled', 'returned'],
      default: 'completed',
    },
    clientId: { type: Schema.Types.ObjectId, ref: 'Client' },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    notes: { type: String },
    returnedAt: { type: Date },
  },
  { timestamps: true }
);

export default mongoose.model<ISale>('Sale', SaleSchema);
