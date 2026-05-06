import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { VaiTro } from '@prisma/client';

export const CreateUserRequestSchema = z.object({
  username: z
    .string()
    .min(3, 'Tên đăng nhập phải có ít nhất 3 ký tự')
    .max(50, 'Tên đăng nhập không được vượt quá 50 ký tự'),
  hoTen: z.string().min(1, 'Họ tên là bắt buộc').max(200, 'Họ tên không được vượt quá 200 ký tự'),
  email: z.string().email('Email không hợp lệ'),
  password: z.string().min(8, 'Mật khẩu phải có ít nhất 8 ký tự'),
  vaiTro: z.nativeEnum(VaiTro).optional().default(VaiTro.GLV_TRUONG_LOP),
});

export class CreateUserRequest extends createZodDto(CreateUserRequestSchema) {}
