import { CategoryResponseDto, CategoryWithServicesDto } from './dto/category-response.dto';
import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PaginationDto, PaginatedResponse } from '../common/dto/pagination.dto';
import { CategoryOptionDto, ServiceOptionDto } from './dto/options.dto';
import { ServiceResponseDto } from './dto/service-response.dto';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { Category } from './entities/category.entity';
import { Service } from './entities/service.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

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
    sortBy?: string,
    sortOrder: 'ASC' | 'DESC' = 'ASC',
  ): Promise<
    | PaginatedResponse<CategoryResponseDto>
    | PaginatedResponse<CategoryWithServicesDto>
    | CategoryResponseDto[]
    | CategoryWithServicesDto[]
  > {
    if (includeServices) {
      const allowedSortFields: Record<string, string> = {
        name: 'category.name',
        description: 'category.description',
        createdAt: 'category.createdAt',
        isActive: 'category.isActive',
      };
      const sortColumn = allowedSortFields[sortBy || ''] || 'category.name';

      const query = this.categoryRepository
        .createQueryBuilder('category')
        .leftJoin('category.services', 'service', 'service.isActive = :serviceActive', {
          serviceActive: true,
        })
        .select([
          'category.id',
          'category.name',
          'category.description',
          'category.imageUrl',
          'category.isActive',
          'category.createdAt',
          'service.id',
          'service.categoryId',
          'service.title',
          'service.description',
          'service.imageUrl',
          'service.duration',
          'service.price',
          'service.isActive',
          'service.createdAt',
        ])
        .where('category.isActive = :active', { active: true })
        .orderBy(sortColumn, sortOrder)
        .addOrderBy('service.createdAt', 'DESC');

      if (search) {
        query.andWhere('(CAST(category.id as text) ILIKE :search OR category.name ILIKE :search)', {
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

    const allowedSortFields: Record<string, string> = {
      name: 'category.name',
      description: 'category.description',
      createdAt: 'category.createdAt',
      isActive: 'category.isActive',
    };
    const sortColumn = allowedSortFields[sortBy || ''] || 'category.name';

    const query = this.categoryRepository
      .createQueryBuilder('category')
      .select([
        'category.id',
        'category.name',
        'category.description',
        'category.imageUrl',
        'category.isActive',
        'category.createdAt',
      ])
      .where('category.isActive = :active', { active: true })
      .orderBy(sortColumn, sortOrder);

    if (search) {
      query.andWhere('(CAST(category.id as text) ILIKE :search OR category.name ILIKE :search)', {
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
      select: { id: true },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    const hasServices = await this.serviceRepository.exist({
      where: { categoryId: id },
    });

    if (hasServices) {
      throw new ConflictException('Cannot delete category with associated services');
    }

    await this.categoryRepository.delete({ id });
  }

  // Services
  async getServices(
    categoryId?: string,
    search?: string,
    paginationDto?: PaginationDto,
    sortBy?: string,
    sortOrder: 'ASC' | 'DESC' = 'DESC',
  ): Promise<PaginatedResponse<ServiceResponseDto> | ServiceResponseDto[]> {
    const allowedSortFields: Record<string, string> = {
      title: 'service.title',
      category: 'category.name',
      description: 'service.description',
      duration: 'service.duration',
      price: 'service.price',
      isActive: 'service.isActive',
      createdAt: 'service.createdAt',
    };
    const sortColumn = allowedSortFields[sortBy || ''] || 'service.createdAt';

    const query = this.serviceRepository
      .createQueryBuilder('service')
      .leftJoin('service.category', 'category')
      .select([
        'service.id',
        'service.categoryId',
        'service.title',
        'service.description',
        'service.imageUrl',
        'service.duration',
        'service.price',
        'service.isActive',
        'service.createdAt',
        'category.id',
        'category.name',
      ])
      .where('service.isActive = :active', { active: true })
      .orderBy(sortColumn, sortOrder);

    if (categoryId) {
      query.andWhere('service.categoryId = :categoryId', { categoryId });
    }

    if (search) {
      query.andWhere(
        '(CAST(service.id as text) ILIKE :search OR service.title ILIKE :search OR service.description ILIKE :search)',
        {
          search: `%${search}%`,
        },
      );
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
      select: {
        id: true,
        categoryId: true,
        title: true,
        description: true,
        imageUrl: true,
        duration: true,
        price: true,
        isActive: true,
        createdAt: true,
        category: {
          id: true,
          name: true,
        },
      },
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

    const created = await this.serviceRepository.save(
      this.serviceRepository.create(createServiceDto),
    );
    return this.serviceRepository.findOne({
      where: { id: created.id },
      relations: { category: true },
      select: {
        id: true,
        categoryId: true,
        title: true,
        description: true,
        imageUrl: true,
        duration: true,
        price: true,
        isActive: true,
        createdAt: true,
        category: {
          id: true,
          name: true,
        },
      },
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
      select: {
        id: true,
        categoryId: true,
        title: true,
        description: true,
        imageUrl: true,
        duration: true,
        price: true,
        isActive: true,
        createdAt: true,
        category: {
          id: true,
          name: true,
        },
      },
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
