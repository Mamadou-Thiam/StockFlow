import { Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { AuthRequest } from '../middleware/auth';
import { Product, Sale, Invoice, InventoryMovement, Client } from '../models';
import { logActivity } from '../services';
import { calculateTotals, generateInvoiceNumber, paginate } from '../utils/helpers';

export async function createSale(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { items, discount = 0, discountType = 'percentage', paymentMethod, clientId, notes } = req.body;

    if (!items || items.length === 0) {
      res.status(400).json({ success: false, message: 'La vente doit contenir au moins un article' });
      return;
    }

    const enrichedItems: Array<{
      productId: string;
      name: string;
      sku: string;
      quantity: number;
      unitPrice: number;
      taxRate: number;
      taxAmount: number;
      total: number;
    }> = [];

    for (const item of items) {
      const product = await Product.findOne({ _id: item.productId, companyId: req.user!.companyId });
      if (!product) {
        res.status(404).json({ success: false, message: `Produit ${item.productId} non trouvé` });
        return;
      }
      if (product.quantity < item.quantity) {
        res.status(400).json({
          success: false,
          message: `Stock insuffisant pour ${product.name}. Disponible: ${product.quantity}`,
        });
        return;
      }

      enrichedItems.push({
        productId: product._id.toString(),
        name: product.name,
        sku: product.sku,
        quantity: item.quantity,
        unitPrice: item.unitPrice || product.price,
        taxRate: item.taxRate ?? product.taxRate,
        taxAmount: 0,
        total: 0,
      });
    }

    const totals = calculateTotals(
      enrichedItems.map((i) => ({ quantity: i.quantity, unitPrice: i.unitPrice, taxRate: i.taxRate })),
      discount,
      discountType
    );

    enrichedItems.forEach((item, idx) => {
      const raw = totals.subtotal > 0 ? (item.quantity * item.unitPrice) / totals.subtotal : 0;
      item.taxAmount = Math.round(totals.taxTotal * raw * 100) / 100;
      item.total = item.quantity * item.unitPrice + item.taxAmount;
    });

    const invoiceNumber = await generateInvoiceNumber(req.user!.companyId);

    const sale = await Sale.create({
      companyId: req.user!.companyId,
      invoiceNumber,
      items: enrichedItems,
      subtotal: totals.subtotal,
      taxTotal: totals.taxTotal,
      discount,
      discountType,
      total: totals.total,
      paymentMethod,
      status: 'completed',
      clientId: clientId || undefined,
      userId: req.user!.id,
      notes,
    });

    for (const item of enrichedItems) {
      await Product.findByIdAndUpdate(item.productId, { $inc: { quantity: -item.quantity } });
      await InventoryMovement.create({
        companyId: req.user!.companyId,
        productId: item.productId,
        type: 'out',
        quantity: item.quantity,
        reference: `SALE-${sale._id}`,
        notes: `Vente #${invoiceNumber}`,
        userId: req.user!.id,
      });
    }

    await Invoice.create({
      companyId: req.user!.companyId,
      invoiceNumber,
      saleId: sale._id,
      clientId: clientId || undefined,
      items: enrichedItems,
      subtotal: totals.subtotal,
      taxTotal: totals.taxTotal,
      discount,
      total: totals.total,
      status: 'paid',
      paidAt: new Date(),
      userId: req.user!.id,
    });

    if (clientId) {
      await Client.findByIdAndUpdate(clientId, { $inc: { totalPurchases: 1 } });
    }

    logActivity({
      companyId: req.user!.companyId,
      userId: req.user!.id,
      action: 'sale.created',
      entityType: 'Sale',
      entityId: sale._id.toString(),
      details: `Vente #${invoiceNumber} - ${totals.total} CFA`,
    });

    res.status(201).json({ success: true, data: sale });
  } catch (error) {
    next(error);
  }
}

