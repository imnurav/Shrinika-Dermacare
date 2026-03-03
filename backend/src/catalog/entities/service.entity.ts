import { BookingService } from '../../booking/entities/booking-service.entity';
import { Category } from './category.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ValueTransformer,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';

const numericToNumberTransformer: ValueTransformer = {
  to: (value?: number | null) => value,
  from: (value: string | null) => (value === null ? null : Number(value)),
};

@Entity({ name: 'services' })
// @Check('chk_services_price_positive', '"price" > 0')
// @Check('chk_services_duration_positive', '"duration" > 0')
// @Check('chk_services_duration_reasonable', '"duration" <= 1440')
// @Index('idx_services_category_active_created', ['categoryId', 'isActive', 'createdAt'])
// @Index('idx_services_active_created', ['isActive', 'createdAt'])
export class Service {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  categoryId: string;

  @Column({ length: 150 })
  title: string;

  @Column({ nullable: true, length: 1000 })
  description?: string;

  @Column({ nullable: true, length: 1024 })
  imageUrl?: string;

  @Column()
  duration: number;

  @Column({
    type: 'numeric',
    precision: 10,
    scale: 2,
    transformer: numericToNumberTransformer,
  })
  price: number;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;

  @ManyToOne(() => Category, (category) => category.services, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'categoryId' })
  category: Category;

  @OneToMany(() => BookingService, (bookingService) => bookingService.service)
  bookingServices: BookingService[];
}
