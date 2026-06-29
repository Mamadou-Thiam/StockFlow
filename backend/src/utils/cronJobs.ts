import cron from 'node-cron';
import { Product, Invoice, ActivityLog } from '../models';

export function initializeCronJobs(): void {
  cron.schedule('0 0 * * *', async () => {
    console.log('[CRON] Running daily low stock check...');
    try {
      const lowStockProducts = await Product.find({
        isActive: true,
        $expr: { $lte: ['$quantity', '$minStock'] },
      }).populate('companyId', 'name');

      for (const product of lowStockProducts) {
        const companyId = product.companyId?._id || product.companyId;
        if (companyId) {
          await ActivityLog.create({
            companyId,
            action: 'low_stock_alert',
            entityType: 'Product',
            entityId: product._id,
            details: `Product "${product.name}" (SKU: ${product.sku}) has low stock: ${product.quantity} remaining (min: ${product.minStock})`,
          });
        }
      }

      console.log(`[CRON] Low stock check complete. ${lowStockProducts.length} products alerted.`);
    } catch (error) {
      console.error('[CRON] Low stock check error:', error);
    }
  });

  cron.schedule('0 0 * * *', async () => {
    console.log('[CRON] Running overdue invoice check...');
    try {
      const now = new Date();
      const result = await Invoice.updateMany(
        {
          status: 'sent',
          dueDate: { $lt: now },
        },
        { $set: { status: 'overdue' } }
      );

      if (result.modifiedCount > 0) {
        console.log(`[CRON] Marked ${result.modifiedCount} invoices as overdue.`);
      }
    } catch (error) {
      console.error('[CRON] Overdue invoice check error:', error);
    }
  });
}
