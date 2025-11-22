'use client';
import { authService } from '@/lib/services/auth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';


export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    const user = authService.getCurrentUser();
    const token = authService.getToken();

    if (token && user && user.role === 'ADMIN') {
      router.push('/dashboard');
    } else {
      router.push('/login');
    }
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}
