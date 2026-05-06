import { Injectable } from '@nestjs/common';
import { NguoiDung, Prisma } from '@prisma/client';
import { PrismaService } from '@infrastructure/database/prisma.service';
import { PRISMA_NOT_DELETED_FILTER } from '@common/constants/database.constants';

const NOT_DELETED = PRISMA_NOT_DELETED_FILTER as Prisma.NguoiDungWhereInput;

@Injectable()
export class UserRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<NguoiDung | null> {
    return this.prisma.nguoiDung.findFirst({
      where: { id, ...NOT_DELETED },
    });
  }

  async findByEmail(email: string): Promise<NguoiDung | null> {
    return this.prisma.nguoiDung.findFirst({
      where: { email, ...NOT_DELETED },
    });
  }

  async findByUsername(username: string): Promise<NguoiDung | null> {
    return this.prisma.nguoiDung.findFirst({
      where: { username, ...NOT_DELETED },
    });
  }

  async findByUsernameOrEmail(identifier: string, isLogin = false): Promise<NguoiDung | null> {
    return this.prisma.nguoiDung.findFirst({
      where: {
        AND: [
          { OR: [{ username: identifier }, { email: identifier }] },
          ...(isLogin ? [NOT_DELETED, { active: true }] : []),
        ],
      },
    });
  }

  async create(data: {
    username: string;
    password: string;
    hoTen: string;
    email: string;
    vaiTro?: any;
  }): Promise<NguoiDung> {
    return this.prisma.nguoiDung.create({ data });
  }

  async updatePassword(id: string, hashedPassword: string): Promise<NguoiDung> {
    return this.prisma.nguoiDung.update({
      where: { id },
      data: { password: hashedPassword },
    });
  }

  async softDelete(id: string): Promise<void> {
    await this.prisma.nguoiDung.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
