import { BookingService as BookingServiceEntity } from '../booking/entities/booking-service.entity';
import { Booking, BookingStatus } from '../booking/entities/booking.entity';
import { Category } from '../catalog/entities/category.entity';
import { Service } from '../catalog/entities/service.entity';
import { User, UserRole } from '../user/entities/user.entity';
import { Address } from '../user/entities/address.entity';
import dataSource from '../config/typeorm.datasource';
import * as bcrypt from 'bcrypt';

type SeedService = {
  title: string;
  description: string;
  duration: number;
  price: number;
};

type AddressSeedPayload = {
  label: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  pincode: string;
  latitude?: number;
  longitude?: number;
};

const readNumberEnv = (key: string, fallback: number): number => {
  const raw = process.env[key];
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : fallback;
};

const catalogSeed: Array<{
  name: string;
  description: string;
  services: SeedService[];
}> = [
  {
    name: 'Skin Treatments',
    description: 'Clinical skin care for acne, pigmentation, glow, and texture.',
    services: [
      {
        title: 'Acne Control Facial',
        description:
          'Deep cleanse with anti-acne protocol to reduce active breakouts and oiliness.',
        duration: 60,
        price: 1499,
      },
      {
        title: 'Pigmentation Correction Therapy',
        description: 'Targeted treatment plan for uneven tone, tanning, and dark patches.',
        duration: 75,
        price: 2299,
      },
      {
        title: 'Hydra Glow Facial',
        description: 'Hydration-focused facial for instant brightness and smooth texture.',
        duration: 60,
        price: 1999,
      },
      {
        title: 'Medi-Peel Session',
        description: 'Supervised peel for dull skin, marks, and texture refinement.',
        duration: 45,
        price: 2599,
      },
    ],
  },
  {
    name: 'Hair & Scalp Care',
    description: 'Dermatology-supported hair and scalp wellness treatments.',
    services: [
      {
        title: 'Anti Hair-Fall Scalp Therapy',
        description: 'Scalp protocol to reduce shedding and strengthen roots.',
        duration: 60,
        price: 2199,
      },
      {
        title: 'Dandruff Relief Treatment',
        description: 'Calming anti-flake and anti-itch scalp treatment.',
        duration: 45,
        price: 1299,
      },
      {
        title: 'Hair Nourish Spa',
        description: 'Protein-rich hair therapy for dryness, frizz, and damaged strands.',
        duration: 60,
        price: 1599,
      },
      {
        title: 'Scalp Detox Session',
        description: 'Detox treatment to remove buildup and rebalance scalp health.',
        duration: 45,
        price: 1399,
      },
    ],
  },
  {
    name: 'Laser & Advanced Aesthetics',
    description: 'Device-based clinical procedures for precision skin and hair outcomes.',
    services: [
      {
        title: 'Laser Hair Reduction (Small Area)',
        description: 'Session for upper lip, chin, or sideburn area.',
        duration: 30,
        price: 1799,
      },
      {
        title: 'Laser Hair Reduction (Full Face)',
        description: 'Complete full-face laser hair reduction session.',
        duration: 45,
        price: 3499,
      },
      {
        title: 'Skin Rejuvenation Laser',
        description: 'Laser protocol for improving texture, pores, and fine lines.',
        duration: 60,
        price: 4299,
      },
      {
        title: 'Carbon Laser Peel',
        description: 'Quick laser peel for oil control, glow, and pore care.',
        duration: 40,
        price: 2999,
      },
    ],
  },
  {
    name: 'Bridal & Occasion Packages',
    description: 'Pre-event skin and beauty packages for long-lasting camera-ready results.',
    services: [
      {
        title: 'Bridal Skin Prep (1 Month)',
        description: '4-session package combining glow, hydration, and pigmentation care.',
        duration: 90,
        price: 12999,
      },
      {
        title: 'Party Glow Express',
        description: 'Fast-track treatment for smooth and radiant skin before events.',
        duration: 45,
        price: 1699,
      },
      {
        title: 'Groom Prep Package',
        description: 'Structured pre-event care plan for men.',
        duration: 60,
        price: 4999,
      },
    ],
  },
];

