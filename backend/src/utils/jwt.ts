import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'bookswap_super_secret_jwt_key_2026';
const JWT_EXPIRES_IN = '7d';

export interface TokenPayload {
  id: string;
  email: string;
  role: 'user' | 'admin';
}

export function generateToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  } catch (err) {
    return null;
  }
}
