import { Router } from 'express';
import {
  getSales,
  getSale,
  createSale,
  returnSale,
  getSalesStats,
} from '../controllers/saleController';
import { authenticate } from '../middleware/auth';
import { tenantMiddleware } from '../middleware/tenant';
import { authorize } from '../middleware/roles';
import { validate, saleRules } from '../middleware/validate';

const router = Router();

router.use(authenticate, tenantMiddleware);

router.get('/', getSales);
router.get('/stats', getSalesStats);
router.get('/:id', getSale);
router.post('/', saleRules, validate, createSale);
router.post('/:id/return', authorize('admin', 'super_admin'), returnSale);

export default router;
