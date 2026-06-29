import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { AuthRequest } from '../middleware/auth';
import { Company, User } from '../models';
import { sendWelcomeEmail, sendPasswordResetEmail, logActivity } from '../services';
import config from '../config';

function generateTokens(user: { id: string; companyId: string; role: string; email: string }) {
  const accessToken = jwt.sign(
    { id: user.id, companyId: user.companyId, role: user.role, email: user.email },
    config.jwtSecret,
    { expiresIn: config.jwtExpiresIn as any }
  );
  const refreshToken = jwt.sign(
    { id: user.id, companyId: user.companyId, role: user.role, email: user.email },
    config.jwtSecret,
    { expiresIn: '30d' }
  );
  return { accessToken, refreshToken };
}

export async function register(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { companyName, email, phone, firstName, lastName, password } = req.body;

    const company = await Company.create({
      name: companyName,
      email,
      phone,
    });

    const user = await User.create({
      companyId: company._id,
      firstName,
      lastName,
      email,
      password,
      role: 'admin',
    });

    const tokens = generateTokens({
      id: user._id.toString(),
      companyId: company._id.toString(),
      role: user.role,
      email: user.email,
    });

    user.refreshToken = tokens.refreshToken;
    await user.save();

    sendWelcomeEmail(user.email, company.name).catch(console.error);

    logActivity({
      companyId: company._id.toString(),
      userId: user._id.toString(),
      action: 'company.registered',
      entityType: 'Company',
      entityId: company._id.toString(),
      details: `Company "${company.name}" registered by ${user.email}`,
    });

    res.status(201).json({
      success: true,
      data: {
        company: { id: company._id, name: company.name, email: company.email },
        user: { id: user._id, firstName: user.firstName, lastName: user.lastName, email: user.email, role: user.role },
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function login(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).populate('companyId');
    if (!user) {
      res.status(401).json({ success: false, message: 'Email ou mot de passe incorrect' });
      return;
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      res.status(401).json({ success: false, message: 'Email ou mot de passe incorrect' });
      return;
    }

    const company = await Company.findById(user.companyId);
    if (!company || !company.isActive) {
      res.status(403).json({ success: false, message: 'Compte entreprise désactivé' });
      return;
    }

    if (!user.isActive) {
      res.status(403).json({ success: false, message: 'Utilisateur désactivé' });
      return;
    }

    const tokens = generateTokens({
      id: user._id.toString(),
      companyId: company._id.toString(),
      role: user.role,
      email: user.email,
    });

    user.refreshToken = tokens.refreshToken;
    await user.save();

    logActivity({
      companyId: company._id.toString(),
      userId: user._id.toString(),
      action: 'user.login',
      entityType: 'User',
      entityId: user._id.toString(),
    });

    res.json({
      success: true,
      data: {
        user: { id: user._id, firstName: user.firstName, lastName: user.lastName, email: user.email, role: user.role },
        company: { id: company._id, name: company.name, email: company.email, logo: company.logo, colors: company.colors },
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function refreshToken(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { refreshToken: token } = req.body;
    if (!token) {
      res.status(400).json({ success: false, message: 'Refresh token requis' });
      return;
    }

    const decoded = jwt.verify(token, config.jwtSecret) as { id: string; companyId: string; role: string; email: string };
    const user = await User.findById(decoded.id);
    if (!user || user.refreshToken !== token) {
      res.status(401).json({ success: false, message: 'Refresh token invalide' });
      return;
    }

    const tokens = generateTokens({
      id: user._id.toString(),
      companyId: user.companyId.toString(),
      role: user.role,
      email: user.email,
    });

    user.refreshToken = tokens.refreshToken;
    await user.save();

    res.json({
      success: true,
      data: { accessToken: tokens.accessToken, refreshToken: tokens.refreshToken },
    });
  } catch (error) {
    next(error);
  }
}

export async function forgotPassword(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      res.json({ success: true, message: 'Si cet email existe, un lien de réinitialisation a été envoyé' });
      return;
    }

    const resetToken = jwt.sign({ id: user._id.toString() }, config.jwtSecret, { expiresIn: '1h' });

    await sendPasswordResetEmail(user.email, resetToken);

    res.json({
      success: true,
      message: 'Email de réinitialisation envoyé',
    });
  } catch (error) {
    next(error);
  }
}

export async function resetPassword(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { token, password } = req.body;

    const decoded = jwt.verify(token, config.jwtSecret) as { id: string };
    const user = await User.findById(decoded.id);
    if (!user) {
      res.status(400).json({ success: false, message: 'Token invalide ou expiré' });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);
    user.refreshToken = undefined;
    await user.save();

    res.json({ success: true, message: 'Mot de passe réinitialisé avec succès' });
  } catch (error) {
    next(error);
  }
}

export async function getProfile(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const user = await User.findById(req.user!.id).select('-password -refreshToken');
    if (!user) {
      res.status(404).json({ success: false, message: 'Utilisateur non trouvé' });
      return;
    }

    const company = await Company.findById(req.user!.companyId);

    res.json({
      success: true,
      data: { user, company },
    });
  } catch (error) {
    next(error);
  }
}

export async function updateProfile(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { firstName, lastName, email } = req.body;

    const user = await User.findByIdAndUpdate(
      req.user!.id,
      { $set: { firstName, lastName, email } },
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
