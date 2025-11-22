import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { ErrorResponseDto } from '../common/dto/error-response.dto';
import { CategoryResponseDto } from './dto/category-response.dto';
import { ServiceResponseDto } from './dto/service-response.dto';
import { Public } from '../common/decorators/public.decorator';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { CatalogService } from './catalog.service';
import { UserRole } from '@prisma/client';
import {
  Controller,
  HttpStatus,
  HttpCode,
  Delete,
  Param,
  Query,
  Post,
  Body,
  Get,
  Put,
} from '@nestjs/common';

@ApiTags('Catalog')
@Controller('catalog')
export class CatalogController {
  constructor(private readonly catalogService: CatalogService) {}

  // Categories
  @Public()
  @Get('categories')
  @ApiOperation({ summary: 'Get all active categories' })
  @ApiQuery({
    name: 'includeServices',
    required: false,
    type: Boolean,
    description: 'Include services in response',
  })
  @ApiResponse({
    status: 200,
    description: 'Categories retrieved successfully',
    type: [CategoryResponseDto],
  })
  async getCategories(@Query('includeServices') includeServices?: string) {
    return this.catalogService.getCategories(includeServices === 'true');
  }

  @Public()
  @Get('categories/:id')
  @ApiOperation({ summary: 'Get category by ID' })
  @ApiQuery({ name: 'includeServices', required: false, type: Boolean })
  @ApiResponse({
    status: 200,
    description: 'Category retrieved successfully',
    type: CategoryResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Category not found', type: ErrorResponseDto })
  async getCategoryById(
    @Param('id') id: string,
    @Query('includeServices') includeServices?: string,
  ) {
    return this.catalogService.getCategoryById(id, includeServices === 'true');
  }

  @Post('categories')
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth('JWT-auth')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Create a new category (Admin only)' })
  @ApiResponse({
    status: 201,
    description: 'Category created successfully',
    type: CategoryResponseDto,
  })
  @ApiResponse({ status: 409, description: 'Category already exists', type: ErrorResponseDto })
  async createCategory(@Body() createCategoryDto: CreateCategoryDto): Promise<CategoryResponseDto> {
    return this.catalogService.createCategory(createCategoryDto);
  }

  @Put('categories/:id')
  @ApiBearerAuth('JWT-auth')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Update a category (Admin only)' })
  @ApiResponse({
    status: 200,
    description: 'Category updated successfully',
    type: CategoryResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Category not found', type: ErrorResponseDto })
  async updateCategory(
    @Param('id') id: string,
    @Body() updateCategoryDto: UpdateCategoryDto,
  ): Promise<CategoryResponseDto> {
    return this.catalogService.updateCategory(id, updateCategoryDto);
  }

  @Delete('categories/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth('JWT-auth')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete a category (Admin only)' })
  @ApiResponse({ status: 204, description: 'Category deleted successfully' })
  @ApiResponse({ status: 404, description: 'Category not found', type: ErrorResponseDto })
  @ApiResponse({
    status: 409,
    description: 'Category has associated services',
    type: ErrorResponseDto,
  })
  async deleteCategory(@Param('id') id: string): Promise<void> {
    return this.catalogService.deleteCategory(id);
  }

  // Services
  @Public()
  @Get('services')
  @ApiOperation({ summary: 'Get all active services' })
  @ApiQuery({ name: 'categoryId', required: false, type: String })
  @ApiResponse({
    status: 200,
    description: 'Services retrieved successfully',
    type: [ServiceResponseDto],
  })
  async getServices(
    @Query('categoryId') categoryId?: string,
    @Query() paginationDto?: PaginationDto,
  ) {
    return this.catalogService.getServices(categoryId, paginationDto);
  }

  @Public()
  @Get('services/:id')
  @ApiOperation({ summary: 'Get service by ID' })
  @ApiResponse({
    status: 200,
    description: 'Service retrieved successfully',
    type: ServiceResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Service not found', type: ErrorResponseDto })
  async getServiceById(@Param('id') id: string): Promise<ServiceResponseDto> {
    return this.catalogService.getServiceById(id);
  }

  @Post('services')
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth('JWT-auth')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Create a new service (Admin only)' })
  @ApiResponse({
    status: 201,
    description: 'Service created successfully',
    type: ServiceResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Category not found', type: ErrorResponseDto })
  async createService(@Body() createServiceDto: CreateServiceDto): Promise<ServiceResponseDto> {
    return this.catalogService.createService(createServiceDto);
  }

  @Put('services/:id')
  @ApiBearerAuth('JWT-auth')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Update a service (Admin only)' })
  @ApiResponse({
    status: 200,
    description: 'Service updated successfully',
    type: ServiceResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Service not found', type: ErrorResponseDto })
  async updateService(
    @Param('id') id: string,
    @Body() updateServiceDto: UpdateServiceDto,
  ): Promise<ServiceResponseDto> {
    return this.catalogService.updateService(id, updateServiceDto);
  }

  @Delete('services/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth('JWT-auth')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete a service (Admin only)' })
  @ApiResponse({ status: 204, description: 'Service deleted successfully' })
  @ApiResponse({ status: 404, description: 'Service not found', type: ErrorResponseDto })
  async deleteService(@Param('id') id: string): Promise<void> {
    return this.catalogService.deleteService(id);
  }
}
