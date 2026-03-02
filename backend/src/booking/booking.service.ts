import { PaginationDto, PaginatedResponse } from '../common/dto/pagination.dto';
import { UpdateBookingStatusDto } from './dto/update-booking-status.dto';
import { BookingResponseDto } from './dto/booking-response.dto';
import { CreateBookingDto } from './dto/create-booking.dto';
import { BookingStatus, Booking } from './entities/booking.entity';
import { BookingService as BookingServiceEntity } from './entities/booking-service.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Address } from '../user/entities/address.entity';
import { Service } from '../catalog/entities/service.entity';
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
  Injectable,
} from '@nestjs/common';
import { DataSource, In, Repository } from 'typeorm';

@Injectable()
export class BookingService {
  constructor(
    @InjectRepository(Booking)
    private readonly bookingRepository: Repository<Booking>,
    @InjectRepository(Address)
    private readonly addressRepository: Repository<Address>,
    @InjectRepository(Service)
    private readonly serviceRepository: Repository<Service>,
    @InjectRepository(BookingServiceEntity)
    private readonly bookingServiceRepository: Repository<BookingServiceEntity>,
    private readonly dataSource: DataSource,
  ) {}

  private readonly bookingRelations = {
    address: true,
    bookingServices: { service: { category: true } },
  } as const;

  private parseTimeToMinutes(value: string): number | null {
    const normalized = value.trim().toUpperCase();
    const amPmMatch = normalized.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/);
    if (amPmMatch) {
      const hour = Number(amPmMatch[1]);
      const minute = Number(amPmMatch[2]);
      const amPm = amPmMatch[3];
      if (hour < 1 || hour > 12 || minute < 0 || minute > 59) return null;
      const hour24 = amPm === 'AM' ? (hour === 12 ? 0 : hour) : hour === 12 ? 12 : hour + 12;
      return hour24 * 60 + minute;
    }

    const hmsMatch = normalized.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
    if (hmsMatch) {
      const hour = Number(hmsMatch[1]);
      const minute = Number(hmsMatch[2]);
      if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return null;
      return hour * 60 + minute;
    }

