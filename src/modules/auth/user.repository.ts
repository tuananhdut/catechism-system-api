import { Injectable } from '@nestjs/common';
import { User, Prisma, UserRole, Gender } from '@prisma/client';
import { PrismaService } from '@infrastructure/database/prisma.service';
import { PRISMA_NOT_DELETED_FILTER } from '@common/constants/database.constants';

const NOT_DELETED = PRISMA_NOT_DELETED_FILTER as Prisma.UserWhereInput;

@Injectable()
export class UserRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<User | null> {
    return this.prisma.user.findFirst({ where: { id, ...NOT_DELETED } });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findFirst({ where: { email, ...NOT_DELETED } });
  }

  async findByUsername(username: string): Promise<User | null> {
    return this.prisma.user.findFirst({ where: { username, ...NOT_DELETED } });
  }

  async findByUsernameOrEmail(identifier: string, isLogin = false): Promise<User | null> {
    return this.prisma.user.findFirst({
      where: {
        AND: [
          { OR: [{ username: identifier }, { email: identifier }] },
          NOT_DELETED,
          ...(isLogin ? [{ active: true }] : ([] as Prisma.UserWhereInput[])),
        ],
      },
    });
  }

  async create(data: {
    username: string;
    password: string;
    fullName: string;
    saintName: string;
    birthDate: Date;
    gender: Gender;
    address: string;
    email?: string;
    phone?: string;
    role?: UserRole;
  }): Promise<User> {
    return this.prisma.user.create({ data });
  }

  async updatePassword(id: string, hashedPassword: string): Promise<User> {
    return this.prisma.user.update({
      where: { id },
      data: { password: hashedPassword },
    });
  }

  async softDelete(id: string): Promise<void> {
    await this.prisma.user.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
