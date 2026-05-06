import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const RefreshTokenRequestSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token là bắt buộc'),
});

export class RefreshTokenRequest extends createZodDto(RefreshTokenRequestSchema) {}
