import { Router } from 'express';
import {
  getAdminCompanies,
  getAdminCompany,
  updateAdminCompany,
  deleteAdminCompany,
  getAdminCompanyUsers,
  getAdminStats,
} from '../controllers/adminController';
import { authenticate } from '../middleware/auth';
import { authorize } from '../middleware/roles';

const router = Router();

router.use(authenticate, authorize('super_admin'));

router.get('/companies', getAdminCompanies);
router.get('/companies/:id', getAdminCompany);
router.put('/companies/:id', updateAdminCompany);
router.delete('/companies/:id', deleteAdminCompany);
router.get('/companies/:id/users', getAdminCompanyUsers);
router.get('/stats', getAdminStats);

export default router;
