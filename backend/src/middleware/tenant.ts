import { Response, NextFunction } from 'express';
import { Company } from '../models';
import { AuthRequest } from './auth';

export async function tenantMiddleware(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  if (req.user?.role === 'super_admin') {
    (req as any).companyId = req.user.companyId;
    return next();
  }

  const companyId = req.user?.companyId;

  if (!companyId) {
    res.status(401).json({ message: 'Entreprise non identifiée' });
    return;
  }

  const company = await Company.findById(companyId);

  if (!company) {
    res.status(404).json({ message: 'Entreprise non trouvée' });
    return;
  }

  if (!company.isActive) {
    res.status(403).json({ message: 'Compte entreprise désactivé' });
    return;
  }

  (req as any).companyId = companyId;
  next();
}
