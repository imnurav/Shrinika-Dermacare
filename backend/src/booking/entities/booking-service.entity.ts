import { Service } from '../../catalog/entities/service.entity';
import { Booking } from './booking.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';

@Entity({ name: 'booking_services' })
@Unique(['bookingId', 'serviceId'])
// @Index('idx_booking_services_service_id', ['serviceId'])
export class BookingService {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  bookingId: string;

  @Column()
  serviceId: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @ManyToOne(() => Booking, (booking) => booking.bookingServices, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'bookingId' })
  booking: Booking;

  @ManyToOne(() => Service, (service) => service.bookingServices, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'serviceId' })
  service: Service;
}
