import { Router } from 'express';
import {
  getUsers,
  createUser,
  updateUser,
  deleteUser,
} from '../controllers/userController';
import { authenticate } from '../middleware/auth';
import { tenantMiddleware } from '../middleware/tenant';
import { authorize } from '../middleware/roles';

const router = Router();

router.use(authenticate, tenantMiddleware);

router.get('/', authorize('super_admin', 'admin'), getUsers);
router.post('/', authorize('super_admin', 'admin'), createUser);
router.put('/:id', authorize('super_admin', 'admin'), updateUser);
router.delete('/:id', authorize('super_admin', 'admin'), deleteUser);

export default router;
