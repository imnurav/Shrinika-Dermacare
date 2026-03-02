import { Service } from './service.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';

@Entity({ name: 'categories' })
// @Index('idx_categories_active_name', ['isActive', 'name'])
export class Category {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true, length: 120 })
  name: string;

  @Column({ nullable: true, length: 500 })
  description?: string;

  @Column({ nullable: true, length: 1024 })
  imageUrl?: string;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;

  @OneToMany(() => Service, (service) => service.category)
  services: Service[];
}
