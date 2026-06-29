import { Request, Response, NextFunction } from 'express';
import { validationResult, body } from 'express-validator';

export function validate(req: Request, res: Response, next: NextFunction): void {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({
      success: false,
      message: 'Erreur de validation',
      errors: errors.array().map((e) => ({
        field: (e as any).path || (e as any).param,
        message: e.msg,
      })),
    });
    return;
  }
  next();
}

export const productRules = [
  body('name').notEmpty().withMessage('Le nom est requis'),
  body('sku').optional({ values: 'falsy' }),
  body('price').notEmpty().withMessage('Le prix est requis')
    .isNumeric().withMessage('Le prix doit être un nombre')
    .isFloat({ min: 0 }).withMessage('Le prix doit être positif'),
];

export const saleRules = [
  body('items').isArray({ min: 1 }).withMessage('Les articles sont requis'),
  body('paymentMethod').notEmpty().withMessage('Le mode de paiement est requis'),
];

export const clientRules = [
  body('firstName').notEmpty().withMessage('Le prénom est requis'),
  body('lastName').notEmpty().withMessage('Le nom est requis'),
];

export const authRules = [
  body('email').notEmpty().withMessage('L\'email est requis')
    .isEmail().withMessage('Email invalide'),
  body('password').notEmpty().withMessage('Le mot de passe est requis')
    .isLength({ min: 6 }).withMessage('Le mot de passe doit contenir au moins 6 caractères'),
];

export const categoryRules = [
  body('name').notEmpty().withMessage('Le nom est requis'),
];
