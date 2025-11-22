import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { UpdateBookingStatusDto } from '../booking/dto/update-booking-status.dto';
import { Controller, Get, Put, Param, Query, Body } from '@nestjs/common';
import { BookingResponseDto } from '../booking/dto/booking-response.dto';
import { ErrorResponseDto } from '../common/dto/error-response.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { AdminService } from './admin.service';
import { BookingStatus } from '@prisma/client';
import { UserRole } from '@prisma/client';

@ApiTags('Admin')
@ApiBearerAuth('JWT-auth')
@Roles(UserRole.ADMIN)
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('bookings')
  @ApiOperation({ summary: 'Get all bookings (Admin only)' })
  @ApiQuery({ name: 'status', required: false, enum: BookingStatus })
  @ApiQuery({ name: 'startDate', required: false, type: String, description: 'YYYY-MM-DD format' })
  @ApiQuery({ name: 'endDate', required: false, type: String, description: 'YYYY-MM-DD format' })
  @ApiResponse({
    status: 200,
    description: 'Bookings retrieved successfully',
    type: [BookingResponseDto],
  })
  async getAllBookings(
    @Query('status') status?: BookingStatus,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query() paginationDto?: PaginationDto,
  ) {
    return this.adminService.getAllBookings(paginationDto, status, startDate, endDate);
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

  @Get('users')
  @ApiOperation({ summary: 'Get all users (Admin only)' })
  @ApiResponse({ status: 200, description: 'Users retrieved successfully' })
  async getAllUsers(@Query() paginationDto?: PaginationDto) {
    return this.adminService.getAllUsers(paginationDto);
  }

  @Get('users/:id')
  @ApiOperation({ summary: 'Get user by ID (Admin only)' })
  @ApiResponse({ status: 200, description: 'User retrieved successfully' })
  @ApiResponse({ status: 404, description: 'User not found', type: ErrorResponseDto })
  async getUserById(@Param('id') userId: string) {
    return this.adminService.getUserById(userId);
  }
}
