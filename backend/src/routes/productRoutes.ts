import { Router } from 'express';
import multer from 'multer';
import {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  getLowStockProducts,
  importExcel,
  exportExcel,
} from '../controllers/productController';
import { authenticate } from '../middleware/auth';
import { tenantMiddleware } from '../middleware/tenant';
import { authorize } from '../middleware/roles';
import { validate, productRules } from '../middleware/validate';

const upload = multer({ storage: multer.memoryStorage() });
const router = Router();

router.use(authenticate, tenantMiddleware);

router.get('/', getProducts);
router.get('/low-stock', getLowStockProducts);
router.get('/export', exportExcel);
router.get('/:id', getProduct);
router.post('/', authorize('admin', 'super_admin'), productRules, validate, createProduct);
router.post('/import', authorize('admin', 'super_admin'), upload.single('file'), importExcel);
router.put('/:id', authorize('admin', 'super_admin'), productRules, validate, updateProduct);
router.delete('/:id', authorize('admin', 'super_admin'), deleteProduct);

export default router;
