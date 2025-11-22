# Shrinika Derma Backend API

Backend application for a home-service booking business. Built with NestJS, PostgreSQL, and Prisma.

## Features

- ✅ JWT-based authentication (registration & login)
- ✅ User profile management
- ✅ Multiple addresses per user with coordinates
- ✅ Catalog management (Categories & Services)
- ✅ Booking system with status lifecycle
- ✅ Admin dashboard APIs
- ✅ Role-based access control (USER, ADMIN)
- ✅ Swagger API documentation
- ✅ Pagination support
- ✅ Consistent error handling

## Tech Stack

- **Framework**: NestJS
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Authentication**: JWT (passport-jwt)
- **Password Hashing**: bcrypt
- **API Documentation**: Swagger/OpenAPI
- **Validation**: class-validator, class-transformer

## Prerequisites

- Node.js (v18 or higher)
- PostgreSQL (v12 or higher)
- npm or yarn

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd shrinika-derma
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and configure:
   ```env
   DATABASE_URL="postgresql://user:password@localhost:5432/shrinika_derma?schema=public"
   JWT_SECRET="your-super-secret-jwt-key-change-in-production"
   JWT_EXPIRES_IN="24h"
   PORT=3000
   NODE_ENV=development
   ```

4. **Set up the database**
   ```bash
   # Generate Prisma Client
   npm run prisma:generate
   
   # Run migrations
   npm run prisma:migrate
   ```

5. **Start the application**
   ```bash
   # Development mode
   npm run start:dev
   
   # Production mode
   npm run build
   npm run start:prod
   ```

The API will be available at `http://localhost:3000`
Swagger documentation: `http://localhost:3000/api/docs`

## Database Schema

### Models

- **User**: Users (customers and admins)
- **Address**: User addresses with coordinates
- **Category**: Service categories (e.g., Hair, Skin, Packages)
- **Service**: Services with price, duration, and category
- **Booking**: Bookings with status lifecycle
- **BookingService**: Many-to-many relationship between bookings and services

### Booking Status Lifecycle

```
PENDING → CONFIRMED → COMPLETED
         ↓
      CANCELLED
```

- Users can cancel bookings only when status is `PENDING`
- Admins can update booking status to any state

## API Endpoints

### Authentication (`/api/auth`)
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user

### User (`/api/user`)
- `GET /api/user/profile` - Get current user profile
- `PUT /api/user/profile` - Update profile
- `GET /api/user/addresses` - Get all addresses
- `POST /api/user/addresses` - Create address
- `PUT /api/user/addresses/:id` - Update address
- `DELETE /api/user/addresses/:id` - Delete address

### Catalog (`/api/catalog`)
- `GET /api/catalog/categories` - Get all categories (public)
- `GET /api/catalog/categories/:id` - Get category by ID (public)
- `POST /api/catalog/categories` - Create category (Admin only)
- `PUT /api/catalog/categories/:id` - Update category (Admin only)
- `DELETE /api/catalog/categories/:id` - Delete category (Admin only)
- `GET /api/catalog/services` - Get all services (public)
- `GET /api/catalog/services/:id` - Get service by ID (public)
- `POST /api/catalog/services` - Create service (Admin only)
- `PUT /api/catalog/services/:id` - Update service (Admin only)
- `DELETE /api/catalog/services/:id` - Delete service (Admin only)

### Bookings (`/api/bookings`)
- `POST /api/bookings` - Create booking
- `GET /api/bookings` - Get user bookings (with filters)
- `GET /api/bookings/:id` - Get booking by ID
- `PUT /api/bookings/:id/cancel` - Cancel booking (PENDING only)

### Admin (`/api/admin`)
- `GET /api/admin/bookings` - Get all bookings (with filters)
- `GET /api/admin/bookings/:id` - Get booking by ID
- `PUT /api/admin/bookings/:id/status` - Update booking status
- `GET /api/admin/users` - Get all users
- `GET /api/admin/users/:id` - Get user by ID

## Authentication

All protected endpoints require a JWT token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

### Creating an Admin User

To create an admin user, you can either:

1. **Using Prisma Studio**:
   ```bash
   npm run prisma:studio
   ```
   Create a user and set `role` to `ADMIN`

2. **Using a database seed script** (create `prisma/seed.ts`):
   ```typescript
   import { PrismaClient } from '@prisma/client';
   import * as bcrypt from 'bcrypt';

   const prisma = new PrismaClient();

   async function main() {
     const hashedPassword = await bcrypt.hash('admin123', 10);
     await prisma.user.create({
       data: {
         name: 'Admin User',
         email: 'admin@example.com',
         password: hashedPassword,
         role: 'ADMIN',
       },
     });
   }

   main()
     .catch(console.error)
     .finally(() => prisma.$disconnect());
   ```

## Testing

### Using Swagger UI

1. Start the application
2. Navigate to `http://localhost:3000/api/docs`
3. Use the "Authorize" button to add your JWT token
4. Test endpoints directly from the UI

### Using Postman

Import the `postman-collection.json` file into Postman. The collection includes:
- Pre-configured requests for all endpoints
- Environment variables for easy token management
- Example requests with sample data

## Project Structure

```
src/
├── auth/              # Authentication module
├── user/              # User management module
├── catalog/           # Categories and services
├── booking/           # Booking system
├── admin/             # Admin dashboard APIs
├── common/            # Shared utilities, guards, decorators
│   ├── decorators/    # Custom decorators
│   ├── guards/        # Auth and role guards
│   ├── dto/           # Shared DTOs
│   └── filters/       # Exception filters
└── prisma/            # Prisma service and module
```

## Future Enhancements

The database schema is designed to support future features:

- **Payments**: Service prices are stored, ready for Razorpay integration
- **Staff Allocation**: Can be added to Booking model
- **Wallet/Offers**: Can extend User model
- **Reviews & Ratings**: Can create new models
- **Push Notifications**: User tokens can be stored
- **Multi-branch**: Address coordinates support serviceability checks

## Deployment

### Environment Variables for Production

```env
DATABASE_URL="postgresql://user:password@host:5432/dbname?schema=public"
JWT_SECRET="strong-random-secret-key"
JWT_EXPIRES_IN="24h"
PORT=3000
NODE_ENV=production
```

### Build for Production

```bash
npm run build
npm run start:prod
```

### Docker Deployment (Optional)

Create a `Dockerfile`:

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "run", "start:prod"]
```

### Database Migrations in Production

```bash
# Generate migration
npx prisma migrate deploy

# Or use Prisma Migrate
npx prisma migrate deploy
```

## Troubleshooting

### Database Connection Issues
- Verify PostgreSQL is running
- Check DATABASE_URL in `.env`
- Ensure database exists

### JWT Token Issues
- Verify JWT_SECRET is set
- Check token expiration (default: 24h)
- Ensure token is sent in Authorization header

### Prisma Issues
- Run `npm run prisma:generate` after schema changes
- Run `npm run prisma:migrate` to apply migrations

## License

Private - All rights reserved

## Support

For issues or questions, please contact the development team.

