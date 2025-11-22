import { UpdateBookingStatusDto } from '../booking/dto/update-booking-status.dto';
import { PaginationDto, PaginatedResponse } from '../common/dto/pagination.dto';
import { BookingResponseDto } from '../booking/dto/booking-response.dto';
import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { BookingService } from '../booking/booking.service';
import { UploadService } from '../upload/upload.service';
import { PrismaService } from '../prisma/prisma.service';
import { BookingStatus, UserRole } from '@prisma/client';

@Injectable()
export class AdminService {
  constructor(
    private prisma: PrismaService,
    private bookingService: BookingService,
    private uploadService: UploadService,
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

  async updateUser(actor: any, userId: string, updateUserDto: any, file?: Express.Multer.File) {
    const existing = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!existing) {
      throw new NotFoundException('User not found');
    }

    const actorRole = actor?.role;
    const isSelf = actor?.id === userId;

    // Only ADMIN or SUPERADMIN (or higher) reach this controller due to @Roles, but double-check
    if (!actorRole) {
      throw new ForbiddenException('Unauthorized');
    }

    // Role change rules
    // Prevent non-superadmins from modifying SUPERADMIN accounts
    if (existing.role === UserRole.SUPERADMIN && actorRole !== UserRole.SUPERADMIN) {
      throw new ForbiddenException('Cannot modify SUPERADMIN account');
    }

    if (updateUserDto.role !== undefined) {
      if (actorRole === UserRole.SUPERADMIN) {
        // allowed to set any role
      } else if (actorRole === UserRole.ADMIN) {
        // Admins cannot change their own role
        if (isSelf) {
          throw new ForbiddenException('Admin cannot change own role');
        }
        // Admins cannot assign SUPERADMIN role
        if (updateUserDto.role === UserRole.SUPERADMIN) {
          throw new ForbiddenException('Admin cannot assign SUPERADMIN role');
        }
      } else {
        throw new ForbiddenException('You do not have permission to change roles');
      }
    }

    // If actor is ADMIN and updating self, prevent role change (already handled) but allow other fields
    const data: any = {};
    if (updateUserDto.name !== undefined) data.name = updateUserDto.name;
    if (updateUserDto.phone !== undefined) data.phone = updateUserDto.phone;
    if (file) {
      // save uploaded file and set imageUrl
      const url = await this.uploadService.saveFile(file, 'users');
      data.imageUrl = url;
    } else if (updateUserDto.imageUrl !== undefined) {
      data.imageUrl = updateUserDto.imageUrl;
    }
    if (updateUserDto.role !== undefined) data.role = updateUserDto.role;

    const updated = await this.prisma.user.update({ where: { id: userId }, data });
    return updated;
  }

  async createUser(actor: any, createUserDto: any, file?: Express.Multer.File) {
    const actorRole = actor?.role;
    if (!actorRole) {
      throw new ForbiddenException('Unauthorized');
    }

    // Determine role for new user
    const roleToAssign = createUserDto.role ?? 'USER';

    if (actorRole === UserRole.SUPERADMIN) {
      // allowed to assign any role
    } else if (actorRole === UserRole.ADMIN) {
      // Admins may only create regular users (cannot create ADMIN or SUPERADMIN)
      if (roleToAssign === UserRole.SUPERADMIN || roleToAssign === UserRole.ADMIN) {
        throw new ForbiddenException('Admin cannot create users with elevated roles');
      }
    } else {
      throw new ForbiddenException('You do not have permission to create users');
    }

    // Check unique constraints
    if (createUserDto.email) {
      const existingEmail = await this.prisma.user.findUnique({
        where: { email: createUserDto.email },
      });
      if (existingEmail) throw new ForbiddenException('Email already in use');
    }
    if (createUserDto.phone) {
      const existingPhone = await this.prisma.user.findUnique({
        where: { phone: createUserDto.phone },
      });
      if (existingPhone) throw new ForbiddenException('Phone already in use');
    }

    // Hash password
    const bcrypt = await import('bcrypt');
    const hashed = await bcrypt.hash(createUserDto.password, 10);
    // If a file was uploaded, save it and use returned URL
    let imageUrl = createUserDto.imageUrl;
    if (file) {
      imageUrl = await this.uploadService.saveFile(file, 'users');
    }

    const created = await this.prisma.user.create({
      data: {
        name: createUserDto.name,
        email: createUserDto.email,
        phone: createUserDto.phone,
        password: hashed,
        imageUrl,
        role: roleToAssign,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        imageUrl: true,
        role: true,
      },
    });

    return created;
  }

  async updateBookingByAdmin(bookingId: string, updateBookingDto: any) {
    // Delegate to booking service which owns booking logic
    return this.bookingService.updateBookingAsAdmin(bookingId, updateBookingDto);
  }
}
