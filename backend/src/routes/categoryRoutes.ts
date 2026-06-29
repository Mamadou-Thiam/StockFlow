import { Router } from 'express';
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from '../controllers/categoryController';
import { authenticate } from '../middleware/auth';
import { tenantMiddleware } from '../middleware/tenant';
import { authorize } from '../middleware/roles';
import { validate, categoryRules } from '../middleware/validate';

const router = Router();

router.use(authenticate, tenantMiddleware);

router.get('/', getCategories);
router.post('/', authorize('admin', 'super_admin'), categoryRules, validate, createCategory);
router.put('/:id', authorize('admin', 'super_admin'), updateCategory);
router.delete('/:id', authorize('admin', 'super_admin'), deleteCategory);

export default router;
