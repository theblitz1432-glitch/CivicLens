import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import prisma from '../config/prisma';

const JWT_SECRET = process.env.JWT_SECRET || 'civiclens_secret';

export const protect = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer '))
      return res.status(401).json({ success: false, message: 'No token provided' });

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string; role: string };

    // Look up in the correct collection based on role in token
    let user: any = null;
    if (decoded.role === 'citizen') {
      user = await prisma.citizen.findUnique({ where: { id: decoded.id } });
    } else if (decoded.role === 'contractor') {
      user = await prisma.contractor.findUnique({ where: { id: decoded.id } });
    } else if (decoded.role === 'authority') {
      user = await prisma.authority.findUnique({ where: { id: decoded.id } });
    }

    if (!user)
      return res.status(401).json({ success: false, message: 'User not found' });

    (req as any).user = { id: decoded.id, role: decoded.role, name: user.name, email: user.email };
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
};

// Role-specific guards
export const citizenOnly    = (req: Request, res: Response, next: NextFunction) => {
  if ((req as any).user?.role !== 'citizen')    return res.status(403).json({ success: false, message: 'Citizens only' });
  next();
};
export const contractorOnly = (req: Request, res: Response, next: NextFunction) => {
  if ((req as any).user?.role !== 'contractor') return res.status(403).json({ success: false, message: 'Contractors only' });
  next();
};
export const authorityOnly  = (req: Request, res: Response, next: NextFunction) => {
  if ((req as any).user?.role !== 'authority')  return res.status(403).json({ success: false, message: 'Authorities only' });
  next();
};