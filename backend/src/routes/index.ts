import { Router } from 'express';
import authRoutes from './authRoutes';
import productRoutes from './productRoutes';
import categoryRoutes from './categoryRoutes';
import clientRoutes from './clientRoutes';
import saleRoutes from './saleRoutes';
import invoiceRoutes from './invoiceRoutes';
import dashboardRoutes from './dashboardRoutes';
import userRoutes from './userRoutes';
import companyRoutes from './companyRoutes';
import activityRoutes from './activityRoutes';
import adminRoutes from './adminRoutes';

const router = Router();

router.use('/admin', adminRoutes);
router.use('/auth', authRoutes);
router.use('/products', productRoutes);
router.use('/categories', categoryRoutes);
router.use('/clients', clientRoutes);
router.use('/sales', saleRoutes);
router.use('/invoices', invoiceRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/users', userRoutes);
router.use('/company', companyRoutes);
router.use('/activities', activityRoutes);

export default router;
