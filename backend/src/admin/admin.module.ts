import { BookingModule } from '../booking/booking.module';
import { PrismaModule } from '../prisma/prisma.module';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { Module } from '@nestjs/common';

@Module({
  imports: [PrismaModule, BookingModule],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