    return null;
  }

  private validatePreferredSlot(preferredDate: string, preferredTime: string): void {
    const slotDate = new Date(preferredDate);
    if (Number.isNaN(slotDate.getTime())) {
      throw new BadRequestException('Invalid preferred date');
    }

    const now = new Date();
    const today = now.toISOString().slice(0, 10);
    const slotDateIso = slotDate.toISOString().slice(0, 10);

    if (slotDateIso < today) {
      throw new BadRequestException('Preferred date cannot be in the past');
    }

    if (slotDateIso === today) {
      const slotMinutes = this.parseTimeToMinutes(preferredTime);
      if (slotMinutes === null) {
        throw new BadRequestException('Invalid preferred time format');
      }
      const nowMinutes = now.getHours() * 60 + now.getMinutes();
      if (slotMinutes < nowMinutes) {
        throw new BadRequestException('Preferred time cannot be in the past');
      }
    }
  }

  async createBooking(
    userId: string,
    createBookingDto: CreateBookingDto,
  ): Promise<BookingResponseDto> {
    const { serviceIds, addressId, preferredDate, preferredTime, personName, personPhone, notes } =
      createBookingDto;

    this.validatePreferredSlot(preferredDate, preferredTime);

    // Verify address belongs to user
    const address = await this.addressRepository.findOne({
      where: { id: addressId },
    });

    if (!address) {
      throw new NotFoundException('Address not found');
    }

    if (address.userId !== userId) {
      throw new ForbiddenException('Address does not belong to you');
    }

    // Verify all services exist and are active
    const services = await this.serviceRepository.find({
      where: {
        id: In(serviceIds),
        isActive: true,
      },
    });

    if (services.length !== serviceIds.length) {
      throw new NotFoundException('One or more services not found or inactive');
    }

    const bookingId = await this.dataSource.transaction(async (manager) => {
      const booking = manager.create(Booking, {
        userId,
        addressId,
        personName,
        personPhone,
        preferredDate: new Date(preferredDate),
        preferredTime,
        notes,
        status: BookingStatus.PENDING,
      });

      const createdBooking = await manager.save(Booking, booking);

      const bookingServices = serviceIds.map((serviceId) =>
        manager.create(BookingServiceEntity, {
          bookingId: createdBooking.id,
          serviceId,
        }),
      );
      await manager.save(BookingServiceEntity, bookingServices);

      return createdBooking.id;
    });

    const booking = await this.bookingRepository.findOne({
      where: { id: bookingId },
      relations: this.bookingRelations,
    });

    return booking as BookingResponseDto;
  }

  async updateBookingAsAdmin(
    bookingId: string,
    updateBookingDto: any,
  ): Promise<BookingResponseDto> {
    const booking = await this.bookingRepository.findOne({ where: { id: bookingId } });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    const data: Partial<Booking> = {};
    const manualOverride = Boolean(updateBookingDto.manualOverride);

    if (updateBookingDto.personName !== undefined) data.personName = updateBookingDto.personName;
    if (updateBookingDto.personPhone !== undefined) data.personPhone = updateBookingDto.personPhone;
    if (updateBookingDto.preferredTime !== undefined)
      data.preferredTime = updateBookingDto.preferredTime;
    if (updateBookingDto.notes !== undefined) data.notes = updateBookingDto.notes;
    if (updateBookingDto.preferredDate !== undefined)
      data.preferredDate = new Date(updateBookingDto.preferredDate);

    const effectiveDate =
      updateBookingDto.preferredDate !== undefined
        ? updateBookingDto.preferredDate
        : booking.preferredDate.toISOString().slice(0, 10);
    const effectiveTime =
      updateBookingDto.preferredTime !== undefined ? updateBookingDto.preferredTime : booking.preferredTime;

    if (!manualOverride && (updateBookingDto.preferredDate !== undefined || updateBookingDto.preferredTime !== undefined)) {
      this.validatePreferredSlot(effectiveDate, effectiveTime);
    }

    // If addressId provided, verify it exists
    if (updateBookingDto.addressId !== undefined) {
      const address = await this.addressRepository.findOne({
        where: { id: updateBookingDto.addressId },
      });
      if (!address) {
        throw new NotFoundException('Address not found');
      }
      data.addressId = updateBookingDto.addressId;
    }

    await this.dataSource.transaction(async (manager) => {
      if (Object.keys(data).length > 0) {
        await manager.update(Booking, { id: bookingId }, data);
      }

      if (updateBookingDto.serviceIds !== undefined) {
        await manager.delete(BookingServiceEntity, { bookingId });

        const bookingServices = updateBookingDto.serviceIds.map((serviceId: string) =>
          manager.create(BookingServiceEntity, { bookingId, serviceId }),
        );

        if (bookingServices.length > 0) {
          await manager.save(BookingServiceEntity, bookingServices);
        }
      }
    });

    const updated = await this.bookingRepository.findOne({
      where: { id: bookingId },
      relations: this.bookingRelations,
    });
    return updated as BookingResponseDto;
  }

  async getUserBookings(
    userId: string,
    paginationDto?: PaginationDto,
    status?: BookingStatus,
  ): Promise<PaginatedResponse<BookingResponseDto> | BookingResponseDto[]> {
    const query = this.bookingRepository
      .createQueryBuilder('booking')
      .leftJoinAndSelect('booking.address', 'address')
      .leftJoinAndSelect('booking.bookingServices', 'bookingService')
      .leftJoinAndSelect('bookingService.service', 'service')
      .leftJoinAndSelect('service.category', 'category')
      .where('booking.userId = :userId', { userId })
      .orderBy('booking.createdAt', 'DESC');

    if (status) {
      query.andWhere('booking.status = :status', { status });
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

  async getBookingById(
    userId: string,
    bookingId: string,
    isAdmin = false,
  ): Promise<BookingResponseDto> {
    const booking = await this.bookingRepository.findOne({
      where: { id: bookingId },
      relations: this.bookingRelations,
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
    const booking = await this.bookingRepository.findOne({
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

    await this.bookingRepository.update({ id: bookingId }, { status: BookingStatus.CANCELLED });

    return (await this.bookingRepository.findOne({
      where: { id: bookingId },
      relations: this.bookingRelations,
    })) as BookingResponseDto;
  }

  async updateBookingStatus(
    bookingId: string,
    updateBookingStatusDto: UpdateBookingStatusDto,
  ): Promise<BookingResponseDto> {
    const booking = await this.bookingRepository.findOne({
      where: { id: bookingId },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    await this.bookingRepository.update(
      { id: bookingId },
      { status: updateBookingStatusDto.status },
    );

    return (await this.bookingRepository.findOne({
      where: { id: bookingId },
      relations: this.bookingRelations,
    })) as BookingResponseDto;
  }

  async getAllBookings(
    paginationDto?: PaginationDto,
    status?: BookingStatus,
    startDate?: string,
    endDate?: string,
    search?: string,
  ): Promise<PaginatedResponse<BookingResponseDto> | BookingResponseDto[]> {
    const query = this.bookingRepository
      .createQueryBuilder('booking')
      .leftJoinAndSelect('booking.address', 'address')
      .leftJoinAndSelect('booking.bookingServices', 'bookingService')
      .leftJoinAndSelect('bookingService.service', 'service')
      .leftJoinAndSelect('service.category', 'category')
      .orderBy('booking.createdAt', 'DESC');

    if (search) {
      query.andWhere('(booking.personName ILIKE :search OR booking.personPhone ILIKE :search)', {
        search: `%${search}%`,
      });
    }

    if (status) {
      query.andWhere('booking.status = :status', { status });
    }

    if (startDate) {
      query.andWhere('booking.preferredDate >= :startDate', {
        startDate: new Date(startDate),
      });
    }

    if (endDate) {
      query.andWhere('booking.preferredDate <= :endDate', {
        endDate: new Date(endDate),
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
}
