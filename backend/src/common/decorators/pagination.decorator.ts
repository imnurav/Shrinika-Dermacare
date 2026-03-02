import { PaginationDto } from '../dto/pagination.dto';
import { ApiQuery } from '@nestjs/swagger';
import {
  createParamDecorator,
  BadRequestException,
  ExecutionContext,
  applyDecorators,
} from '@nestjs/common';

export type PaginationOptions = {
  defaultPage?: number;
  defaultLimit?: number;
  maxLimit?: number;
  allowUnpaginated?: boolean;
};

const getFirstQueryValue = (value: unknown): string | undefined => {
  if (Array.isArray(value)) {
    const first = value[0];
    return typeof first === 'string' ? first : undefined;
  }
  return typeof value === 'string' ? value : undefined;
};

const parsePositiveInteger = (
  raw: string | undefined,
  field: 'page' | 'limit',
): number | undefined => {
  if (raw === undefined) return undefined;

  const parsed = Number(raw);
  if (!Number.isInteger(parsed) || parsed < 1) {
    throw new BadRequestException(`${field} must be a positive integer`);
  }

  return parsed;
};

export const Pagination = createParamDecorator(
  (options: PaginationOptions | undefined, ctx: ExecutionContext): PaginationDto | undefined => {
    const request = ctx.switchToHttp().getRequest();
    const query = request?.query ?? {};

    const defaultPage = options?.defaultPage ?? 1;
    const defaultLimit = options?.defaultLimit ?? 10;
    const maxLimit = options?.maxLimit ?? 100;
    const allowUnpaginated = options?.allowUnpaginated ?? false;

    const rawPage = getFirstQueryValue(query.page);
    const rawLimit = getFirstQueryValue(query.limit);

    if (allowUnpaginated && rawPage === undefined && rawLimit === undefined) {
      return undefined;
    }

    const page = parsePositiveInteger(rawPage, 'page') ?? defaultPage;
    const limit = parsePositiveInteger(rawLimit, 'limit') ?? defaultLimit;

    if (limit > maxLimit) {
      throw new BadRequestException(`limit must be less than or equal to ${maxLimit}`);
    }

    return { page, limit };
  },
);

export const ApiPaginationQuery = (maxLimit = 100) =>
  applyDecorators(
    ApiQuery({
      name: 'page',
      required: false,
      type: Number,
      example: 1,
      description: 'Page number (>= 1)',
    }),
    ApiQuery({
      name: 'limit',
      required: false,
      type: Number,
      example: 10,
      description: `Items per page (>= 1, <= ${maxLimit})`,
    }),
  );
