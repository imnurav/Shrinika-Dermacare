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

  // Create superadmin user
  const superPassword = await bcrypt.hash('superadmin123', 10);
  const superAdmin = await prisma.user.upsert({
    where: { email: 'superadmin@example.com' },
    update: {},
    create: {
      name: 'Super Admin',
      email: 'superadmin@example.com',
      phone: '+1987654321',
      password: superPassword,
      role: 'SUPERADMIN',
    },
  });
  console.log('Superadmin user created:', superAdmin.email);

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
  console.log('Service created:', service.title);

  // Ensure we have at least 20 categories
  const categories: any[] = [];
  // Keep existing 'Hair Care' as one category
  const hairCare = await prisma.category.upsert({
    where: { name: 'Hair Care' },
    update: {},
    create: {
      name: 'Hair Care',
      description: 'Professional hair care services',
      isActive: true,
    },
  });
  categories.push(hairCare);

  for (let i = 1; i <= 20; i++) {
    const name = `Category ${i}`;
    // skip if it's the same as Hair Care
    if (name === 'Hair Care') continue;
    const cat = await prisma.category.upsert({
      where: { name },
      update: {},
      create: {
        name,
        description: `${name} description`,
        isActive: true,
      },
    });
    categories.push(cat);
  }

  console.log(`Ensured ${categories.length} categories`);

  // Ensure we have at least 20 services distributed across categories
  const servicesList: any[] = [];
  const existingServices = await prisma.service.findMany({ where: {}, take: 1 });
  if (existingServices.length === 0) {
    // create the primary example service if missing
    const s0 = await prisma.service.create({
      data: {
        categoryId: categories[0].id,
        title: 'Haircut & Styling',
        description: 'Professional haircut with styling',
        duration: 60,
        price: 500.0,
        isActive: true,
      },
    });
    servicesList.push(s0);
  }
  // create additional services up to 20
  for (let i = 1; i <= 20; i++) {
    const title = `Service ${i}`;
    const cat = categories[i % categories.length];
    let s = await prisma.service.findFirst({ where: { title, categoryId: cat.id } });
    if (!s) {
      s = await prisma.service.create({
        data: {
          categoryId: cat.id,
          title,
          description: `${title} description`,
          duration: 30 + (i % 4) * 15,
          price: 100 + i * 10,
          isActive: true,
        },
      });
    }
    servicesList.push(s);
  }

  console.log(`Ensured ${servicesList.length} services`);

  // Ensure we have at least 20 users (including admin and superadmin)
  const users: any[] = [];
  users.push(admin, superAdmin);

  // Ensure test user exists
  const userPassword = await bcrypt.hash('user123', 10);
  const testUser = await prisma.user.upsert({
    where: { email: 'user@example.com' },
    update: {},
    create: {
      name: 'Test User',
      email: 'user@example.com',
      phone: '+15550001111',
      password: userPassword,
      role: 'USER',
    },
  });
  users.push(testUser);

  // create additional users until we have 20
  for (let i = 1; users.length < 20; i++) {
    const email = `user${i}@example.com`;
    const u = await prisma.user.upsert({
      where: { email },
      update: {},
      create: {
        name: `User ${i}`,
        email,
        phone: `+1555000${100 + i}`,
        password: await bcrypt.hash('password', 10),
        role: 'USER',
      },
    });
    users.push(u);
  }

  console.log(`Ensured ${users.length} users`);

  // Ensure an address exists for each user
  const addresses: any[] = [];
  for (const u of users) {
    let addr = await prisma.address.findFirst({ where: { userId: u.id } });
    if (!addr) {
      addr = await prisma.address.create({
        data: {
          userId: u.id,
          label: 'Home',
          addressLine1: `${u.name} Address 1`,
          addressLine2: '',
          city: 'Testville',
          state: 'TS',
          pincode: '000000',
        },
      });
    }
    addresses.push(addr);
  }

  console.log(`Ensured ${addresses.length} addresses`);

  // Create 20 bookings across users and services
  const bookingsToCreate = 20;
  const nowDate = new Date();
  for (let i = 0; i < bookingsToCreate; i++) {
    const u = users[i % users.length];
    const addr = addresses[i % addresses.length];
    // pick 1-3 services for this booking
    const take = 1 + (i % 3);
    const start = i % servicesList.length;
    const end = start + take;
    const chosenServices = servicesList.slice(start, end);
    // ensure we have service ids (wrap around)
    let serviceIds: string[] = [];
    if (chosenServices.length) {
      serviceIds = chosenServices.map((s) => s.id);
    } else {
      serviceIds = [servicesList[0].id];
    }
    const bookingDate = new Date(nowDate.getTime() + (i + 1) * 24 * 60 * 60 * 1000);
    const booking = await prisma.booking.create({
      data: {
        userId: u.id,
        addressId: addr.id,
        personName: u.name,
        personPhone: u.phone || '',
        preferredDate: bookingDate,
        preferredTime: `${9 + (i % 8)}:00 AM`,
        notes: `Auto seed booking ${i + 1}`,
        bookingServices: {
          create: serviceIds.map((sid) => ({ serviceId: sid })),
        },
      },
    });
    console.log(`Created booking ${booking.id} for user ${u.email}`);
  }

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
