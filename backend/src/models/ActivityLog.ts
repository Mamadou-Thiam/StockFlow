import mongoose, { Document, Schema } from 'mongoose';

export interface IActivityLog extends Document {
  companyId: mongoose.Types.ObjectId;
  userId?: mongoose.Types.ObjectId;
  action: string;
  entityType?: string;
  entityId?: mongoose.Types.ObjectId;
  details?: string;
  ip?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ActivityLogSchema = new Schema<IActivityLog>(
  {
    companyId: { type: Schema.Types.ObjectId, ref: 'Company', required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
    action: { type: String, required: true },
    entityType: { type: String },
    entityId: { type: Schema.Types.ObjectId },
    details: { type: String },
    ip: { type: String },
  },
  { timestamps: true }
);

export default mongoose.model<IActivityLog>('ActivityLog', ActivityLogSchema);
