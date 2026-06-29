import mongoose, { Document, Schema } from 'mongoose';

export interface IProduct extends Document {
  companyId: mongoose.Types.ObjectId;
  name: string;
  description?: string;
  sku: string;
  barcode?: string;
  categoryId?: mongoose.Types.ObjectId;
  price: number;
  costPrice?: number;
  taxRate: number;
  unit: string;
  quantity: number;
  minStock: number;
  image?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ProductSchema = new Schema<IProduct>(
  {
    companyId: { type: Schema.Types.ObjectId, ref: 'Company', required: true },
    name: { type: String, required: true },
    description: { type: String },
    sku: { type: String, required: true },
    barcode: { type: String },
    categoryId: { type: Schema.Types.ObjectId, ref: 'Category' },
    price: { type: Number, required: true },
    costPrice: { type: Number },
    taxRate: { type: Number, default: 0 },
    unit: { type: String, default: 'pcs' },
    quantity: { type: Number, default: 0 },
    minStock: { type: Number, default: 5 },
    image: { type: String },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

ProductSchema.index({ companyId: 1, sku: 1 }, { unique: true });

export default mongoose.model<IProduct>('Product', ProductSchema);
