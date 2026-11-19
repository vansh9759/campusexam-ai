import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../prisma';
import { AuthUserPayload, UserRole } from '../types';
import { AuditService } from './audit.service';

const JWT_SECRET = process.env.JWT_SECRET || 'campusexam_super_secret_jwt_key_2026';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

export class AuthService {
  static async login(email: string, passwordPlain: string, ipAddress?: string) {
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      include: {
        studentProfile: {
          include: {
            department: true,
            course: true,
            currentSemester: true,
          },
        },
        facultyProfile: {
          include: {
            department: true,
          },
        },
      },
    });

    if (!user || !user.isActive) {
      throw { statusCode: 401, message: 'Invalid college email or account is inactive.' };
    }

    const isMatch = await bcrypt.compare(passwordPlain, user.passwordHash);
    if (!isMatch) {
      throw { statusCode: 401, message: 'Invalid password. Please verify your credentials.' };
    }

    const payload: AuthUserPayload = {
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role as UserRole,
      profileId: user.studentProfile?.id || user.facultyProfile?.id,
      departmentId: user.studentProfile?.departmentId || user.facultyProfile?.departmentId,
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });

    // Log successful login
    await AuditService.log({
      userId: user.id,
      action: 'USER_LOGIN',
      resource: 'User',
      resourceId: user.id,
      ipAddress,
      metadata: { role: user.role, email: user.email },
    });

    return {
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatarUrl: user.avatarUrl,
        studentProfile: user.studentProfile,
        facultyProfile: user.facultyProfile,
      },
    };
  }

  static async getMe(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        studentProfile: {
          include: {
            department: true,
            course: true,
            currentSemester: true,
          },
        },
        facultyProfile: {
          include: {
            department: true,
          },
        },
      },
    });

    if (!user) {
      throw { statusCode: 401, message: 'User profile not found or session expired.' };
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatarUrl: user.avatarUrl,
      studentProfile: user.studentProfile,
      facultyProfile: user.facultyProfile,
    };
  }
}
