import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../config/prisma';

const JWT_SECRET  = process.env.JWT_SECRET  || 'civiclens_secret';
const JWT_EXPIRE  = process.env.JWT_EXPIRE   || '7d';

const signToken = (id: string, role: string) =>
  jwt.sign({ id, role }, JWT_SECRET, { expiresIn: JWT_EXPIRE } as jwt.SignOptions);

// ── CITIZEN REGISTER ──────────────────────────────────────────────────────
export const registerCitizen = async (req: Request, res: Response) => {
  try {
    const { name, email, phone, password, block, pincode } = req.body;
    if (!name || !email || !phone || !password)
      return res.status(400).json({ success: false, message: 'All fields required' });

    const exists = await prisma.citizen.findUnique({ where: { email } });
    if (exists) return res.status(400).json({ success: false, message: 'Email already registered' });

    const hashed = await bcrypt.hash(password, 12);
    const citizen = await prisma.citizen.create({
      data: { name, email, phone, password: hashed, block, pincode },
    });

    const token = signToken(citizen.id, 'citizen');
    res.status(201).json({
      success: true, token,
      user: { id: citizen.id, name: citizen.name, email: citizen.email, phone: citizen.phone, role: 'citizen', block: citizen.block },
    });
  } catch (err) {
    console.error('registerCitizen:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ── CITIZEN LOGIN ─────────────────────────────────────────────────────────
export const loginCitizen = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ success: false, message: 'Email and password required' });

    const citizen = await prisma.citizen.findUnique({ where: { email } });
    if (!citizen)
      return res.status(401).json({ success: false, message: 'No citizen account found with this email' });

    const match = await bcrypt.compare(password, citizen.password);
    if (!match)
      return res.status(401).json({ success: false, message: 'Incorrect password' });

    const token = signToken(citizen.id, 'citizen');
    res.json({
      success: true, token,
      user: { id: citizen.id, name: citizen.name, email: citizen.email, phone: citizen.phone, role: 'citizen', block: citizen.block },
    });
  } catch (err) {
    console.error('loginCitizen:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ── CONTRACTOR REGISTER ───────────────────────────────────────────────────
export const registerContractor = async (req: Request, res: Response) => {
  try {
    const { name, email, phone, password, companyName, registrationNo, address, licenseValidity, specializations } = req.body;
    if (!name || !email || !phone || !password || !companyName || !registrationNo)
      return res.status(400).json({ success: false, message: 'All fields required including company name and registration number' });

    const existsEmail = await prisma.contractor.findUnique({ where: { email } });
    if (existsEmail) return res.status(400).json({ success: false, message: 'Email already registered' });

    const existsReg = await prisma.contractor.findUnique({ where: { registrationNo } });
    if (existsReg) return res.status(400).json({ success: false, message: 'Registration number already exists' });

    const hashed = await bcrypt.hash(password, 12);
    const contractor = await prisma.contractor.create({
      data: {
        name, email, phone, password: hashed,
        companyName, registrationNo,
        address: address || '',
        licenseValidity: licenseValidity || '',
        specializations: specializations || [],
        isApproved: false,
      },
    });

    const token = signToken(contractor.id, 'contractor');
    res.status(201).json({
      success: true, token,
      user: { id: contractor.id, name: contractor.name, email: contractor.email, phone: contractor.phone, role: 'contractor', companyName: contractor.companyName, registrationNo: contractor.registrationNo, isApproved: contractor.isApproved },
    });
  } catch (err) {
    console.error('registerContractor:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ── CONTRACTOR LOGIN ──────────────────────────────────────────────────────
export const loginContractor = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ success: false, message: 'Email and password required' });

    const contractor = await prisma.contractor.findUnique({ where: { email } });
    if (!contractor)
      return res.status(401).json({ success: false, message: 'No contractor account found with this email' });

    const match = await bcrypt.compare(password, contractor.password);
    if (!match)
      return res.status(401).json({ success: false, message: 'Incorrect password' });

    const token = signToken(contractor.id, 'contractor');
    res.json({
      success: true, token,
      user: { id: contractor.id, name: contractor.name, email: contractor.email, phone: contractor.phone, role: 'contractor', companyName: contractor.companyName, registrationNo: contractor.registrationNo, isApproved: contractor.isApproved },
    });
  } catch (err) {
    console.error('loginContractor:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ── AUTHORITY REGISTER ────────────────────────────────────────────────────
export const registerAuthority = async (req: Request, res: Response) => {
  try {
    const { name, email, phone, password, designation, department, block, office, empCode } = req.body;
    if (!name || !email || !phone || !password || !designation || !department || !block)
      return res.status(400).json({ success: false, message: 'All fields required including designation, department and block' });

    const exists = await prisma.authority.findUnique({ where: { email } });
    if (exists) return res.status(400).json({ success: false, message: 'Email already registered' });

    if (empCode) {
      const existsEmp = await prisma.authority.findUnique({ where: { empCode } });
      if (existsEmp) return res.status(400).json({ success: false, message: 'Employee code already registered' });
    }

    const hashed = await bcrypt.hash(password, 12);
    const authority = await prisma.authority.create({
      data: { name, email, phone, password: hashed, designation, department, block, office: office || '', empCode: empCode || undefined },
    });

    const token = signToken(authority.id, 'authority');
    res.status(201).json({
      success: true, token,
      user: { id: authority.id, name: authority.name, email: authority.email, phone: authority.phone, role: 'authority', designation: authority.designation, department: authority.department, block: authority.block },
    });
  } catch (err) {
    console.error('registerAuthority:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ── AUTHORITY LOGIN ───────────────────────────────────────────────────────
export const loginAuthority = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ success: false, message: 'Email and password required' });

    const authority = await prisma.authority.findUnique({ where: { email } });
    if (!authority)
      return res.status(401).json({ success: false, message: 'No authority account found with this email' });

    const match = await bcrypt.compare(password, authority.password);
    if (!match)
      return res.status(401).json({ success: false, message: 'Incorrect password' });

    const token = signToken(authority.id, 'authority');
    res.json({
      success: true, token,
      user: { id: authority.id, name: authority.name, email: authority.email, phone: authority.phone, role: 'authority', designation: authority.designation, department: authority.department, block: authority.block },
    });
  } catch (err) {
    console.error('loginAuthority:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ── CHANGE PASSWORD (works for all roles) ────────────────────────────────
export const changePassword = async (req: Request, res: Response) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = (req as any).user?.id;
    const role   = (req as any).user?.role;
    if (!userId || !role) return res.status(401).json({ success: false, message: 'Unauthorized' });
    if (newPassword.length < 6) return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });

    let record: any;
    if      (role === 'citizen')    record = await prisma.citizen.findUnique({ where: { id: userId } });
    else if (role === 'contractor') record = await prisma.contractor.findUnique({ where: { id: userId } });
    else if (role === 'authority')  record = await prisma.authority.findUnique({ where: { id: userId } });

    if (!record) return res.status(404).json({ success: false, message: 'User not found' });

    const match = await bcrypt.compare(currentPassword, record.password);
    if (!match) return res.status(400).json({ success: false, message: 'Current password incorrect' });

    const hashed = await bcrypt.hash(newPassword, 12);
    if      (role === 'citizen')    await prisma.citizen.update({ where: { id: userId }, data: { password: hashed } });
    else if (role === 'contractor') await prisma.contractor.update({ where: { id: userId }, data: { password: hashed } });
    else if (role === 'authority')  await prisma.authority.update({ where: { id: userId }, data: { password: hashed } });

    res.json({ success: true, message: 'Password updated' });
  } catch (err) {
    console.error('changePassword:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ── DELETE ACCOUNT ────────────────────────────────────────────────────────
export const deleteAccount = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const role   = (req as any).user?.role;
    if (!userId || !role) return res.status(401).json({ success: false, message: 'Unauthorized' });

    if      (role === 'citizen')    await prisma.citizen.delete({ where: { id: userId } });
    else if (role === 'contractor') await prisma.contractor.delete({ where: { id: userId } });
    else if (role === 'authority')  await prisma.authority.delete({ where: { id: userId } });

    res.json({ success: true, message: 'Account deleted' });
  } catch (err) {
    console.error('deleteAccount:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const logout = (_req: Request, res: Response) => {
  res.json({ success: true, message: 'Logged out' });
};