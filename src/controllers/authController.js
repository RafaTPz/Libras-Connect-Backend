import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { jwtConfig } from '../config/jwt.js';
import { userRepository } from '../repositories/userRepository.js';

// Helpers para gerenciamento de tokens
const generateTokens = (userId) => {
  const accessToken = jwt.sign({ userId }, jwtConfig.accessSecret, {
    expiresIn: jwtConfig.accessExpiresIn,
  });
  const refreshToken = jwt.sign({ userId }, jwtConfig.refreshSecret, {
    expiresIn: jwtConfig.refreshExpiresIn,
  });
  return { accessToken, refreshToken };
};

const setRefreshTokenCookie = (res, token) => {
  res.cookie('refreshToken', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 dias
  });
};

const clearRefreshTokenCookie = (res) => {
  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
  });
};

export const authController = {
  async register(req, res) {
    try {
      const { name, email, password } = req.body;

      if (!name || !email || !password) {
        return res.status(400).json({ error: 'Nome, email e senha são obrigatórios.' });
      }

      const existingUser = await userRepository.findByEmail(email);
      if (existingUser) {
        return res.status(400).json({ error: 'Este e-mail já está sendo utilizado.' });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      // Criar usuário inicial
      const user = await userRepository.create({
        name,
        email,
        password: hashedPassword,
        status: 'online',
      });

      // Gerar Tokens
      const { accessToken, refreshToken } = generateTokens(user.id);

      // Salvar refresh token no banco
      await userRepository.updateRefreshToken(user.id, refreshToken);

      // Configurar Cookie Seguro
      setRefreshTokenCookie(res, refreshToken);

      const { password: _, refreshToken: __, ...userWithoutSecrets } = user;
      return res.status(201).json({
        accessToken,
        user: userWithoutSecrets,
      });
    } catch (error) {
      console.error('Erro ao registrar usuário:', error);
      return res.status(500).json({ error: 'Erro interno de servidor ao registrar usuário.' });
    }
  },

  async login(req, res) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ error: 'E-mail e senha são obrigatórios.' });
      }

      const user = await userRepository.findByEmail(email);
      if (!user) {
        return res.status(401).json({ error: 'E-mail ou senha inválidos.' });
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({ error: 'E-mail ou senha inválidos.' });
      }

      // Atualizar status para online
      await userRepository.updateStatus(user.id, 'online');

      // Gerar Tokens
      const { accessToken, refreshToken } = generateTokens(user.id);

      // Salvar refresh token no banco
      const updatedUser = await userRepository.updateRefreshToken(user.id, refreshToken);

      // Configurar Cookie Seguro
      setRefreshTokenCookie(res, refreshToken);

      const { password: _, refreshToken: __, ...userWithoutSecrets } = updatedUser;
      return res.json({
        accessToken,
        user: userWithoutSecrets,
      });
    } catch (error) {
      console.error('Erro ao autenticar usuário:', error);
      return res.status(500).json({ error: 'Erro interno de servidor ao autenticar usuário.' });
    }
  },

  async refresh(req, res) {
    try {
      const { refreshToken } = req.cookies;

      if (!refreshToken) {
        return res.status(401).json({ error: 'Acesso negado. Token de atualização ausente.' });
      }

      // Verificar token
      let decoded;
      try {
        decoded = jwt.verify(refreshToken, jwtConfig.refreshSecret);
      } catch (err) {
        return res.status(401).json({ error: 'Token de atualização inválido ou expirado.' });
      }

      // Buscar usuário e validar se o token confere com o do banco
      const user = await userRepository.findById(decoded.userId);
      if (!user || user.refreshToken !== refreshToken) {
        return res.status(401).json({ error: 'Sessão inválida ou revogada.' });
      }

      // Gerar novo Access Token
      const accessToken = jwt.sign({ userId: user.id }, jwtConfig.accessSecret, {
        expiresIn: jwtConfig.accessExpiresIn,
      });

      return res.json({ accessToken });
    } catch (error) {
      console.error('Erro no refresh token:', error);
      return res.status(500).json({ error: 'Erro interno ao processar a renovação do token.' });
    }
  },

  async me(req, res) {
    return res.json({ user: req.user });
  },

  async logout(req, res) {
    try {
      if (req.user && req.user.id) {
        // Limpar token no banco e definir como offline
        await userRepository.updateRefreshToken(req.user.id, null);
        await userRepository.updateStatus(req.user.id, 'offline');
      }

      // Limpar cookie no cliente
      clearRefreshTokenCookie(res);
      return res.json({ message: 'Logout realizado com sucesso.' });
    } catch (error) {
      console.error('Erro ao realizar logout:', error);
      return res.status(500).json({ error: 'Erro interno de servidor ao realizar logout.' });
    }
  }
};
