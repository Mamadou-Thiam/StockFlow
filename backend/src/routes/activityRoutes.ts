import { Router } from 'express';
import { getActivities } from '../controllers/activityController';
import { authenticate } from '../middleware/auth';
import { tenantMiddleware } from '../middleware/tenant';
import { authorize } from '../middleware/roles';

const router = Router();

router.use(authenticate, tenantMiddleware);

router.get('/', authorize('super_admin', 'admin'), getActivities);

export default router;
