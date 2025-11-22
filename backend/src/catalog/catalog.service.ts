import { CategoryResponseDto, CategoryWithServicesDto } from './dto/category-response.dto';
import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PaginationDto, PaginatedResponse } from '../common/dto/pagination.dto';
import { ServiceResponseDto } from './dto/service-response.dto';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CatalogService {
  constructor(private prisma: PrismaService) {}

  // Categories
  async getCategories(
    includeServices = false,
  ): Promise<CategoryResponseDto[] | CategoryWithServicesDto[]> {
    if (includeServices) {
      return this.prisma.category.findMany({
        where: { isActive: true },
        include: {
          services: {
            where: { isActive: true },
            orderBy: { createdAt: 'desc' },
          },
        },
        orderBy: { name: 'asc' },
      });
    }

    return this.prisma.category.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });
  }

  async getCategoryById(
    id: string,
    includeServices = false,
  ): Promise<CategoryResponseDto | CategoryWithServicesDto> {
    const category = await this.prisma.category.findUnique({
      where: { id },
      include: includeServices
        ? {
            services: {
              where: { isActive: true },
              orderBy: { createdAt: 'desc' },
            },
          }
        : undefined,
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    return category;
  }

  async createCategory(createCategoryDto: CreateCategoryDto): Promise<CategoryResponseDto> {
    // Check if category name already exists
    const existing = await this.prisma.category.findUnique({
      where: { name: createCategoryDto.name },
    });

    if (existing) {
      throw new ConflictException('Category with this name already exists');
    }

    return this.prisma.category.create({
      data: createCategoryDto,
    });
  }

  async updateCategory(
    id: string,
    updateCategoryDto: UpdateCategoryDto,
  ): Promise<CategoryResponseDto> {
    const category = await this.prisma.category.findUnique({
      where: { id },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    // Check if new name conflicts with existing category
    if (updateCategoryDto.name && updateCategoryDto.name !== category.name) {
      const existing = await this.prisma.category.findUnique({
        where: { name: updateCategoryDto.name },
      });

      if (existing) {
        throw new ConflictException('Category with this name already exists');
      }
    }

    return this.prisma.category.update({
      where: { id },
      data: updateCategoryDto,
    });
  }

  async deleteCategory(id: string): Promise<void> {
    const category = await this.prisma.category.findUnique({
      where: { id },
      include: { services: true },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    if (category.services.length > 0) {
      throw new ConflictException('Cannot delete category with associated services');
    }

    await this.prisma.category.delete({
      where: { id },
    });
  }

  // Services
  async getServices(
    categoryId?: string,
    paginationDto?: PaginationDto,
  ): Promise<PaginatedResponse<ServiceResponseDto> | ServiceResponseDto[]> {
    const where: any = { isActive: true };
    if (categoryId) {
      where.categoryId = categoryId;
    }

    if (paginationDto) {
      const page = paginationDto.page || 1;
      const limit = paginationDto.limit || 10;
      const skip = (page - 1) * limit;

      const [data, total] = await Promise.all([
        this.prisma.service.findMany({
          where,
          include: { category: true },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
        }),
        this.prisma.service.count({ where }),
      ]);

      return {
        data,
        meta: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    }

    const services = await this.prisma.service.findMany({
      where,
      include: { category: true },
      orderBy: { createdAt: 'desc' },
    });

    return services;
  }

  async getServiceById(id: string): Promise<ServiceResponseDto> {
    const service = await this.prisma.service.findUnique({
      where: { id },
      include: { category: true },
    });

    if (!service) {
      throw new NotFoundException('Service not found');
    }

    return service;
  }

  async createService(createServiceDto: CreateServiceDto): Promise<ServiceResponseDto> {
    // Verify category exists
    const category = await this.prisma.category.findUnique({
      where: { id: createServiceDto.categoryId },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    return this.prisma.service.create({
      data: createServiceDto,
      include: { category: true },
    });
  }

  async updateService(id: string, updateServiceDto: UpdateServiceDto): Promise<ServiceResponseDto> {
    const service = await this.prisma.service.findUnique({
      where: { id },
    });

    if (!service) {
      throw new NotFoundException('Service not found');
    }

    // Verify category exists if being updated
    if (updateServiceDto.categoryId) {
      const category = await this.prisma.category.findUnique({
        where: { id: updateServiceDto.categoryId },
      });

      if (!category) {
        throw new NotFoundException('Category not found');
      }
    }

    return this.prisma.service.update({
      where: { id },
      data: updateServiceDto,
      include: { category: true },
    });
  }

  async deleteService(id: string): Promise<void> {
    const service = await this.prisma.service.findUnique({
      where: { id },
    });

    if (!service) {
      throw new NotFoundException('Service not found');
    }

    await this.prisma.service.delete({
      where: { id },
    });
  }
}
