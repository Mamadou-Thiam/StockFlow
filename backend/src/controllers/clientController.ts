import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { Client, Sale } from '../models';
import { paginate } from '../utils/helpers';

export async function getClients(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { page, limit, search } = req.query;
    const { skip, limit: pageLimit } = paginate(Number(page) || 1, Number(limit) || 20);

    const filter: any = { companyId: req.user!.companyId, isActive: true };

    if (search) {
      filter.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { company: { $regex: search, $options: 'i' } },
      ];
    }

    const [items, total] = await Promise.all([
      Client.find(filter).sort({ createdAt: -1 }).skip(skip).limit(pageLimit),
      Client.countDocuments(filter),
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

export async function getClient(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const client = await Client.findOne({ _id: req.params.id, companyId: req.user!.companyId });
    if (!client) {
      res.status(404).json({ success: false, message: 'Client non trouvé' });
      return;
    }

    const sales = await Sale.find({ companyId: req.user!.companyId, clientId: client._id })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    res.json({ success: true, data: { client, purchaseHistory: sales } });
  } catch (error) {
    next(error);
  }
}

export async function createClient(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const client = await Client.create({ ...req.body, companyId: req.user!.companyId });
    res.status(201).json({ success: true, data: client });
  } catch (error) {
    next(error);
  }
}

export async function updateClient(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const client = await Client.findOneAndUpdate(
      { _id: req.params.id, companyId: req.user!.companyId },
      { $set: req.body },
      { new: true, runValidators: true }
    );
    if (!client) {
      res.status(404).json({ success: false, message: 'Client non trouvé' });
      return;
    }
    res.json({ success: true, data: client });
  } catch (error) {
    next(error);
  }
}

export async function deleteClient(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const client = await Client.findOneAndUpdate(
      { _id: req.params.id, companyId: req.user!.companyId },
      { $set: { isActive: false } },
      { new: true }
    );
    if (!client) {
      res.status(404).json({ success: false, message: 'Client non trouvé' });
      return;
    }
    res.json({ success: true, data: client });
  } catch (error) {
    next(error);
  }
}
