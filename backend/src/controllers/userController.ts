import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { User } from '../models';

export async function getUsers(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { page = 1, limit = 50 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const [items, total] = await Promise.all([
      User.find({ companyId: req.user!.companyId })
        .select('-password -refreshToken')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      User.countDocuments({ companyId: req.user!.companyId }),
    ]);

    res.json({
      success: true,
      data: {
        items,
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function createUser(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { firstName, lastName, email, password, role } = req.body;

    const existing = await User.findOne({ companyId: req.user!.companyId, email });
    if (existing) {
      res.status(409).json({ success: false, message: 'Un utilisateur avec cet email existe déjà' });
      return;
    }

    const user = await User.create({
      companyId: req.user!.companyId,
      firstName,
      lastName,
      email,
      password,
      role: role || 'cashier',
    });

    const userObj = user.toObject();
    delete (userObj as any).password;
    delete (userObj as any).refreshToken;

    res.status(201).json({ success: true, data: userObj });
  } catch (error) {
    next(error);
  }
}

export async function updateUser(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { firstName, lastName, email, role, isActive } = req.body;

    const user = await User.findOneAndUpdate(
      { _id: req.params.id, companyId: req.user!.companyId },
      { $set: { firstName, lastName, email, role, isActive } },
      { new: true, runValidators: true }
    ).select('-password -refreshToken');

    if (!user) {
      res.status(404).json({ success: false, message: 'Utilisateur non trouvé' });
      return;
    }

    res.json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
}

export async function deleteUser(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const user = await User.findOneAndUpdate(
      { _id: req.params.id, companyId: req.user!.companyId },
      { $set: { isActive: false } },
      { new: true }
    ).select('-password -refreshToken');

    if (!user) {
      res.status(404).json({ success: false, message: 'Utilisateur non trouvé' });
      return;
    }

    res.json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
}
