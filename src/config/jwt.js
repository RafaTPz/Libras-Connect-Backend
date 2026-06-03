import dotenv from 'dotenv';
dotenv.config();

export const jwtConfig = {
  accessSecret: process.env.JWT_SECRET || 'libras_connect_access_token_secret_2026',
  refreshSecret: process.env.JWT_REFRESH_SECRET || 'libras_connect_refresh_token_secret_2026_xyz',
  accessExpiresIn: '15m',  // 15 minutos (curto prazo)
  refreshExpiresIn: '7d', // 7 dias (longo prazo)
};
