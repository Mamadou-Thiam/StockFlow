import { Router } from 'express';
import {
  getClients,
  getClient,
  createClient,
  updateClient,
  deleteClient,
} from '../controllers/clientController';
import { authenticate } from '../middleware/auth';
import { tenantMiddleware } from '../middleware/tenant';
import { authorize } from '../middleware/roles';
import { validate, clientRules } from '../middleware/validate';

const router = Router();

router.use(authenticate, tenantMiddleware);

router.get('/', getClients);
router.get('/:id', getClient);
router.post('/', authorize('admin', 'super_admin'), clientRules, validate, createClient);
router.put('/:id', authorize('admin', 'super_admin'), updateClient);
router.delete('/:id', authorize('admin', 'super_admin'), deleteClient);

export default router;
