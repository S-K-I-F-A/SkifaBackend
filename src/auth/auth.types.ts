import type { Request } from 'express';
import type { UserEntity } from '../database/entities.js';

export interface AuthenticatedRequest extends Request {
  user: UserEntity;
}

export interface JwtPayload {
  sub: string;
  role: UserEntity['role'];
}
