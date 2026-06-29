import { Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { AuthRequest } from '../middleware/auth';
import { Category, Product } from '../models';

export async function getCategories(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const categories = await Category.aggregate([
      { $match: { companyId: new mongoose.Types.ObjectId(req.user!.companyId), isActive: true } },
      {
        $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: 'categoryId',
          as: 'products',
        },
      },
      {
        $addFields: {
          productCount: { $size: '$products' },
        },
      },
      { $project: { products: 0 } },
      { $sort: { name: 1 } },
    ]);

    res.json({ success: true, data: categories });
  } catch (error) {
    next(error);
  }
}

export async function createCategory(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { name, description, color } = req.body;

    const existing = await Category.findOne({ companyId: req.user!.companyId, name });
    if (existing) {
      res.status(409).json({ success: false, message: 'Cette catégorie existe déjà' });
      return;
    }

    const category = await Category.create({ companyId: req.user!.companyId, name, description, color });
    res.status(201).json({ success: true, data: category });
  } catch (error) {
    next(error);
  }
}

export async function updateCategory(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const category = await Category.findOneAndUpdate(
      { _id: req.params.id, companyId: req.user!.companyId },
      { $set: req.body },
      { new: true, runValidators: true }
    );
    if (!category) {
      res.status(404).json({ success: false, message: 'Catégorie non trouvée' });
      return;
    }
    res.json({ success: true, data: category });
  } catch (error) {
    next(error);
  }
}

export async function deleteCategory(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const productsCount = await Product.countDocuments({
      companyId: req.user!.companyId,
      categoryId: req.params.id,
      isActive: true,
    });
    if (productsCount > 0) {
      res.status(400).json({
        success: false,
        message: `Impossible de supprimer: ${productsCount} produit(s) sont liés à cette catégorie`,
      });
      return;
    }

    const category = await Category.findOneAndUpdate(
      { _id: req.params.id, companyId: req.user!.companyId },
      { $set: { isActive: false } },
      { new: true }
    );
    if (!category) {
      res.status(404).json({ success: false, message: 'Catégorie non trouvée' });
      return;
    }
    res.json({ success: true, data: category });
  } catch (error) {
    next(error);
  }
}
