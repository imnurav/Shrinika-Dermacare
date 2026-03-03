import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { UpdateBookingStatusDto } from '../booking/dto/update-booking-status.dto';
import { DashboardAnalyticsDto } from './dto/dashboard-analytics.dto';
import { ApiPaginationQuery, Pagination } from '../common/decorators/pagination.decorator';
import {
  Controller,
  Get,
  Put,
  Param,
  Query,
  Body,
  Post,
  Delete,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { BookingResponseDto } from '../booking/dto/booking-response.dto';
import { ErrorResponseDto } from '../common/dto/error-response.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { GetBookingsQueryDto } from '../booking/dto/get-bookings-query.dto';
import { CreateAdminBookingDto } from './dto/create-admin-booking.dto';
import { GetUsersQueryDto } from './dto/get-users-query.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateBookingDto } from '../booking/dto/update-booking.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { AdminService } from './admin.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { CreateUserDto } from './dto/create-user.dto';
import { BookingStatus } from '../booking/entities/booking.entity';
import { UserRole } from '../user/entities/user.entity';

@ApiTags('Admin')
@ApiBearerAuth('JWT-auth')
@Roles(UserRole.ADMIN)
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('analytics')
  @ApiOperation({ summary: 'Get dashboard analytics summary (Admin only)' })
  @ApiResponse({
    status: 200,
    description: 'Analytics retrieved successfully',
    type: DashboardAnalyticsDto,
  })
  async getDashboardAnalytics(): Promise<DashboardAnalyticsDto> {
    return this.adminService.getDashboardAnalytics();
  }

  @Get('bookings')
  @ApiOperation({ summary: 'Get all bookings (Admin only)' })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    description: 'Search by person name or phone',
  })
  @ApiQuery({ name: 'status', required: false, enum: BookingStatus })
  @ApiQuery({ name: 'startDate', required: false, type: String, description: 'YYYY-MM-DD format' })
  @ApiQuery({ name: 'endDate', required: false, type: String, description: 'YYYY-MM-DD format' })
  @ApiPaginationQuery()
  @ApiResponse({
    status: 200,
    description: 'Bookings retrieved successfully',
    type: [BookingResponseDto],
  })
  async getAllBookings(
    @Query() query?: GetBookingsQueryDto,
    @Pagination() paginationDto?: PaginationDto,
  ) {
    return this.adminService.getAllBookings(
      paginationDto,
      query?.status,
      query?.startDate,
      query?.endDate,
      query?.search,
      query?.sortBy,
      query?.sortOrder || 'DESC',
    );
  }

  @Post('bookings')
  @ApiOperation({ summary: 'Create booking for any user (Admin only)' })
  @ApiResponse({
    status: 201,
    description: 'Booking created successfully',
    type: BookingResponseDto,
  })
  async createBookingForUser(@Body() createAdminBookingDto: CreateAdminBookingDto) {
    return this.adminService.createBookingForUser(createAdminBookingDto);
  }

  @Get('bookings/:id')
  @ApiOperation({ summary: 'Get booking by ID (Admin only)' })
  @ApiResponse({
    status: 200,
    description: 'Booking retrieved successfully',
    type: BookingResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Booking not found', type: ErrorResponseDto })
  async getBookingById(@Param('id') bookingId: string): Promise<BookingResponseDto> {
    return this.adminService.getBookingById(bookingId);
  }

  @Put('bookings/:id/status')
  @ApiOperation({ summary: 'Update booking status (Admin only)' })
  @ApiResponse({
    status: 200,
    description: 'Booking status updated successfully',
    type: BookingResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Booking not found', type: ErrorResponseDto })
  async updateBookingStatus(
    @Param('id') bookingId: string,
    @Body() updateBookingStatusDto: UpdateBookingStatusDto,
  ): Promise<BookingResponseDto> {
    return this.adminService.updateBookingStatus(bookingId, updateBookingStatusDto);
  }

  @Put('bookings/:id')
  @ApiOperation({ summary: 'Update booking details (Admin only)' })
  @ApiResponse({
    status: 200,
    description: 'Booking updated successfully',
    type: BookingResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Booking not found', type: ErrorResponseDto })
  async updateBookingByAdmin(
    @Param('id') bookingId: string,
    @Body() updateBookingDto: UpdateBookingDto,
  ) {
    return this.adminService.updateBookingByAdmin(bookingId, updateBookingDto);
  }

  @Get('users')
  @ApiOperation({ summary: 'Get all users (Admin only)' })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    description: 'Search by name, email, or phone',
  })
  @ApiQuery({ name: 'startDate', required: false, type: String, description: 'YYYY-MM-DD format' })
  @ApiQuery({ name: 'endDate', required: false, type: String, description: 'YYYY-MM-DD format' })
  @ApiPaginationQuery()
  @ApiResponse({ status: 200, description: 'Users retrieved successfully' })
  async getAllUsers(
    @Query() query?: GetUsersQueryDto,
    @Pagination() paginationDto?: PaginationDto,
  ) {
    return this.adminService.getAllUsers(
      paginationDto,
      query?.search,
      query?.startDate,
      query?.endDate,
      query?.sortBy,
      query?.sortOrder || 'DESC',
    );
  }

  @Get('users/:id')
  @ApiOperation({ summary: 'Get user by ID (Admin only)' })
  @ApiResponse({ status: 200, description: 'User retrieved successfully' })
  @ApiResponse({ status: 404, description: 'User not found', type: ErrorResponseDto })
  async getUserById(@Param('id') userId: string) {
    return this.adminService.getUserById(userId);
  }

  @Post('users')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        email: { type: 'string' },
        phone: { type: 'string' },
        password: { type: 'string' },
        role: { type: 'string' },
        gender: { type: 'string', enum: ['MALE', 'FEMALE', 'OTHER'] },
        file: { type: 'string', format: 'binary' },
      },
    },
  })
  @ApiOperation({ summary: 'Create user (Admin/Superadmin)' })
  @ApiResponse({ status: 201, description: 'User created successfully' })
  async createUser(
    @CurrentUser() actor: any,
    @Body() createUserDto: CreateUserDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.adminService.createUser(actor, createUserDto, file);
  }

  @Put('users/:id')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        phone: { type: 'string' },
        imageUrl: { type: 'string' },
        role: { type: 'string' },
        gender: { type: 'string', enum: ['MALE', 'FEMALE', 'OTHER'] },
        file: { type: 'string', format: 'binary' },
      },
    },
  })
  @ApiOperation({ summary: 'Update user (Admin only)' })
  @ApiResponse({ status: 200, description: 'User updated successfully' })
  @ApiResponse({ status: 404, description: 'User not found', type: ErrorResponseDto })
  async updateUser(
    @CurrentUser() actor: any,
    @Param('id') userId: string,
    @Body() updateUserDto: UpdateUserDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.adminService.updateUser(actor, userId, updateUserDto, file);
  }

  @Delete('users/:id')
  @ApiOperation({ summary: 'Delete user (Admin/Superadmin with role rules)' })
  @ApiResponse({ status: 200, description: 'User deleted successfully' })
  @ApiResponse({ status: 403, description: 'Permission denied', type: ErrorResponseDto })
  @ApiResponse({ status: 404, description: 'User not found', type: ErrorResponseDto })
  async deleteUser(@CurrentUser() actor: any, @Param('id') userId: string) {
    await this.adminService.deleteUser(actor, userId);
    return { success: true };
  }
}
