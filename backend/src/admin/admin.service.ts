import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { UpdateBookingStatusDto } from '../booking/dto/update-booking-status.dto';
import { DashboardAnalyticsDto } from './dto/dashboard-analytics.dto';
import { PaginationDto, PaginatedResponse } from '../common/dto/pagination.dto';
import { BookingResponseDto } from '../booking/dto/booking-response.dto';
import { BookingService } from '../booking/booking.service';
import { UploadService } from '../upload/upload.service';
import { Booking, BookingStatus } from '../booking/entities/booking.entity';
import { Category } from '../catalog/entities/category.entity';
import { Service } from '../catalog/entities/service.entity';
import { User, UserRole } from '../user/entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Booking)
    private readonly bookingRepository: Repository<Booking>,
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
    @InjectRepository(Service)
    private readonly serviceRepository: Repository<Service>,
    private bookingService: BookingService,
    private uploadService: UploadService,
  ) {}

  async getDashboardAnalytics(): Promise<DashboardAnalyticsDto> {
    const [totalUsers, totalCategories, totalServices, totalBookings, statusRows, recentBookings] =
      await Promise.all([
        this.userRepository.count(),
        this.categoryRepository.count(),
        this.serviceRepository.count(),
        this.bookingRepository.count(),
        this.bookingRepository
          .createQueryBuilder('booking')
          .select('booking.status', 'status')
          .addSelect('COUNT(*)', 'count')
          .groupBy('booking.status')
          .getRawMany<{ status: BookingStatus; count: string }>(),
        this.bookingRepository.find({
          select: ['id', 'personName', 'status', 'preferredDate', 'createdAt'],
          order: { createdAt: 'DESC' },
          take: 6,
        }),
      ]);

    const statusCounts = {
      [BookingStatus.PENDING]: 0,
      [BookingStatus.CONFIRMED]: 0,
      [BookingStatus.COMPLETED]: 0,
      [BookingStatus.CANCELLED]: 0,
    };

    for (const row of statusRows) {
      statusCounts[row.status] = Number(row.count);
    }

    return {
      totalBookings,
      pendingBookings: statusCounts[BookingStatus.PENDING],
      confirmedBookings: statusCounts[BookingStatus.CONFIRMED],
      completedBookings: statusCounts[BookingStatus.COMPLETED],
      cancelledBookings: statusCounts[BookingStatus.CANCELLED],
      totalCategories,
      totalServices,
      totalUsers,
      recentBookings,
    };
  }

  async getAllBookings(
    paginationDto?: PaginationDto,
    status?: BookingStatus,
    startDate?: string,
    endDate?: string,
    search?: string,
  ): Promise<PaginatedResponse<BookingResponseDto> | BookingResponseDto[]> {
    return this.bookingService.getAllBookings(paginationDto, status, startDate, endDate, search);
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

  async getAllUsers(
    paginationDto?: PaginationDto,
    search?: string,
  ): Promise<PaginatedResponse<any> | any[]> {
    const query = this.userRepository
      .createQueryBuilder('user')
      .select([
        'user.id',
        'user.name',
        'user.email',
        'user.phone',
        'user.imageUrl',
        'user.role',
        'user.createdAt',
        'user.updatedAt',
      ])
      .orderBy('user.createdAt', 'DESC');

    if (search) {
      query.where('(user.name ILIKE :search OR user.email ILIKE :search OR user.phone ILIKE :search)', {
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

  async getUserById(userId: string) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: {
        addresses: true,
        bookings: {
          bookingServices: {
            service: true,
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
    const existing = await this.userRepository.findOne({ where: { id: userId } });
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

    await this.userRepository.update({ id: userId }, data);
    return this.userRepository.findOne({ where: { id: userId } });
  }

  async createUser(actor: any, createUserDto: any, file?: Express.Multer.File) {
    const actorRole = actor?.role;
    if (!actorRole) {
      throw new ForbiddenException('Unauthorized');
    }

    // Determine role for new user
    const roleToAssign = createUserDto.role ?? UserRole.USER;

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
      const existingEmail = await this.userRepository.findOne({
        where: { email: createUserDto.email },
      });
      if (existingEmail) throw new ForbiddenException('Email already in use');
    }
    if (createUserDto.phone) {
      const existingPhone = await this.userRepository.findOne({
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

    const created = await this.userRepository.save(
      this.userRepository.create({
        name: createUserDto.name,
        email: createUserDto.email,
        phone: createUserDto.phone,
        password: hashed,
        imageUrl,
        role: roleToAssign,
      }),
    );

    return {
      id: created.id,
      name: created.name,
      email: created.email,
      phone: created.phone,
      imageUrl: created.imageUrl,
      role: created.role,
    };
  }

  async updateBookingByAdmin(bookingId: string, updateBookingDto: any) {
    // Delegate to booking service which owns booking logic
    return this.bookingService.updateBookingAsAdmin(bookingId, updateBookingDto);
  }

  async deleteUser(actor: any, userId: string): Promise<void> {
    const actorRole = actor?.role;
    if (!actorRole) {
      throw new ForbiddenException('Unauthorized');
    }

    const target = await this.userRepository.findOne({ where: { id: userId } });
    if (!target) {
      throw new NotFoundException('User not found');
    }

    if (actor?.id === userId) {
      throw new ForbiddenException('You cannot delete your own account');
    }

    if (actorRole === UserRole.SUPERADMIN) {
      // SUPERADMIN can delete any non-self account
      await this.userRepository.delete({ id: userId });
      return;
    }

    if (actorRole === UserRole.ADMIN) {
      // ADMIN can delete only regular users
      if (target.role !== UserRole.USER) {
        throw new ForbiddenException('Admin can delete only USER accounts');
      }
      await this.userRepository.delete({ id: userId });
      return;
    }

    throw new ForbiddenException('You do not have permission to delete users');
  }
}
