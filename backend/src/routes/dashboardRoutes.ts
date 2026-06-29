import { Router } from 'express';
import {
  getStats,
  getRevenueChart,
  getTopProducts,
  getRecentSales,
  getStockStats,
} from '../controllers/dashboardController';
import { authenticate } from '../middleware/auth';
import { tenantMiddleware } from '../middleware/tenant';

const router = Router();

router.use(authenticate, tenantMiddleware);

router.get('/stats', getStats);
router.get('/revenue', getRevenueChart);
router.get('/top-products', getTopProducts);
router.get('/recent-sales', getRecentSales);
router.get('/stock-stats', getStockStats);

export default router;
