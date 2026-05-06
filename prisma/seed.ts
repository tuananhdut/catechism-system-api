import { PrismaClient, VaiTro } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash('Admin@123', 10);

  const admin = await prisma.nguoiDung.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      email: 'admin@giaoly.vn',
      password: hashedPassword,
      hoTen: 'Quản Trị Viên',
      vaiTro: VaiTro.ADMIN,
    },
  });

  console.log('Seeded admin user:', admin.email);

  // Seed Khối học
  const khoiHocData = [
    { tenKhoi: 'Khai Tâm', thuTu: 1, moTa: 'Lớp Khai Tâm' },
    { tenKhoi: 'Rước Lễ', thuTu: 2, moTa: 'Lớp Rước Lễ Lần Đầu' },
    { tenKhoi: 'Thêm Sức', thuTu: 3, moTa: 'Lớp Thêm Sức' },
    { tenKhoi: 'Thiếu Nhi', thuTu: 4, moTa: 'Lớp Thiếu Nhi' },
    { tenKhoi: 'Thiếu Niên', thuTu: 5, moTa: 'Lớp Thiếu Niên' },
    { tenKhoi: 'Hôn Nhân', thuTu: 6, moTa: 'Lớp Giáo Lý Hôn Nhân' },
  ];

  for (const khoi of khoiHocData) {
    await prisma.khoiHoc.upsert({
      where: { tenKhoi: khoi.tenKhoi },
      update: {},
      create: khoi,
    });
  }

  console.log('Seeded khoi hoc data');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
