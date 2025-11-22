import { UpdateBookingStatusDto } from '../booking/dto/update-booking-status.dto';
import { PaginationDto, PaginatedResponse } from '../common/dto/pagination.dto';
import { BookingResponseDto } from '../booking/dto/booking-response.dto';
import { Injectable, NotFoundException } from '@nestjs/common';
import { BookingService } from '../booking/booking.service';
import { PrismaService } from '../prisma/prisma.service';
import { BookingStatus } from '@prisma/client';

@Injectable()
export class AdminService {
  constructor(
    private prisma: PrismaService,
    private bookingService: BookingService,
  ) {}

  async getAllBookings(
    paginationDto?: PaginationDto,
    status?: BookingStatus,
    startDate?: string,
    endDate?: string,
  ): Promise<PaginatedResponse<BookingResponseDto> | BookingResponseDto[]> {
    return this.bookingService.getAllBookings(paginationDto, status, startDate, endDate);
  }

  async getBookingById(bookingId: string): Promise<BookingResponseDto> {
    // Admin can view any booking
    return this.bookingService.getBookingById('', bookingId, true);
  }

  async updateBookingStatus(
    bookingId: string,
    updateBookingStatusDto: UpdateBookingStatusDto,
  ): Promise<BookingResponseDto> {
    return this.bookingService.updateBookingStatus(bookingId, updateBookingStatusDto);
  }

  async getAllUsers(paginationDto?: PaginationDto): Promise<PaginatedResponse<any> | any[]> {
    const where: any = {};

    if (paginationDto) {
      const page = paginationDto.page || 1;
      const limit = paginationDto.limit || 10;
      const skip = (page - 1) * limit;

      const [data, total] = await Promise.all([
        this.prisma.user.findMany({
          where,
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            imageUrl: true,
            role: true,
            createdAt: true,
            updatedAt: true,
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
        }),
        this.prisma.user.count({ where }),
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

    const users = await this.prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        imageUrl: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return users;
  }

  async getUserById(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        addresses: true,
        bookings: {
          include: {
            bookingServices: {
              include: {
                service: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }
}
