import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';

export function errorHandler(
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Erreur interne du serveur';
  let errors: any = undefined;

  if (err instanceof mongoose.Error.ValidationError) {
    statusCode = 400;
    message = 'Erreur de validation';
    errors = Object.keys(err.errors).reduce((acc: any, key: string) => {
      acc[key] = err.errors[key].message;
      return acc;
    }, {});
  } else if (err instanceof mongoose.Error.CastError) {
    statusCode = 400;
    message = 'ID invalide';
  }

  const response: { success: false; message: string; errors?: any; stack?: string } = {
    success: false,
    message,
    errors,
  };

  if (process.env.NODE_ENV === 'development') {
    response.stack = err.stack;
  }

  res.status(statusCode).json(response);
}
