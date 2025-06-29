// Types Express explicites pour éviter les erreurs d'inférence
import { Application, Request, Response, NextFunction } from 'express';

declare global {
  namespace Express {
    interface Application {
      // Extensions personnalisées si nécessaire
    }
    
    interface Request {
      user?: unknown;
      // Autres extensions
    }
  }
}

export { Application, Request, Response, NextFunction };