import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { Product } from '../models';
import { parseExcelBuffer, exportProductsToExcel } from '../services/excelService';
import { paginate } from '../utils/helpers';

export async function getProducts(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { page, limit, search, categoryId, stockAlert } = req.query;
    const { skip, limit: pageLimit } = paginate(Number(page) || 1, Number(limit) || 20);

    const filter: any = { companyId: req.user!.companyId, isActive: true };

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { sku: { $regex: search, $options: 'i' } },
        { barcode: { $regex: search, $options: 'i' } },
      ];
    }

    if (categoryId) {
      filter.categoryId = categoryId;
    }

    if (stockAlert === 'true') {
      filter.$expr = { $lte: ['$quantity', '$minStock'] };
    }

    const [items, total] = await Promise.all([
      Product.find(filter).sort({ createdAt: -1 }).skip(skip).limit(pageLimit).populate('categoryId', 'name color'),
      Product.countDocuments(filter),
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

export async function getProduct(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const product = await Product.findOne({ _id: req.params.id, companyId: req.user!.companyId }).populate('categoryId', 'name color');
    if (!product) {
      res.status(404).json({ success: false, message: 'Produit non trouvé' });
      return;
    }
    res.json({ success: true, data: product });
  } catch (error) {
    next(error);
  }
}

export async function createProduct(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { sku, ...data } = req.body;

    let productSku = sku;
    if (!productSku) {
      const count = await Product.countDocuments({ companyId: req.user!.companyId });
      productSku = `SKU-${(count + 1).toString().padStart(5, '0')}`;
    }

    const existing = await Product.findOne({ companyId: req.user!.companyId, sku: productSku });
    if (existing) {
      res.status(409).json({ success: false, message: 'Un produit avec ce SKU existe déjà' });
      return;
    }

    const product = await Product.create({ ...data, sku: productSku, companyId: req.user!.companyId });
    res.status(201).json({ success: true, data: product });
  } catch (error) {
    next(error);
  }
}

export async function updateProduct(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const product = await Product.findOneAndUpdate(
      { _id: req.params.id, companyId: req.user!.companyId },
      { $set: req.body },
      { new: true, runValidators: true }
    );
    if (!product) {
      res.status(404).json({ success: false, message: 'Produit non trouvé' });
      return;
    }
    res.json({ success: true, data: product });
  } catch (error) {
    next(error);
  }
}

export async function deleteProduct(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const product = await Product.findOneAndUpdate(
      { _id: req.params.id, companyId: req.user!.companyId },
      { $set: { isActive: false } },
      { new: true }
    );
    if (!product) {
      res.status(404).json({ success: false, message: 'Produit non trouvé' });
      return;
    }
    res.json({ success: true, data: product });
  } catch (error) {
    next(error);
  }
}

export async function getLowStockProducts(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const products = await Product.find({
      companyId: req.user!.companyId,
      isActive: true,
      $expr: { $lte: ['$quantity', '$minStock'] },
    }).populate('categoryId', 'name color').sort({ quantity: 1 });

    res.json({ success: true, data: products });
  } catch (error) {
    next(error);
  }
}

export async function importExcel(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    if (!req.file) {
      res.status(400).json({ success: false, message: 'Fichier requis' });
      return;
    }

    const rows = parseExcelBuffer(req.file.buffer);
    const products = [];

    for (const row of rows) {
      let sku = row.sku;
      if (!sku) {
        const count = await Product.countDocuments({ companyId: req.user!.companyId });
        sku = `SKU-${(count + products.length + 1).toString().padStart(5, '0')}`;
      }

      products.push({
        companyId: req.user!.companyId,
        name: row.name,
        sku,
        barcode: row.barcode,
        price: Number(row.price) || 0,
        costPrice: row.costPrice ? Number(row.costPrice) : undefined,
        taxRate: Number(row.taxRate) || 0,
        unit: row.unit || 'pcs',
        quantity: Number(row.quantity) || 0,
        minStock: Number(row.minStock) || 5,
        description: row.description,
      });
    }

    const created = await Product.insertMany(products, { ordered: false });

    res.status(201).json({ success: true, data: { count: created.length } });
  } catch (error) {
    next(error);
  }
}

export async function exportExcel(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const products = await Product.find({ companyId: req.user!.companyId, isActive: true }).lean();

    const buffer = exportProductsToExcel(products);

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=products.xlsx');
    res.send(buffer);
  } catch (error) {
    next(error);
  }
}
