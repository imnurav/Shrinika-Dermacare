import { BookingModule } from '../booking/booking.module';
import { PrismaModule } from '../prisma/prisma.module';
import { UploadModule } from '../upload/upload.module';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { Module } from '@nestjs/common';

@Module({
  imports: [PrismaModule, BookingModule, UploadModule],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
