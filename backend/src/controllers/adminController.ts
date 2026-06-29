import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { Company, User, Product, Client, Sale, Invoice } from '../models';

export async function getAdminCompanies(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { page = 1, limit = 20, search, status } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const filter: any = {};
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }
    if (status === 'active') filter.isActive = true;
    if (status === 'inactive') filter.isActive = false;

    const [items, total] = await Promise.all([
      Company.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      Company.countDocuments(filter),
    ]);

    const companiesWithStats = await Promise.all(
      items.map(async (company) => {
        const [userCount, productCount, saleCount] = await Promise.all([
          User.countDocuments({ companyId: company._id }),
          Product.countDocuments({ companyId: company._id }),
          Sale.countDocuments({ companyId: company._id }),
        ]);
        return {
          ...company,
          stats: { userCount, productCount, saleCount },
        };
      })
    );

    res.json({
      success: true,
      data: {
        items: companiesWithStats,
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function getAdminCompany(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const company = await Company.findById(req.params.id).lean();
    if (!company) {
      res.status(404).json({ success: false, message: 'Entreprise non trouvée' });
      return;
    }

    const [userCount, productCount, clientCount, saleCount, invoiceCount] = await Promise.all([
      User.countDocuments({ companyId: company._id }),
      Product.countDocuments({ companyId: company._id }),
      Client.countDocuments({ companyId: company._id }),
      Sale.countDocuments({ companyId: company._id }),
      Invoice.countDocuments({ companyId: company._id }),
    ]);

    const users = await User.find({ companyId: company._id })
      .select('-password -refreshToken')
      .sort({ createdAt: -1 })
      .lean();

    res.json({
      success: true,
      data: {
        ...company,
        stats: { userCount, productCount, clientCount, saleCount, invoiceCount },
        users,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function updateAdminCompany(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { name, email, phone, isActive, colors } = req.body;

    const company = await Company.findByIdAndUpdate(
      req.params.id,
      { $set: { name, email, phone, isActive, colors } },
      { new: true, runValidators: true }
    );

    if (!company) {
      res.status(404).json({ success: false, message: 'Entreprise non trouvée' });
      return;
    }

    res.json({ success: true, data: company });
  } catch (error) {
    next(error);
  }
}

export async function deleteAdminCompany(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const company = await Company.findByIdAndUpdate(
      req.params.id,
      { $set: { isActive: false } },
      { new: true }
    );

    if (!company) {
      res.status(404).json({ success: false, message: 'Entreprise non trouvée' });
      return;
    }

    await User.updateMany(
      { companyId: company._id },
      { $set: { isActive: false } }
    );

    res.json({ success: true, data: company });
  } catch (error) {
    next(error);
  }
}

export async function getAdminCompanyUsers(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const company = await Company.findById(req.params.id);
    if (!company) {
      res.status(404).json({ success: false, message: 'Entreprise non trouvée' });
      return;
    }

    const { page = 1, limit = 50 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const [items, total] = await Promise.all([
      User.find({ companyId: company._id })
        .select('-password -refreshToken')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      User.countDocuments({ companyId: company._id }),
    ]);

    res.json({
      success: true,
      data: {
        items,
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function getAdminStats(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const [
      totalCompanies,
      activeCompanies,
      totalUsers,
      totalProducts,
      totalSales,
      totalInvoices,
      recentCompanies,
    ] = await Promise.all([
      Company.countDocuments(),
      Company.countDocuments({ isActive: true }),
      User.countDocuments(),
      Product.countDocuments(),
      Sale.countDocuments(),
      Invoice.countDocuments(),
      Company.find().sort({ createdAt: -1 }).limit(5).lean(),
    ]);

    const companiesWithUsers = await Promise.all(
      recentCompanies.map(async (company) => {
        const userCount = await User.countDocuments({ companyId: company._id });
        return { ...company, stats: { userCount } };
      })
    );

    res.json({
      success: true,
      data: {
        totalCompanies,
        activeCompanies,
        totalUsers,
        totalProducts,
        totalSales,
        totalInvoices,
        recentCompanies: companiesWithUsers,
      },
    });
  } catch (error) {
    next(error);
  }
}
