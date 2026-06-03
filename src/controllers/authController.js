import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { jwtConfig } from '../config/jwt.js';
import { userRepository } from '../repositories/userRepository.js';

export const authController = {
  async register(req, res) {
    try {
      const { name, email, password } = req.body;

      // Validação básica de entrada
      if (!name || !email || !password) {
        return res.status(400).json({ error: 'Nome, email e senha são obrigatórios.' });
      }

      // Validar se o usuário já existe
      const existingUser = await userRepository.findByEmail(email);
      if (existingUser) {
        return res.status(400).json({ error: 'Este e-mail já está sendo utilizado.' });
      }

      // Hash de senha
      const hashedPassword = await bcrypt.hash(password, 10);

      // Criar usuário no banco
      const user = await userRepository.create({
        name,
        email,
        password: hashedPassword,
        status: 'online', // Iniciar online
      });

      // Gerar Token JWT
      const token = jwt.sign({ userId: user.id }, jwtConfig.secret, {
        expiresIn: jwtConfig.expiresIn,
      });

      // Retornar informações do usuário (exceto a senha)
      const { password: _, ...userWithoutPassword } = user;
      return res.status(201).json({
        token,
        user: userWithoutPassword,
      });
    } catch (error) {
      console.error('Erro ao registrar usuário:', error);
      return res.status(500).json({ error: 'Erro interno de servidor ao registrar usuário.' });
    }
  },

  async login(req, res) {
    try {
      const { email, password } = req.body;

      // Validação básica de entrada
      if (!email || !password) {
        return res.status(400).json({ error: 'E-mail e senha são obrigatórios.' });
      }

      // Buscar usuário pelo e-mail
      const user = await userRepository.findByEmail(email);
      if (!user) {
        return res.status(401).json({ error: 'E-mail ou senha inválidos.' });
      }

      // Comparar senha
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({ error: 'E-mail ou senha inválidos.' });
      }

      // Atualizar status para online
      const updatedUser = await userRepository.updateStatus(user.id, 'online');

      // Gerar Token JWT
      const token = jwt.sign({ userId: user.id }, jwtConfig.secret, {
        expiresIn: jwtConfig.expiresIn,
      });

      // Retornar informações do usuário (exceto a senha)
      const { password: _, ...userWithoutPassword } = updatedUser;
      return res.json({
        token,
        user: userWithoutPassword,
      });
    } catch (error) {
      console.error('Erro ao autenticar usuário:', error);
      return res.status(500).json({ error: 'Erro interno de servidor ao autenticar usuário.' });
    }
  },

  async me(req, res) {
    // Retorna o usuário já extraído pelo authMiddleware
    return res.json({ user: req.user });
  },

  async logout(req, res) {
    try {
      // Se tivermos req.user, definimos o status para offline
      if (req.user && req.user.id) {
        await userRepository.updateStatus(req.user.id, 'offline');
      }
      return res.json({ message: 'Logout realizado com sucesso.' });
    } catch (error) {
      console.error('Erro ao realizar logout:', error);
      return res.status(500).json({ error: 'Erro interno de servidor ao realizar logout.' });
    }
  }
};
