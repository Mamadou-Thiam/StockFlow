import { Router } from 'express';
import multer from 'multer';
import {
  getCompany,
  updateCompany,
  uploadLogo,
} from '../controllers/companyController';
import { authenticate } from '../middleware/auth';
import { tenantMiddleware } from '../middleware/tenant';
import { authorize } from '../middleware/roles';

const upload = multer({ dest: 'uploads/logos' });
const router = Router();

router.use(authenticate, tenantMiddleware);

router.get('/', getCompany);
router.put('/', authorize('admin', 'super_admin'), updateCompany);
router.post('/logo', authorize('admin', 'super_admin'), upload.single('logo'), uploadLogo);

export default router;
