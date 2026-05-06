import { ApiPropertyOptional } from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const PaginationSchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  search: z.string().optional(),
});

export class PaginationDto extends createZodDto(PaginationSchema) {}

export class PaginatedResponseDto<T> {
  data: T[];

  @ApiPropertyOptional({ example: 100 })
  total: number;

  @ApiPropertyOptional({ example: 1 })
  page: number;

  @ApiPropertyOptional({ example: 20 })
  limit: number;

  @ApiPropertyOptional({ example: 5 })
  totalPages: number;
}

export function buildPaginatedResponse<T>(
  data: T[],
  total: number,
  page: number,
  limit: number
): PaginatedResponseDto<T> {
  return {
    data,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}
