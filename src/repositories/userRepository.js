import { prisma } from '../config/prisma.js';

export const userRepository = {
  async findByEmail(email) {
    if (!prisma) throw new Error('Database connection not initialized');
    return prisma.user.findUnique({
      where: { email },
    });
  },

  async findById(id) {
    if (!prisma) throw new Error('Database connection not initialized');
    return prisma.user.findUnique({
      where: { id },
    });
  },

  async create(data) {
    if (!prisma) throw new Error('Database connection not initialized');
    return prisma.user.create({
      data,
    });
  },

  async updateStatus(id, status) {
    if (!prisma) throw new Error('Database connection not initialized');
    return prisma.user.update({
      where: { id },
      data: { status },
    });
  }
};
