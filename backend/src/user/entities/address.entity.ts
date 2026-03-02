import { Booking } from '../../booking/entities/booking.entity';
import { User } from './user.entity';
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

@Entity({ name: 'addresses' })
// @Index('idx_addresses_user_created_at', ['userId', 'createdAt'])
// @Check(
//   'chk_addresses_latitude_range',
//   '"latitude" IS NULL OR ("latitude" >= -90 AND "latitude" <= 90)',
// )
// @Check(
//   'chk_addresses_longitude_range',
//   '"longitude" IS NULL OR ("longitude" >= -180 AND "longitude" <= 180)',
// )
export class Address {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @Column({ length: 50 })
  label: string;

  @Column({ length: 255 })
  addressLine1: string;

  @Column({ nullable: true, length: 255 })
  addressLine2?: string;

  @Column({ length: 100 })
  city: string;

  @Column({ length: 100 })
  state: string;

  @Column({ length: 20 })
  pincode: string;

  @Column({ type: 'double precision', nullable: true })
  latitude?: number;

  @Column({ type: 'double precision', nullable: true })
  longitude?: number;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;

  @ManyToOne(() => User, (user) => user.addresses, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @OneToMany(() => Booking, (booking) => booking.address)
  bookings: Booking[];
}
