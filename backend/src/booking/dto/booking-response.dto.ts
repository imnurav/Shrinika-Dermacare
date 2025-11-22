import { ServiceResponseDto } from '../../catalog/dto/service-response.dto';
import { AddressResponseDto } from '../../user/dto/address-response.dto';
import { BookingStatus } from '@prisma/client';
import { ApiProperty } from '@nestjs/swagger';

export class BookingServiceResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  bookingId: string;

  @ApiProperty()
  serviceId: string;

  @ApiProperty({ type: () => ServiceResponseDto })
  service: ServiceResponseDto;
}

export class BookingResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  userId: string;

  @ApiProperty()
  addressId: string;

  @ApiProperty({ type: () => AddressResponseDto })
  address: AddressResponseDto;

  @ApiProperty()
  personName: string;

  @ApiProperty()
  personPhone: string;

  @ApiProperty()
  preferredDate: Date;

  @ApiProperty()
  preferredTime: string;

  @ApiProperty({ required: false })
  notes?: string;

  @ApiProperty({ enum: BookingStatus })
  status: BookingStatus;

  @ApiProperty({ type: () => [BookingServiceResponseDto] })
  bookingServices: BookingServiceResponseDto[];

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
