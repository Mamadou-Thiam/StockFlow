import { Router } from 'express';
import {
  getInvoices,
  getInvoice,
  generatePdf,
  sendByEmail,
  updateStatus,
  getNextInvoiceNumber,
} from '../controllers/invoiceController';
import { authenticate } from '../middleware/auth';
import { tenantMiddleware } from '../middleware/tenant';

const router = Router();

router.use(authenticate, tenantMiddleware);

router.get('/', getInvoices);
router.get('/next-number', getNextInvoiceNumber);
router.get('/:id', getInvoice);
router.get('/:id/pdf', generatePdf);
router.post('/:id/send', sendByEmail);
router.patch('/:id/status', updateStatus);

export default router;
