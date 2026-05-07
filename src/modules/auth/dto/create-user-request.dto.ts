import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { Gender, UserRole } from '@prisma/client';

export const CreateUserRequestSchema = z.object({
  username: z
    .string()
    .min(3, 'Tên đăng nhập phải có ít nhất 3 ký tự')
    .max(50, 'Tên đăng nhập không được vượt quá 50 ký tự'),
  fullName: z
    .string()
    .min(1, 'Họ tên là bắt buộc')
    .max(200, 'Họ tên không được vượt quá 200 ký tự'),
  saintName: z
    .string()
    .min(1, 'Tên Thánh là bắt buộc')
    .max(100, 'Tên Thánh không được vượt quá 100 ký tự'),
  birthDate: z.coerce.date({ required_error: 'Ngày sinh là bắt buộc' }),
  gender: z.nativeEnum(Gender, { required_error: 'Giới tính là bắt buộc' }),
  address: z
    .string()
    .min(1, 'Địa chỉ là bắt buộc')
    .max(500, 'Địa chỉ không được vượt quá 500 ký tự'),
  email: z.string().email('Email không hợp lệ').optional(),
  phone: z.string().max(20, 'Số điện thoại không hợp lệ').optional(),
  password: z.string().min(8, 'Mật khẩu phải có ít nhất 8 ký tự'),
  role: z.nativeEnum(UserRole).optional().default(UserRole.TEACHER),
});

export class CreateUserRequest extends createZodDto(CreateUserRequestSchema) {}
