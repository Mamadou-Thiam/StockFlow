import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { Company } from '../models';

export async function getCompany(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const company = await Company.findById(req.user!.companyId);
    if (!company) {
      res.status(404).json({ success: false, message: 'Entreprise non trouvée' });
      return;
    }
    res.json({ success: true, data: company });
  } catch (error) {
    next(error);
  }
}

export async function updateCompany(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { name, address, logo, colors } = req.body;

    const company = await Company.findByIdAndUpdate(
      req.user!.companyId,
      { $set: { name, address, logo, colors } },
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

export async function uploadLogo(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    if (!req.file) {
      res.status(400).json({ success: false, message: 'Fichier requis' });
      return;
    }

    const logoPath = req.file.path;

    const company = await Company.findByIdAndUpdate(
      req.user!.companyId,
      { $set: { logo: logoPath } },
      { new: true }
    );

    if (!company) {
      res.status(404).json({ success: false, message: 'Entreprise non trouvée' });
      return;
    }

    res.json({ success: true, data: { logo: company.logo } });
  } catch (error) {
    next(error);
  }
}
