import { UserGender, UserRole } from '@/lib/types';

export type UserFormData = {
  name: string;
  email: string;
  phone: string;
  password: string;
  imageUrl: string;
  role: UserRole;
  gender: UserGender;
};
