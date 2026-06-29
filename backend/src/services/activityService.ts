import { ActivityLog } from '../models';

export async function logActivity(params: {
  companyId: string;
  userId?: string;
  action: string;
  entityType?: string;
  entityId?: string;
  details?: string;
  ip?: string;
}): Promise<void> {
  try {
    await ActivityLog.create({
      companyId: params.companyId,
      userId: params.userId || undefined,
      action: params.action,
      entityType: params.entityType,
      entityId: params.entityId || undefined,
      details: params.details,
      ip: params.ip,
    });
  } catch (error) {
    console.error('Failed to log activity:', error);
  }
}
