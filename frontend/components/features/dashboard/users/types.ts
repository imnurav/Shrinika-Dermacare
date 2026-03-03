import { UserGender, UserRole } from '@/lib/types';

export type UserFormData = {
  name: string;
  phone: string;
  imageUrl: string;
  role: UserRole;
  gender: UserGender;
};

