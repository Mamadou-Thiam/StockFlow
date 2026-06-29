import mongoose, { Document, Schema } from 'mongoose';

export interface IInventoryMovement extends Document {
  companyId: mongoose.Types.ObjectId;
  productId: mongoose.Types.ObjectId;
  type: 'in' | 'out' | 'adjustment';
  quantity: number;
  previousStock?: number;
  newStock?: number;
  reference?: string;
  notes?: string;
  userId?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const InventoryMovementSchema = new Schema<IInventoryMovement>(
  {
    companyId: { type: Schema.Types.ObjectId, ref: 'Company', required: true },
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    type: {
      type: String,
      enum: ['in', 'out', 'adjustment'],
      required: true,
    },
    quantity: { type: Number, required: true },
    previousStock: { type: Number },
    newStock: { type: Number },
    reference: { type: String },
    notes: { type: String },
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

export default mongoose.model<IInventoryMovement>(
  'InventoryMovement',
  InventoryMovementSchema
);
