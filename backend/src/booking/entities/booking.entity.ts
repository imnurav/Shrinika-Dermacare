import { BookingService } from './booking-service.entity';
import { Address } from '../../user/entities/address.entity';
import { User } from '../../user/entities/user.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';

export enum BookingStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

@Entity({ name: 'bookings' })
// @Check('chk_bookings_preferred_time_not_empty', `length(trim("preferredTime")) > 0`)
// @Index('idx_bookings_user_created_at', ['userId', 'createdAt'])
// @Index('idx_bookings_status_preferred_created', ['status', 'preferredDate', 'createdAt'])
export class Booking {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @Column()
  addressId: string;

  @Column({ length: 120 })
  personName: string;

  @Column({ length: 20 })
  personPhone: string;

  @Column({ type: 'date' })
  preferredDate: Date;

  @Column({ type: 'time' })
  preferredTime: string;

  @Column({ nullable: true, length: 1000 })
  notes?: string;

  @Column({
    type: 'enum',
    enum: BookingStatus,
    default: BookingStatus.PENDING,
  })
  status: BookingStatus;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;

  @ManyToOne(() => User, (user) => user.bookings, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @ManyToOne(() => Address, (address) => address.bookings, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'addressId' })
  address: Address;

  @OneToMany(() => BookingService, (bookingService) => bookingService.booking, {
    cascade: ['insert'],
  })
  bookingServices: BookingService[];
}
