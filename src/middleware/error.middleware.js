import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';

export const errorHandler = (err, req, res, next) => {
  if (err instanceof ZodError) {
    return res.status(400).json({
      message: 'Validation error',
      errors: err.errors
    });
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      return res.status(409).json({
        message: 'A record with this value already exists'
      });
    }
  }

  console.error(err);
  res.status(500).json({ message: 'Internal server error' });
};