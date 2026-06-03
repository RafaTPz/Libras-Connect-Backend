import dotenv from 'dotenv';
dotenv.config();

export const jwtConfig = {
  secret: process.env.JWT_SECRET || 'libras_connect_secret_token_key_2026_xyz',
  expiresIn: '7d', // Expirar em 7 dias
};