async function upsertUser(params: {
  name: string;
  email?: string;
  phone?: string;
  passwordHash: string;
  role: UserRole;
  imageUrl?: string;
}): Promise<User> {
  const userRepo = dataSource.getRepository(User);
  const existing = params.email
    ? await userRepo.findOne({ where: { email: params.email } })
    : params.phone
      ? await userRepo.findOne({ where: { phone: params.phone } })
      : null;

  if (existing) {
    existing.name = params.name;
    existing.password = params.passwordHash;
    existing.role = params.role;
    existing.imageUrl = params.imageUrl;
    existing.phone = params.phone ?? existing.phone;
    existing.email = params.email ?? existing.email;
    return userRepo.save(existing);
  }

  return userRepo.save(
    userRepo.create({
      name: params.name,
      email: params.email,
      phone: params.phone,
      password: params.passwordHash,
      role: params.role,
      imageUrl: params.imageUrl,
    }),
  );
}

async function upsertAddress(userId: string, payload: AddressSeedPayload) {
  const repo = dataSource.getRepository(Address);
  const existing = await repo.findOne({
    where: {
      userId,
      label: payload.label,
      addressLine1: payload.addressLine1,
      pincode: payload.pincode,
    },
  });

  if (existing) {
    Object.assign(existing, payload);
    return repo.save(existing);
  }

  return repo.save(
    repo.create({
      ...payload,
      userId,
    }),
  );
}

async function seedCatalog() {
  const categoryRepo = dataSource.getRepository(Category);
  const serviceRepo = dataSource.getRepository(Service);
  const seededServiceMap = new Map<string, Service>();

  for (const categorySeed of catalogSeed) {
    let category = await categoryRepo.findOne({ where: { name: categorySeed.name } });
    if (!category) {
      category = await categoryRepo.save(
        categoryRepo.create({
          name: categorySeed.name,
          description: categorySeed.description,
          isActive: true,
        }),
      );
    } else {
      category.description = categorySeed.description;
      category.isActive = true;
      category = await categoryRepo.save(category);
    }

    for (const serviceSeed of categorySeed.services) {
      let service = await serviceRepo.findOne({
        where: { categoryId: category.id, title: serviceSeed.title },
      });

      if (!service) {
        service = serviceRepo.create({
          categoryId: category.id,
          title: serviceSeed.title,
          description: serviceSeed.description,
          duration: serviceSeed.duration,
          price: serviceSeed.price,
          isActive: true,
        });
      } else {
        service.description = serviceSeed.description;
        service.duration = serviceSeed.duration;
        service.price = serviceSeed.price;
        service.isActive = true;
      }

      const saved = await serviceRepo.save(service);
      seededServiceMap.set(saved.title, saved);
    }
  }

  return seededServiceMap;
}

async function seedExtraCatalog() {
  const categoryRepo = dataSource.getRepository(Category);
  const serviceRepo = dataSource.getRepository(Service);

  const categoryCount = readNumberEnv('SEED_EXTRA_CATEGORIES', 18);
  const servicesPerCategory = readNumberEnv('SEED_SERVICES_PER_CATEGORY', 4);

  for (let i = 1; i <= categoryCount; i += 1) {
    const categoryName = `Dermacare Collection ${String(i).padStart(2, '0')}`;
    let category = await categoryRepo.findOne({ where: { name: categoryName } });

    if (!category) {
      category = await categoryRepo.save(
        categoryRepo.create({
          name: categoryName,
          description: `Specialized treatment package ${i} for testing catalog pagination.`,
          isActive: true,
        }),
      );
    } else if (!category.isActive) {
      category.isActive = true;
      await categoryRepo.save(category);
    }

    for (let j = 1; j <= servicesPerCategory; j += 1) {
      const serviceTitle = `Dermacare ${String(i).padStart(2, '0')}-${String(j).padStart(2, '0')}`;
      const existingService = await serviceRepo.findOne({
        where: { categoryId: category.id, title: serviceTitle },
      });

      if (!existingService) {
        await serviceRepo.save(
          serviceRepo.create({
            categoryId: category.id,
            title: serviceTitle,
            description: `Clinical service ${j} under ${categoryName}.`,
            duration: 30 + ((i + j) % 4) * 15,
            price: 999 + i * 120 + j * 80,
            isActive: true,
          }),
        );
      }
    }
  }
}

