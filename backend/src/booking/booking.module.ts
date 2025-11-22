import { BookingController } from './booking.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { BookingService } from './booking.service';
import { Module } from '@nestjs/common';

@Module({
  imports: [PrismaModule],
  controllers: [BookingController],
  providers: [BookingService],
  exports: [BookingService],
})
export class BookingModule {}
