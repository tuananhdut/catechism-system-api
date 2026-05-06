import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const LoginRequestSchema = z.object({
  username: z.string().min(1, 'Tên đăng nhập hoặc email là bắt buộc'),
  password: z.string().min(1, 'Mật khẩu là bắt buộc'),
});

export class LoginRequest extends createZodDto(LoginRequestSchema) {}