async function createBookingWithServices(params: {
  userId: string;
  addressId: string;
  personName: string;
  personPhone: string;
  preferredDate: string;
  preferredTime: string;
  notes?: string;
  status: BookingStatus;
  serviceIds: string[];
}) {
  const bookingRepo = dataSource.getRepository(Booking);
  const bookingServiceRepo = dataSource.getRepository(BookingServiceEntity);

  const existing = await bookingRepo.findOne({
    where: {
      userId: params.userId,
      addressId: params.addressId,
      personName: params.personName,
      preferredDate: new Date(params.preferredDate),
      preferredTime: params.preferredTime,
    },
  });

  let booking = existing;
  if (!booking) {
    booking = await bookingRepo.save(
      bookingRepo.create({
        userId: params.userId,
        addressId: params.addressId,
        personName: params.personName,
        personPhone: params.personPhone,
        preferredDate: new Date(params.preferredDate),
        preferredTime: params.preferredTime,
        notes: params.notes,
        status: params.status,
      }),
    );
  } else {
    booking.status = params.status;
    booking.notes = params.notes;
    booking.personPhone = params.personPhone;
    booking = await bookingRepo.save(booking);
  }

  await bookingServiceRepo.delete({ bookingId: booking.id });
  const rows = params.serviceIds.map((serviceId) =>
    bookingServiceRepo.create({
      bookingId: booking!.id,
      serviceId,
    }),
  );
  if (rows.length > 0) {
    await bookingServiceRepo.save(rows);
  }
}

async function seedBulkUsersAndBookings(params: {
  customerPasswordHash: string;
  serviceIds: string[];
}) {
  const userCount = readNumberEnv('SEED_BULK_USERS', 45);
  const bookingsPerUser = readNumberEnv('SEED_BOOKINGS_PER_USER', 3);

  const cities = [
    { city: 'Delhi', state: 'Delhi' },
    { city: 'Mumbai', state: 'Maharashtra' },
    { city: 'Pune', state: 'Maharashtra' },
    { city: 'Bengaluru', state: 'Karnataka' },
    { city: 'Hyderabad', state: 'Telangana' },
    { city: 'Ahmedabad', state: 'Gujarat' },
    { city: 'Jaipur', state: 'Rajasthan' },
    { city: 'Lucknow', state: 'Uttar Pradesh' },
  ];

  const statuses = [
    BookingStatus.PENDING,
    BookingStatus.CONFIRMED,
    BookingStatus.COMPLETED,
    BookingStatus.CANCELLED,
  ] as const;
  const slots = ['09:30:00', '11:00:00', '13:30:00', '16:00:00', '18:15:00'];

  for (let i = 1; i <= userCount; i += 1) {
    const serial = String(i).padStart(3, '0');
    const profile = cities[(i - 1) % cities.length];
    const user = await upsertUser({
      name: `Pagination User ${serial}`,
      email: `pagination.user.${serial}@example.com`,
      phone: `90010${String(10000 + i).slice(-5)}`,
      passwordHash: params.customerPasswordHash,
      role: UserRole.USER,
    });

    const homeAddress = await upsertAddress(user.id, {
      label: 'Home',
      addressLine1: `Flat ${100 + i}, Tower ${((i - 1) % 12) + 1}, Green Residency`,
      addressLine2: 'Near Central Park',
      city: profile.city,
      state: profile.state,
      pincode: `${400000 + i}`,
      latitude: 19 + (i % 10) * 0.01,
      longitude: 72 + (i % 10) * 0.01,
    });

    for (let b = 0; b < bookingsPerUser; b += 1) {
      const dayOffset = i * bookingsPerUser + b;
      const bookingDate = new Date(Date.UTC(2026, 2, 1 + dayOffset));
      const preferredDate = bookingDate.toISOString().slice(0, 10);
      const preferredTime = slots[(i + b) % slots.length];
      const status = statuses[(i + b) % statuses.length];

      const firstService = params.serviceIds[(i + b) % params.serviceIds.length];
      const secondService = params.serviceIds[(i + b + 7) % params.serviceIds.length];
      const serviceIds = b % 2 === 0 ? [firstService] : [firstService, secondService];

      await createBookingWithServices({
        userId: user.id,
        addressId: homeAddress.id,
        personName: user.name,
        personPhone: user.phone || '',
        preferredDate,
        preferredTime,
        notes: `Bulk seeded booking ${serial}-${b + 1} for pagination checks.`,
        status,
        serviceIds,
      });
    }
  }
}

