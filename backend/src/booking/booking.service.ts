import { PaginationDto, PaginatedResponse } from '../common/dto/pagination.dto';
import { UpdateBookingStatusDto } from './dto/update-booking-status.dto';
import { BookingResponseDto } from './dto/booking-response.dto';
import { CreateBookingDto } from './dto/create-booking.dto';
import { PrismaService } from '../prisma/prisma.service';
import { BookingStatus } from '@prisma/client';
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
  Injectable,
} from '@nestjs/common';

@Injectable()
export class BookingService {
  constructor(private prisma: PrismaService) {}

  async createBooking(
    userId: string,
    createBookingDto: CreateBookingDto,
  ): Promise<BookingResponseDto> {
    const { serviceIds, addressId, preferredDate, preferredTime, personName, personPhone, notes } =
      createBookingDto;

    // Verify address belongs to user
    const address = await this.prisma.address.findUnique({
      where: { id: addressId },
    });

    if (!address) {
      throw new NotFoundException('Address not found');
    }

    if (address.userId !== userId) {
      throw new ForbiddenException('Address does not belong to you');
    }

    // Verify all services exist and are active
    const services = await this.prisma.service.findMany({
      where: {
        id: { in: serviceIds },
        isActive: true,
      },
    });

    if (services.length !== serviceIds.length) {
      throw new NotFoundException('One or more services not found or inactive');
    }

    // Create booking with services
    const booking = await this.prisma.booking.create({
      data: {
        userId,
        addressId,
        personName,
        personPhone,
        preferredDate: new Date(preferredDate),
        preferredTime,
        notes,
        status: BookingStatus.PENDING,
        bookingServices: {
          create: serviceIds.map((serviceId) => ({
            serviceId,
          })),
        },
      },
      include: {
        address: true,
        bookingServices: {
          include: {
            service: {
              include: {
                category: true,
              },
            },
          },
        },
      },
    });

    return booking as BookingResponseDto;
  }

  async updateBookingAsAdmin(
    bookingId: string,
    updateBookingDto: any,
  ): Promise<BookingResponseDto> {
    const booking = await this.prisma.booking.findUnique({ where: { id: bookingId } });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    const data: any = {};

    if (updateBookingDto.personName !== undefined) data.personName = updateBookingDto.personName;
    if (updateBookingDto.personPhone !== undefined) data.personPhone = updateBookingDto.personPhone;
    if (updateBookingDto.preferredTime !== undefined)
      data.preferredTime = updateBookingDto.preferredTime;
    if (updateBookingDto.notes !== undefined) data.notes = updateBookingDto.notes;
    if (updateBookingDto.preferredDate !== undefined)
      data.preferredDate = new Date(updateBookingDto.preferredDate);

    // If addressId provided, verify it exists
    if (updateBookingDto.addressId !== undefined) {
      const address = await this.prisma.address.findUnique({
        where: { id: updateBookingDto.addressId },
      });
      if (!address) {
        throw new NotFoundException('Address not found');
      }
      data.addressId = updateBookingDto.addressId;
    }

    // If serviceIds provided, replace bookingServices
    const bookingUpdate: any = {
      where: { id: bookingId },
      include: {
        address: true,
        bookingServices: { include: { service: { include: { category: true } } } },
      },
    };

    if (updateBookingDto.serviceIds !== undefined) {
      bookingUpdate['data'] = {
        ...data,
        bookingServices: {
          deleteMany: {},
          create: updateBookingDto.serviceIds.map((serviceId: string) => ({ serviceId })),
        },
      };
    } else {
      bookingUpdate['data'] = data;
    }

    const updated = await this.prisma.booking.update(bookingUpdate as any);
    return updated as BookingResponseDto;
  }

  async getUserBookings(
    userId: string,
    paginationDto?: PaginationDto,
    status?: BookingStatus,
  ): Promise<PaginatedResponse<BookingResponseDto> | BookingResponseDto[]> {
    const where: any = { userId };
    if (status) where.status = status;

    if (paginationDto) {
      const page = paginationDto.page || 1;
      const limit = paginationDto.limit || 10;
      const skip = (page - 1) * limit;

      const [data, total] = await Promise.all([
        this.prisma.booking.findMany({
          where,
          include: {
            address: true,
            bookingServices: {
              include: {
                service: {
                  include: {
                    category: true,
                  },
                },
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
        }),
        this.prisma.booking.count({ where }),
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

    const bookings = await this.prisma.booking.findMany({
      where,
      include: {
        address: true,
        bookingServices: {
          include: {
            service: {
              include: {
                category: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return bookings;
  }

  async getBookingById(
    userId: string,
    bookingId: string,
    isAdmin = false,
  ): Promise<BookingResponseDto> {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        address: true,
        bookingServices: {
          include: {
            service: {
              include: {
                category: true,
              },
            },
          },
        },
      },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    // Users can only view their own bookings unless admin
    if (!isAdmin && booking.userId !== userId) {
      throw new ForbiddenException('You do not have permission to view this booking');
    }

    return booking as BookingResponseDto;
  }

  async cancelBooking(userId: string, bookingId: string): Promise<BookingResponseDto> {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    if (booking.userId !== userId) {
      throw new ForbiddenException('You do not have permission to cancel this booking');
    }

    // Users can only cancel bookings that are PENDING
    if (booking.status !== BookingStatus.PENDING) {
      throw new BadRequestException('Only pending bookings can be cancelled by users');
    }

    const updatedBooking = await this.prisma.booking.update({
      where: { id: bookingId },
      data: { status: BookingStatus.CANCELLED },
      include: {
        address: true,
        bookingServices: {
          include: {
            service: {
              include: {
                category: true,
              },
            },
          },
        },
      },
    });

    return updatedBooking as BookingResponseDto;
  }

  async updateBookingStatus(
    bookingId: string,
    updateBookingStatusDto: UpdateBookingStatusDto,
  ): Promise<BookingResponseDto> {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    const updatedBooking = await this.prisma.booking.update({
      where: { id: bookingId },
      data: { status: updateBookingStatusDto.status },
      include: {
        address: true,
        bookingServices: {
          include: {
            service: {
              include: {
                category: true,
              },
            },
          },
        },
      },
    });

    return updatedBooking as BookingResponseDto;
  }

  async getAllBookings(
    paginationDto?: PaginationDto,
    status?: BookingStatus,
    startDate?: string,
    endDate?: string,
  ): Promise<PaginatedResponse<BookingResponseDto> | BookingResponseDto[]> {
    const where: any = {};

    if (status) {
      where.status = status;
    }

    if (startDate || endDate) {
      where.preferredDate = {};
      if (startDate) {
        where.preferredDate.gte = new Date(startDate);
      }
      if (endDate) {
        where.preferredDate.lte = new Date(endDate);
      }
    }

    if (paginationDto) {
      const page = paginationDto.page || 1;
      const limit = paginationDto.limit || 10;
      const skip = (page - 1) * limit;

      const [data, total] = await Promise.all([
        this.prisma.booking.findMany({
          where,
          include: {
            address: true,
            bookingServices: {
              include: {
                service: {
                  include: {
                    category: true,
                  },
                },
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
        }),
        this.prisma.booking.count({ where }),
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

    const bookings = await this.prisma.booking.findMany({
      where,
      include: {
        address: true,
        bookingServices: {
          include: {
            service: {
              include: {
                category: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return bookings;
  }
}
