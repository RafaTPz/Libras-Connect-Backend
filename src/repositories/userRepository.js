import { prisma } from '../config/prisma.js';
import { encrypt, decrypt, encryptDeterministic, decryptDeterministic } from '../config/encryption.js';

// Helper para descriptografar dados do usuário ao ler do banco
const decryptUser = (user) => {
  if (!user) return null;
  return {
    ...user,
    name: decrypt(user.name),
    email: decryptDeterministic(user.email),
  };
};

export const userRepository = {
  async findByEmail(email) {
    if (!prisma) throw new Error('Database connection not initialized');
    
    // Criptografar e-mail de forma determinística para buscar no banco
    const encryptedEmail = encryptDeterministic(email);
    
    const user = await prisma.user.findUnique({
      where: { email: encryptedEmail },
    });
    
    return decryptUser(user);
  },

  async findById(id) {
    if (!prisma) throw new Error('Database connection not initialized');
    
    const user = await prisma.user.findUnique({
      where: { id },
    });
    
    return decryptUser(user);
  },

  async create(data) {
    if (!prisma) throw new Error('Database connection not initialized');
    
    // Criptografar dados pessoais antes de persistir no banco
    const encryptedData = {
      ...data,
      name: encrypt(data.name),
      email: encryptDeterministic(data.email),
    };
    
    const user = await prisma.user.create({
      data: encryptedData,
    });
    
    return decryptUser(user);
  },

  async updateStatus(id, status) {
    if (!prisma) throw new Error('Database connection not initialized');
    
    const user = await prisma.user.update({
      where: { id },
      data: { status },
    });
    
    return decryptUser(user);
  },

  async updateRefreshToken(id, token) {
    if (!prisma) throw new Error('Database connection not initialized');
    
    const user = await prisma.user.update({
      where: { id },
      data: { refreshToken: token },
    });
    
    return decryptUser(user);
  },

  async findByRefreshToken(token) {
    if (!prisma) throw new Error('Database connection not initialized');
    
    const user = await prisma.user.findFirst({
      where: { refreshToken: token },
    });
    
    return decryptUser(user);
  }
};
