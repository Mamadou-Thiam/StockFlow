import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { ActivityLog } from '../models';
import { paginate } from '../utils/helpers';

export async function getActivities(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { page, limit, action, entityType } = req.query;
    const { skip, limit: pageLimit } = paginate(Number(page) || 1, Number(limit) || 50);

    const filter: any = { companyId: req.user!.companyId };

    if (action) {
      filter.action = action;
    }

    if (entityType) {
      filter.entityType = entityType;
    }

    const [items, total] = await Promise.all([
      ActivityLog.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(pageLimit)
        .populate('userId', 'firstName lastName email'),
      ActivityLog.countDocuments(filter),
    ]);

    const currentPage = Number(page) || 1;
    res.json({
      success: true,
      data: {
        items,
        total,
        page: currentPage,
        limit: pageLimit,
        pages: Math.ceil(total / pageLimit),
      },
    });
  } catch (error) {
    next(error);
  }
}
