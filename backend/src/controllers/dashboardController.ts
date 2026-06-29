import { Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { AuthRequest } from '../middleware/auth';
import { Product, Sale, Client, Invoice } from '../models';

export async function getStats(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const companyId = req.user!.companyId;
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(startOfDay);
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      totalProducts,
      lowStockCount,
      salesToday,
      salesThisWeek,
      salesThisMonth,
      revenueToday,
      revenueThisWeek,
      revenueThisMonth,
      totalClients,
      outstandingInvoices,
    ] = await Promise.all([
      Product.countDocuments({ companyId, isActive: true }),
      Product.countDocuments({ companyId, isActive: true, $expr: { $lte: ['$quantity', '$minStock'] } }),
      Sale.countDocuments({ companyId, createdAt: { $gte: startOfDay }, status: 'completed' }),
      Sale.countDocuments({ companyId, createdAt: { $gte: startOfWeek }, status: 'completed' }),
      Sale.countDocuments({ companyId, createdAt: { $gte: startOfMonth }, status: 'completed' }),
      Sale.aggregate([
        { $match: { companyId: new mongoose.Types.ObjectId(companyId), createdAt: { $gte: startOfDay }, status: 'completed' } },
        { $group: { _id: null, total: { $sum: '$total' } } },
      ]),
      Sale.aggregate([
        { $match: { companyId: new mongoose.Types.ObjectId(companyId), createdAt: { $gte: startOfWeek }, status: 'completed' } },
        { $group: { _id: null, total: { $sum: '$total' } } },
      ]),
      Sale.aggregate([
        { $match: { companyId: new mongoose.Types.ObjectId(companyId), createdAt: { $gte: startOfMonth }, status: 'completed' } },
        { $group: { _id: null, total: { $sum: '$total' } } },
      ]),
      Client.countDocuments({ companyId, isActive: true }),
      Invoice.countDocuments({ companyId, status: { $in: ['draft', 'sent', 'overdue'] } }),
    ]);

    res.json({
      success: true,
      data: {
        totalProducts,
        lowStockCount,
        totalSalesToday: salesToday,
        totalSalesWeek: salesThisWeek,
        totalSalesMonth: salesThisMonth,
        revenueToday: revenueToday[0]?.total || 0,
        revenueWeek: revenueThisWeek[0]?.total || 0,
        revenueMonth: revenueThisMonth[0]?.total || 0,
        totalClients,
        outstandingInvoices,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function getRevenueChart(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const revenue = await Sale.aggregate([
      {
        $match: {
          companyId: new mongoose.Types.ObjectId(req.user!.companyId),
          createdAt: { $gte: thirtyDaysAgo },
          status: 'completed',
        },
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' },
          },
          revenue: { $sum: '$total' },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } },
    ]);

    res.json({ success: true, data: revenue });
  } catch (error) {
    next(error);
  }
}

export async function getTopProducts(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const topProducts = await Sale.aggregate([
      { $match: { companyId: new mongoose.Types.ObjectId(req.user!.companyId), status: 'completed' } },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.productId',
          name: { $first: '$items.name' },
          sku: { $first: '$items.sku' },
          totalQuantity: { $sum: '$items.quantity' },
          totalRevenue: { $sum: '$items.total' },
        },
      },
      { $sort: { totalQuantity: -1 } },
      { $limit: 10 },
    ]);

    res.json({ success: true, data: topProducts });
  } catch (error) {
    next(error);
  }
}

export async function getRecentSales(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const sales = await Sale.find({ companyId: req.user!.companyId })
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('clientId', 'firstName lastName')
      .populate('userId', 'firstName lastName');

    res.json({ success: true, data: sales });
  } catch (error) {
    next(error);
  }
}

export async function getStockStats(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const stats = await Product.aggregate([
      { $match: { companyId: new mongoose.Types.ObjectId(req.user!.companyId), isActive: true } },
      {
        $group: {
          _id: '$categoryId',
          count: { $sum: 1 },
          totalQuantity: { $sum: '$quantity' },
          totalValue: { $sum: { $multiply: ['$quantity', '$price'] } },
        },
      },
      {
        $lookup: {
          from: 'categories',
          localField: '_id',
          foreignField: '_id',
          as: 'category',
        },
      },
      { $unwind: { path: '$category', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          categoryName: { $ifNull: ['$category.name', 'Non catégorisé'] },
          categoryColor: '$category.color',
          count: 1,
          totalQuantity: 1,
          totalValue: 1,
        },
      },
      { $sort: { count: -1 } },
    ]);

    res.json({ success: true, data: stats });
  } catch (error) {
    next(error);
  }
}
