import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      name: 'Admin User',
      email: 'admin@example.com',
      phone: '+1234567890',
      password: adminPassword,
      role: 'ADMIN',
    },
  });

  console.log('Admin user created:', admin.email);

  // Create sample category
  const category = await prisma.category.upsert({
    where: { name: 'Hair Care' },
    update: {},
    create: {
      name: 'Hair Care',
      description: 'Professional hair care services',
      isActive: true,
    },
  });

  console.log('Category created:', category.name);

  // Create sample service (check if exists first)
  const existingService = await prisma.service.findFirst({
    where: { title: 'Haircut & Styling', categoryId: category.id },
  });

  let service;
  if (existingService) {
    service = existingService;
  } else {
    service = await prisma.service.create({
      data: {
        categoryId: category.id,
        title: 'Haircut & Styling',
        description: 'Professional haircut with styling',
        duration: 60,
        price: 500.0,
        isActive: true,
      },
    });
  }

  console.log('Service created:', service.title);

  console.log('Seeding completed!');
  console.log('\nAdmin credentials:');
  console.log('Email: admin@example.com');
  console.log('Password: admin123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