async function main() {
  await dataSource.initialize();

  const adminPasswordHash = await bcrypt.hash('Varun@0402', 10);
  const superAdminPasswordHash = await bcrypt.hash('SuperAdmin@0402', 10);
  const customerPasswordHash = await bcrypt.hash('Customer@123', 10);

  const admin = await upsertUser({
    name: 'Varun Admin',
    email: 'varun0402@gmail.com',
    phone: '9876540402',
    passwordHash: adminPasswordHash,
    role: UserRole.ADMIN,
  });

  const superAdmin = await upsertUser({
    name: 'Platform Super Admin',
    email: 'superadmin@shrinikadermacare.com',
    phone: '9876500000',
    passwordHash: superAdminPasswordHash,
    role: UserRole.SUPERADMIN,
  });

  const riya = await upsertUser({
    name: 'Riya Sharma',
    email: 'riya.sharma@example.com',
    phone: '9876501001',
    passwordHash: customerPasswordHash,
    role: UserRole.USER,
  });
  const neha = await upsertUser({
    name: 'Neha Patel',
    email: 'neha.patel@example.com',
    phone: '9876501002',
    passwordHash: customerPasswordHash,
    role: UserRole.USER,
  });
  const ananya = await upsertUser({
    name: 'Ananya Gupta',
    email: 'ananya.gupta@example.com',
    phone: '9876501003',
    passwordHash: customerPasswordHash,
    role: UserRole.USER,
  });
  const servicesMap = await seedCatalog();
  await seedExtraCatalog();

  const allServices = await dataSource.getRepository(Service).find({
    where: { isActive: true },
    select: { id: true },
  });
  const allServiceIds = allServices.map((service) => service.id);

  const riyaAddress = await upsertAddress(riya.id, {
    label: 'Home',
    addressLine1: 'A-1204, Palm Residency',
    addressLine2: 'Near Sector 62 Market',
    city: 'Noida',
    state: 'Uttar Pradesh',
    pincode: '201301',
    latitude: 28.6202,
    longitude: 77.3639,
  });

  const nehaAddress = await upsertAddress(neha.id, {
    label: 'Office',
    addressLine1: '604, Sapphire Business Park',
    addressLine2: 'Viman Nagar',
    city: 'Pune',
    state: 'Maharashtra',
    pincode: '411014',
    latitude: 18.5679,
    longitude: 73.9143,
  });

  const ananyaAddress = await upsertAddress(ananya.id, {
    label: 'Home',
    addressLine1: '22, Lake View Apartments',
    addressLine2: 'Salt Lake Sector 2',
    city: 'Kolkata',
    state: 'West Bengal',
    pincode: '700091',
    latitude: 22.5841,
    longitude: 88.4187,
  });

  await createBookingWithServices({
    userId: riya.id,
    addressId: riyaAddress.id,
    personName: riya.name,
    personPhone: riya.phone!,
    preferredDate: '2026-03-06',
    preferredTime: '11:00:00',
    notes: 'Concern: recurring acne and marks.',
    status: BookingStatus.CONFIRMED,
    serviceIds: [
      servicesMap.get('Acne Control Facial')!.id,
      servicesMap.get('Medi-Peel Session')!.id,
    ],
  });

  await createBookingWithServices({
    userId: neha.id,
    addressId: nehaAddress.id,
    personName: neha.name,
    personPhone: neha.phone!,
    preferredDate: '2026-03-08',
    preferredTime: '16:30:00',
    notes: 'Pre-event glow treatment required.',
    status: BookingStatus.PENDING,
    serviceIds: [servicesMap.get('Hydra Glow Facial')!.id],
  });

  await createBookingWithServices({
    userId: ananya.id,
    addressId: ananyaAddress.id,
    personName: ananya.name,
    personPhone: ananya.phone!,
    preferredDate: '2026-03-10',
    preferredTime: '10:00:00',
    notes: 'Hair fall and scalp irritation.',
    status: BookingStatus.PENDING,
    serviceIds: [
      servicesMap.get('Anti Hair-Fall Scalp Therapy')!.id,
      servicesMap.get('Scalp Detox Session')!.id,
    ],
  });

  await seedBulkUsersAndBookings({
    customerPasswordHash,
    serviceIds: allServiceIds,
  });

  const [categoryCount, serviceCount, userCount, bookingCount] = await Promise.all([
    dataSource.getRepository(Category).count(),
    dataSource.getRepository(Service).count(),
    dataSource.getRepository(User).count(),
    dataSource.getRepository(Booking).count(),
  ]);

  console.log('Seed complete');
  console.log(`Admin user: ${admin.email}`);
  console.log('Admin password: Varun@0402');
  console.log(`Superadmin user: ${superAdmin.email}`);
  console.log('Superadmin password: SuperAdmin@0402');
  console.log(
    `Totals -> categories: ${categoryCount}, services: ${serviceCount}, users: ${userCount}, bookings: ${bookingCount}`,
  );
}

main()
  .catch((error) => {
    console.error('Seed failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    if (dataSource.isInitialized) {
      await dataSource.destroy();
    }
  });
