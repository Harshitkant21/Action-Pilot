import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { prisma } from '../config/prisma';
import { AuthenticatedRequest } from '../middleware/auth.middleware';

// Validation Schemas
const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string(),
});

export const register = async (req: Request, res: Response) => {
  try {
    const body = registerSchema.parse(req.body);

    const existingUser = await prisma.user.findUnique({
      where: { email: body.email.toLowerCase() },
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email address is already registered',
      });
    }

    const passwordHash = await bcrypt.hash(body.password, 10);

    await prisma.user.create({
      data: {
        name: body.name,
        email: body.email.toLowerCase(),
        passwordHash,
      },
    });

    return res.status(201).json({
      success: true,
      message: 'User registered successfully',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: error.errors[0].message,
      });
    }
    console.error('Registration error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to register user',
    });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const body = loginSchema.parse(req.body);

    const user = await prisma.user.findUnique({
      where: { email: body.email.toLowerCase() },
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    const isPasswordMatch = await bcrypt.compare(body.password, user.passwordHash);
    if (!isPasswordMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    const tokenSecret = process.env.JWT_SECRET || 'super-secret-key-change-in-production';
    const token = jwt.sign(
      { id: user.id, email: user.email, name: user.name },
      tokenSecret,
      { expiresIn: (process.env.JWT_EXPIRES_IN || '7d') as any }
    );

    return res.status(200).json({
      success: true,
      token,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: error.errors[0].message,
      });
    }
    console.error('Login error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to sign in',
    });
  }
};

export const me = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    return res.status(200).json(user);
  } catch (error) {
    console.error('Get current user error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve user details',
    });
  }
};
