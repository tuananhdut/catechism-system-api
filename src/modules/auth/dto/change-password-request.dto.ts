import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const passwordSchema = z
  .string()
  .max(100, 'Mật khẩu không được vượt quá 100 ký tự')
  .refine(
    (val) => val.length >= 8 && /[A-Z]/.test(val) && /[a-z]/.test(val) && /[^A-Za-z0-9]/.test(val),
    {
      message: 'Mật khẩu phải có ít nhất 8 ký tự, bao gồm chữ hoa, chữ thường và ký tự đặc biệt',
    }
  );

export const ChangePasswordRequestSchema = z.object({
  currentPassword: z.string().min(1, 'Mật khẩu hiện tại là bắt buộc'),
  newPassword: passwordSchema,
});

export class ChangePasswordRequest extends createZodDto(ChangePasswordRequestSchema) {}

export const AdminChangePasswordRequestSchema = z.object({
  userId: z.string().min(1, 'User ID là bắt buộc'),
  newPassword: passwordSchema,
});

export class AdminChangePasswordRequest extends createZodDto(AdminChangePasswordRequestSchema) {}
