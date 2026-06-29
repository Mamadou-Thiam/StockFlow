import mongoose, { Document, Schema } from 'mongoose';

export interface IInvoiceItem {
  productId: mongoose.Types.ObjectId;
  name: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
  taxAmount: number;
  total: number;
}

export interface IInvoice extends Document {
  companyId: mongoose.Types.ObjectId;
  invoiceNumber: string;
  saleId?: mongoose.Types.ObjectId;
  clientId?: mongoose.Types.ObjectId;
  items: IInvoiceItem[];
  subtotal: number;
  taxTotal: number;
  discount: number;
  total: number;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  dueDate?: Date;
  paidAt?: Date;
  notes?: string;
  pdfUrl?: string;
  userId?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const InvoiceItemSchema = new Schema<IInvoiceItem>(
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

const InvoiceSchema = new Schema<IInvoice>(
  {
    companyId: { type: Schema.Types.ObjectId, ref: 'Company', required: true },
    invoiceNumber: { type: String, required: true, unique: true },
    saleId: { type: Schema.Types.ObjectId, ref: 'Sale' },
    clientId: { type: Schema.Types.ObjectId, ref: 'Client' },
    items: { type: [InvoiceItemSchema], required: true },
    subtotal: { type: Number, required: true },
    taxTotal: { type: Number, required: true },
    discount: { type: Number, default: 0 },
    total: { type: Number, required: true },
    status: {
      type: String,
      enum: ['draft', 'sent', 'paid', 'overdue', 'cancelled'],
      default: 'draft',
    },
    dueDate: { type: Date },
    paidAt: { type: Date },
    notes: { type: String },
    pdfUrl: { type: String },
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

export default mongoose.model<IInvoice>('Invoice', InvoiceSchema);
