import jwt from 'jsonwebtoken';
import { jwtConfig } from '../config/jwt.js';
import { userRepository } from '../repositories/userRepository.js';

export const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Acesso negado. Token não fornecido.' });
    }

    const token = authHeader.split(' ')[1];
    
    let decoded;
    try {
      decoded = jwt.verify(token, jwtConfig.accessSecret);
    } catch (err) {
      return res.status(401).json({ error: 'Token inválido ou expirado.' });
    }

    const user = await userRepository.findById(decoded.userId);
    if (!user) {
      return res.status(401).json({ error: 'Usuário não encontrado.' });
    }

    // Excluir senha do objeto injetado na requisição
    const { password, ...userWithoutPassword } = user;
    req.user = userWithoutPassword;
    
    next();
  } catch (error) {
    console.error('Erro no middleware de autenticação:', error);
    res.status(500).json({ error: 'Erro interno de servidor.' });
  }
};