export async function getSales(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { page, limit, startDate, endDate, status } = req.query;
    const { skip, limit: pageLimit } = paginate(Number(page) || 1, Number(limit) || 20);

    const filter: any = { companyId: req.user!.companyId };

    if (status) {
      filter.status = status;
    }

    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate as string);
      if (endDate) filter.createdAt.$lte = new Date(endDate as string);
    }

    const [items, total] = await Promise.all([
      Sale.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(pageLimit)
        .populate('clientId', 'firstName lastName email')
        .populate('userId', 'firstName lastName'),
      Sale.countDocuments(filter),
    ]);

    const currentPage = Number(page) || 1;
    res.json({
      success: true,
      data: {
        items,
        total,
        page: currentPage,
        limit: pageLimit,
        pages: Math.ceil(total / pageLimit),
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function getSale(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const sale = await Sale.findOne({ _id: req.params.id, companyId: req.user!.companyId })
      .populate('clientId', 'firstName lastName email phone')
      .populate('userId', 'firstName lastName email');
    if (!sale) {
      res.status(404).json({ success: false, message: 'Vente non trouvée' });
      return;
    }
    res.json({ success: true, data: sale });
  } catch (error) {
    next(error);
  }
}

export async function returnSale(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const sale = await Sale.findOne({ _id: req.params.id, companyId: req.user!.companyId });
    if (!sale) {
      res.status(404).json({ success: false, message: 'Vente non trouvée' });
      return;
    }
    if (sale.status === 'returned') {
      res.status(400).json({ success: false, message: 'Cette vente a déjà été retournée' });
      return;
    }
    if (sale.status === 'cancelled') {
      res.status(400).json({ success: false, message: 'Cette vente est annulée' });
      return;
    }

    for (const item of sale.items) {
      await Product.findByIdAndUpdate(item.productId, { $inc: { quantity: item.quantity } });
      await InventoryMovement.create({
        companyId: req.user!.companyId,
        productId: item.productId,
        type: 'in',
        quantity: item.quantity,
        reference: `RETURN-${sale._id}`,
        notes: `Retour vente #${sale.invoiceNumber}`,
        userId: req.user!.id,
      });
    }

    sale.status = 'returned';
    sale.returnedAt = new Date();
    await sale.save();

    await Invoice.findOneAndUpdate(
      { saleId: sale._id, companyId: req.user!.companyId },
      { $set: { status: 'cancelled' } }
    );

    if (sale.clientId) {
      await Client.findByIdAndUpdate(sale.clientId, { $inc: { totalPurchases: -1 } });
    }

    logActivity({
      companyId: req.user!.companyId,
      userId: req.user!.id,
      action: 'sale.returned',
      entityType: 'Sale',
      entityId: sale._id.toString(),
      details: `Retour vente #${sale.invoiceNumber}`,
    });

    res.json({ success: true, data: sale });
  } catch (error) {
    next(error);
  }
}

export async function getSalesStats(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { period = 'daily' } = req.query;

    const match: any = {
      companyId: new mongoose.Types.ObjectId(req.user!.companyId),
      status: 'completed',
    };

    let group: any;
    if (period === 'monthly') {
      group = {
        year: { $year: '$createdAt' },
        month: { $month: '$createdAt' },
      };
    } else {
      group = {
        year: { $year: '$createdAt' },
        month: { $month: '$createdAt' },
        day: { $dayOfMonth: '$createdAt' },
      };
    }

    const stats = await Sale.aggregate([
      { $match: match },
      {
        $group: {
          _id: group,
          count: { $sum: 1 },
          total: { $sum: '$total' },
          taxTotal: { $sum: '$taxTotal' },
          subtotal: { $sum: '$subtotal' },
        },
      },
      { $sort: { '_id.year': -1, '_id.month': -1, '_id.day': -1 } },
      { $limit: 90 },
    ]);

    res.json({ success: true, data: stats });
  } catch (error) {
    next(error);
  }
}
