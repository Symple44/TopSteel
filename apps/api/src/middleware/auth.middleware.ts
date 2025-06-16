// apps/api/src/middleware/auth.middleware.ts
import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { PrismaService } from '../services/prisma.service'

export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '')
    if (!token) {
      return res.status(401).json({ message: 'Token manquant' })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any
    const user = await new PrismaService().user.findUnique({
      where: { id: decoded.userId },
    })

    if (!user) {
      return res.status(401).json({ message: 'Utilisateur non trouvé' })
    }

    req.user = user
    next()
  } catch (error) {
    res.status(401).json({ message: 'Token invalide' })
  }
}
