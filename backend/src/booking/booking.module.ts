import { BookingController } from './booking.controller';
import { BookingService } from './booking.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BookingService as BookingServiceEntity } from './entities/booking-service.entity';
import { Address } from '../user/entities/address.entity';
import { Booking } from './entities/booking.entity';
import { Category } from '../catalog/entities/category.entity';
import { Service } from '../catalog/entities/service.entity';
import { Module } from '@nestjs/common';

@Module({
  imports: [
    TypeOrmModule.forFeature([Booking, BookingServiceEntity, Address, Service, Category]),
  ],
  controllers: [BookingController],
  providers: [BookingService],
  exports: [BookingService],
})
export class BookingModule {}
