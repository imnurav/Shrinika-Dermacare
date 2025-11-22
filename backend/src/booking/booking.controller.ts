import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ErrorResponseDto } from '../common/dto/error-response.dto';
import { BookingResponseDto } from './dto/booking-response.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { GetBookingsQueryDto } from './dto/get-bookings-query.dto';
import { CreateBookingDto } from './dto/create-booking.dto';
import { BookingService } from './booking.service';
import { BookingStatus } from '@prisma/client';
import {
  Controller,
  HttpStatus,
  HttpCode,
  Param,
  Query,
  Post,
  Body,
  Get,
  Put,
} from '@nestjs/common';
@ApiTags('Booking')
@ApiBearerAuth('JWT-auth')
@Controller('bookings')
export class BookingController {
  constructor(private readonly bookingService: BookingService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new booking' })
  @ApiResponse({
    status: 201,
    description: 'Booking created successfully',
    type: BookingResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Address or service not found', type: ErrorResponseDto })
  @ApiResponse({ status: 403, description: 'Permission denied', type: ErrorResponseDto })
  async createBooking(
    @CurrentUser() user: any,
    @Body() createBookingDto: CreateBookingDto,
  ): Promise<BookingResponseDto> {
    return this.bookingService.createBooking(user.id, createBookingDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get current user bookings' })
  @ApiQuery({ name: 'status', required: false, enum: BookingStatus })
  @ApiResponse({
    status: 200,
    description: 'Bookings retrieved successfully',
    type: [BookingResponseDto],
  })
  async getUserBookings(@CurrentUser() user: any, @Query() query?: GetBookingsQueryDto) {
    const paginationDto: PaginationDto | undefined = query
      ? { page: query.page, limit: query.limit }
      : undefined;
    return this.bookingService.getUserBookings(user.id, paginationDto, query?.status);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get booking by ID' })
  @ApiResponse({
    status: 200,
    description: 'Booking retrieved successfully',
    type: BookingResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Booking not found', type: ErrorResponseDto })
  @ApiResponse({ status: 403, description: 'Permission denied', type: ErrorResponseDto })
  async getBookingById(
    @CurrentUser() user: any,
    @Param('id') bookingId: string,
  ): Promise<BookingResponseDto> {
    return this.bookingService.getBookingById(user.id, bookingId);
  }

  @Put(':id/cancel')
  @ApiOperation({ summary: 'Cancel a booking (only PENDING bookings)' })
  @ApiResponse({
    status: 200,
    description: 'Booking cancelled successfully',
    type: BookingResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Only pending bookings can be cancelled',
    type: ErrorResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Booking not found', type: ErrorResponseDto })
  @ApiResponse({ status: 403, description: 'Permission denied', type: ErrorResponseDto })
  async cancelBooking(
    @CurrentUser() user: any,
    @Param('id') bookingId: string,
  ): Promise<BookingResponseDto> {
    return this.bookingService.cancelBooking(user.id, bookingId);
  }
}
