import { Booking } from '../../booking/entities/booking.entity';
import { Address } from './address.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';

export enum UserRole {
  USER = 'USER',
  ADMIN = 'ADMIN',
  SUPERADMIN = 'SUPERADMIN',
}

@Entity({ name: 'users' })
// @Index('idx_users_created_at', ['createdAt'])
// @Check('chk_users_contact_present', '"email" IS NOT NULL OR "phone" IS NOT NULL')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 120 })
  name: string;

  @Column({ unique: true, nullable: true, length: 320 })
  email?: string;

  @Column({ unique: true, nullable: true, length: 20 })
  phone?: string;

  @Column({ length: 255 })
  password: string;

  @Column({ nullable: true, length: 1024 })
  imageUrl?: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.USER,
  })
  role: UserRole;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;

  @OneToMany(() => Address, (address) => address.user)
  addresses: Address[];

  @OneToMany(() => Booking, (booking) => booking.user)
  bookings: Booking[];
}
