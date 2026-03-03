import { BookingModule } from '../booking/booking.module';
import { UploadModule } from '../upload/upload.module';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Booking } from '../booking/entities/booking.entity';
import { Category } from '../catalog/entities/category.entity';
import { Service } from '../catalog/entities/service.entity';
import { User } from '../user/entities/user.entity';
import { Module } from '@nestjs/common';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Booking, Category, Service]),
    BookingModule,
    UploadModule,
  ],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
