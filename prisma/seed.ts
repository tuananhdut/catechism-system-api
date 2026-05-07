import { Gender, ParentRelation, PrismaClient, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const STUDENTS = [
  {
    username: 'hv001',
    fullName: 'Nguyễn Văn An',
    saintName: 'Giuse',
    birthDate: new Date('2015-03-10'),
    gender: Gender.MALE,
    address: 'Giáo Xứ',
    studentCode: '2024001',
    className: 'CC1',
    gradeLevel: 1,
    parent: {
      username: 'ph001',
      fullName: 'Nguyễn Văn Bình',
      saintName: 'Phêrô',
      birthDate: new Date('1985-06-20'),
      gender: Gender.MALE,
      address: 'Giáo Xứ',
      phone: '0901000001',
      relation: ParentRelation.FATHER,
    },
  },
  {
    username: 'hv002',
    fullName: 'Trần Thị Bích',
    saintName: 'Maria',
    birthDate: new Date('2014-07-15'),
    gender: Gender.FEMALE,
    address: 'Giáo Xứ',
    studentCode: '2024002',
    className: 'Hiệp Thông 1',
    gradeLevel: 2,
    parent: {
      username: 'ph002',
      fullName: 'Trần Thị Cúc',
      saintName: 'Anna',
      birthDate: new Date('1983-11-05'),
      gender: Gender.FEMALE,
      address: 'Giáo Xứ',
      phone: '0901000002',
      relation: ParentRelation.MOTHER,
    },
  },
  {
    username: 'hv003',
    fullName: 'Lê Minh Châu',
    saintName: 'Phaolô',
    birthDate: new Date('2012-01-22'),
    gender: Gender.MALE,
    address: 'Giáo Xứ',
    studentCode: '2024003',
    className: 'Hiệp Thông 4',
    gradeLevel: 3,
    parent: {
      username: 'ph003',
      fullName: 'Lê Văn Dũng',
      saintName: 'Gioan',
      birthDate: new Date('1980-04-18'),
      gender: Gender.MALE,
      address: 'Giáo Xứ',
      phone: '0901000003',
      relation: ParentRelation.FATHER,
    },
  },
  {
    username: 'hv004',
    fullName: 'Phạm Thị Dung',
    saintName: 'Têrêsa',
    birthDate: new Date('2010-09-30'),
    gender: Gender.FEMALE,
    address: 'Giáo Xứ',
    studentCode: '2024004',
    className: 'Hiệp Thông 7',
    gradeLevel: 4,
    parent: {
      username: 'ph004',
      fullName: 'Phạm Văn Em',
      saintName: 'Antôn',
      birthDate: new Date('1978-12-25'),
      gender: Gender.MALE,
      address: 'Giáo Xứ',
      phone: '0901000004',
      relation: ParentRelation.FATHER,
    },
  },
];

const GRADES = [
  { level: 1, name: 'Chiên Con',  description: 'Khối Chiên Con' },
  { level: 2, name: 'Ấu Nhi',    description: 'Khối Ấu Nhi' },
  { level: 3, name: 'Thiếu Nhi', description: 'Khối Thiếu Nhi' },
  { level: 4, name: 'Nghĩa Sĩ',  description: 'Khối Nghĩa Sĩ' },
  { level: 5, name: 'Hiệp Sĩ',   description: 'Khối Hiệp Sĩ' },
];

const CLASS_DEFINITIONS: Record<number, string[]> = {
  1: ['CC1', 'CC2'],
  2: ['Hiệp Thông 1', 'Hiệp Thông 2', 'Hiệp Thông 3'],
  3: ['Hiệp Thông 4', 'Hiệp Thông 5', 'Hiệp Thông 6'],
  4: ['Hiệp Thông 7', 'Hiệp Thông 8', 'Hiệp Thông 9'],
};

async function main() {
  const hashedPassword = await bcrypt.hash('Admin@123', 10);

  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      email: 'admin@giaoly.vn',
      password: hashedPassword,
      fullName: 'Quản Trị Viên',
      saintName: 'Admin',
      birthDate: new Date('1990-01-01'),
      gender: Gender.MALE,
      address: 'Giáo Xứ',
      role: UserRole.ADMIN,
    },
  });
  console.log('Seeded admin user:', admin.email);

  for (const grade of GRADES) {
    await prisma.grade.upsert({
      where: { level: grade.level },
      update: { name: grade.name, description: grade.description },
      create: grade,
    });
  }
  console.log('Seeded grades:', GRADES.map((g) => g.name).join(', '));

  const academicYear = await prisma.academicYear.upsert({
    where: { name: '2024-2025' },
    update: {},
    create: {
      name: '2024-2025',
      startDate: new Date('2024-09-01'),
      endDate: new Date('2025-06-30'),
      isActive: true,
    },
  });
  console.log('Seeded academic year:', academicYear.name);

  let classCount = 0;
  for (const [levelStr, classNames] of Object.entries(CLASS_DEFINITIONS)) {
    const grade = await prisma.grade.findUnique({ where: { level: Number(levelStr) } });
    if (!grade) continue;

    for (const className of classNames) {
      await prisma.class.upsert({
        where: {
          name_gradeId_academicYearId: {
            name: className,
            gradeId: grade.id,
            academicYearId: academicYear.id,
          },
        },
        update: {},
        create: {
          name: className,
          gradeId: grade.id,
          academicYearId: academicYear.id,
        },
      });
      classCount++;
    }
  }
  console.log(`Seeded ${classCount} classes`);

  const studentPassword = await bcrypt.hash('Student@123', 10);
  const parentPassword  = await bcrypt.hash('Parent@123', 10);

  for (const s of STUDENTS) {
    // Tạo user phụ huynh
    const parentUser = await prisma.user.upsert({
      where: { username: s.parent.username },
      update: {},
      create: {
        username:  s.parent.username,
        password:  parentPassword,
        fullName:  s.parent.fullName,
        saintName: s.parent.saintName,
        birthDate: s.parent.birthDate,
        gender:    s.parent.gender,
        address:   s.parent.address,
        phone:     s.parent.phone,
        role:      UserRole.PARENT,
      },
    });

    const parentProfile = await prisma.parentProfile.upsert({
      where: { userId: parentUser.id },
      update: {},
      create: { userId: parentUser.id, phoneNumber: s.parent.phone },
    });

    // Tạo user học viên
    const studentUser = await prisma.user.upsert({
      where: { username: s.username },
      update: {},
      create: {
        username:  s.username,
        password:  studentPassword,
        fullName:  s.fullName,
        saintName: s.saintName,
        birthDate: s.birthDate,
        gender:    s.gender,
        address:   s.address,
        role:      UserRole.STUDENT,
      },
    });

    const studentProfile = await prisma.studentProfile.upsert({
      where: { userId: studentUser.id },
      update: {},
      create: { userId: studentUser.id, studentCode: s.studentCode },
    });

    // Liên kết học viên – phụ huynh
    await prisma.studentParent.upsert({
      where: { studentId_parentId: { studentId: studentProfile.id, parentId: parentProfile.id } },
      update: {},
      create: { studentId: studentProfile.id, parentId: parentProfile.id, relation: s.parent.relation },
    });

    // Xếp học viên vào lớp
    const grade = await prisma.grade.findUnique({ where: { level: s.gradeLevel } });
    if (grade) {
      const cls = await prisma.class.findUnique({
        where: { name_gradeId_academicYearId: { name: s.className, gradeId: grade.id, academicYearId: academicYear.id } },
      });
      if (cls) {
        await prisma.classStudent.upsert({
          where: { classId_studentId: { classId: cls.id, studentId: studentProfile.id } },
          update: {},
          create: { classId: cls.id, studentId: studentProfile.id },
        });
      }
    }
  }

  console.log(`Seeded ${STUDENTS.length} students and ${STUDENTS.length} parents`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
