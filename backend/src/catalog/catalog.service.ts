import { CategoryResponseDto, CategoryWithServicesDto } from './dto/category-response.dto';
import { PaginationDto, PaginatedResponse } from '../common/dto/pagination.dto';
import { CategoryOptionDto, ServiceOptionDto } from './dto/options.dto';
import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { ServiceResponseDto } from './dto/service-response.dto';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from './entities/category.entity';
import { Service } from './entities/service.entity';

@Injectable()
export class CatalogService {
  constructor(
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
    @InjectRepository(Service)
    private readonly serviceRepository: Repository<Service>,
  ) {}

  // Categories
  async getCategories(
    search?: string,
    includeServices = false,
    paginationDto?: PaginationDto,
  ): Promise<
    | PaginatedResponse<CategoryResponseDto>
    | PaginatedResponse<CategoryWithServicesDto>
    | CategoryResponseDto[]
    | CategoryWithServicesDto[]
  > {
    if (includeServices) {
      const query = this.categoryRepository
        .createQueryBuilder('category')
        .leftJoinAndSelect(
          'category.services',
          'service',
          'service.isActive = :serviceActive',
          { serviceActive: true },
        )
        .where('category.isActive = :active', { active: true })
        .orderBy('category.name', 'ASC')
        .addOrderBy('service.createdAt', 'DESC');

      if (search) {
        query.andWhere('category.name ILIKE :search', { search: `%${search}%` });
      }

      if (paginationDto) {
        const page = paginationDto.page || 1;
        const limit = paginationDto.limit || 10;
        const skip = (page - 1) * limit;
        const [data, total] = await query.skip(skip).take(limit).getManyAndCount();
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

      return query.getMany();
    }

    const query = this.categoryRepository
      .createQueryBuilder('category')
      .where('category.isActive = :active', { active: true })
      .orderBy('category.name', 'ASC');

    if (search) {
      query.andWhere('category.name ILIKE :search', { search: `%${search}%` });
    }

    if (paginationDto) {
      const page = paginationDto.page || 1;
      const limit = paginationDto.limit || 10;
      const skip = (page - 1) * limit;
      const [data, total] = await query.skip(skip).take(limit).getManyAndCount();
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

    return query.getMany();
  }

  async getCategoryOptions(): Promise<CategoryOptionDto[]> {
    return this.categoryRepository.find({
      select: { id: true, name: true },
      where: { isActive: true },
      order: { name: 'ASC' },
    });
  }

  async getServiceOptions(categoryId?: string): Promise<ServiceOptionDto[]> {
    const query = this.serviceRepository
      .createQueryBuilder('service')
      .select(['service.id', 'service.title', 'service.categoryId'])
      .where('service.isActive = :active', { active: true })
      .orderBy('service.title', 'ASC');

    if (categoryId) {
      query.andWhere('service.categoryId = :categoryId', { categoryId });
    }

    return query.getMany();
  }

  async getCategoryById(
    id: string,
    includeServices = false,
  ): Promise<CategoryResponseDto | CategoryWithServicesDto> {
    const category = await this.categoryRepository.findOne({
      where: { id },
      relations: includeServices ? { services: true } : undefined,
      order: includeServices ? { services: { createdAt: 'DESC' } } : undefined,
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    if (includeServices && category.services) {
      category.services = category.services.filter((service) => service.isActive);
    }

    return category;
  }

  async createCategory(createCategoryDto: CreateCategoryDto): Promise<CategoryResponseDto> {
    // Check if category name already exists
    const existing = await this.categoryRepository.findOne({
      where: { name: createCategoryDto.name },
    });

    if (existing) {
      throw new ConflictException('Category with this name already exists');
    }

    return this.categoryRepository.save(this.categoryRepository.create(createCategoryDto));
  }

  async updateCategory(
    id: string,
    updateCategoryDto: UpdateCategoryDto,
  ): Promise<CategoryResponseDto> {
    const category = await this.categoryRepository.findOne({
      where: { id },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    // Check if new name conflicts with existing category
    if (updateCategoryDto.name && updateCategoryDto.name !== category.name) {
      const existing = await this.categoryRepository.findOne({
        where: { name: updateCategoryDto.name },
      });

      if (existing) {
        throw new ConflictException('Category with this name already exists');
      }
    }

    await this.categoryRepository.update({ id }, updateCategoryDto);
    return this.categoryRepository.findOne({ where: { id } }) as Promise<CategoryResponseDto>;
  }

  async deleteCategory(id: string): Promise<void> {
    const category = await this.categoryRepository.findOne({
      where: { id },
      relations: { services: true },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    if (category.services.length > 0) {
      throw new ConflictException('Cannot delete category with associated services');
    }

    await this.categoryRepository.delete({ id });
  }

  // Services
  async getServices(
    categoryId?: string,
    search?: string,
    paginationDto?: PaginationDto,
  ): Promise<PaginatedResponse<ServiceResponseDto> | ServiceResponseDto[]> {
    const query = this.serviceRepository
      .createQueryBuilder('service')
      .leftJoinAndSelect('service.category', 'category')
      .where('service.isActive = :active', { active: true })
      .orderBy('service.createdAt', 'DESC');

    if (categoryId) {
      query.andWhere('service.categoryId = :categoryId', { categoryId });
    }

    if (search) {
      query.andWhere('(service.title ILIKE :search OR service.description ILIKE :search)', {
        search: `%${search}%`,
      });
    }

    if (paginationDto) {
      const page = paginationDto.page || 1;
      const limit = paginationDto.limit || 10;
      const skip = (page - 1) * limit;

      const [data, total] = await query.skip(skip).take(limit).getManyAndCount();

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

    return query.getMany();
  }

  async getServiceById(id: string): Promise<ServiceResponseDto> {
    const service = await this.serviceRepository.findOne({
      where: { id },
      relations: { category: true },
    });

    if (!service) {
      throw new NotFoundException('Service not found');
    }

    return service;
  }

  async createService(createServiceDto: CreateServiceDto): Promise<ServiceResponseDto> {
    // Verify category exists
    const category = await this.categoryRepository.findOne({
      where: { id: createServiceDto.categoryId },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    const created = await this.serviceRepository.save(this.serviceRepository.create(createServiceDto));
    return this.serviceRepository.findOne({
      where: { id: created.id },
      relations: { category: true },
    }) as Promise<ServiceResponseDto>;
  }

  async updateService(id: string, updateServiceDto: UpdateServiceDto): Promise<ServiceResponseDto> {
    const service = await this.serviceRepository.findOne({
      where: { id },
    });

    if (!service) {
      throw new NotFoundException('Service not found');
    }

    // Verify category exists if being updated
    if (updateServiceDto.categoryId) {
      const category = await this.categoryRepository.findOne({
        where: { id: updateServiceDto.categoryId },
      });

      if (!category) {
        throw new NotFoundException('Category not found');
      }
    }

    await this.serviceRepository.update({ id }, updateServiceDto);
    return this.serviceRepository.findOne({
      where: { id },
      relations: { category: true },
    }) as Promise<ServiceResponseDto>;
  }

  async deleteService(id: string): Promise<void> {
    const service = await this.serviceRepository.findOne({
      where: { id },
    });

    if (!service) {
      throw new NotFoundException('Service not found');
    }

    await this.serviceRepository.delete({ id });
  }
}
