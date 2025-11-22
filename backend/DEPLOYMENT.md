# Deployment Instructions

This document provides step-by-step instructions for deploying the Shrinika Derma backend application.

## Prerequisites

- Node.js v18 or higher
- PostgreSQL database (local or cloud)
- Environment variables configured

## Local Development Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Create a `.env` file in the root directory:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/shrinika_derma?schema=public"
JWT_SECRET="your-super-secret-jwt-key-change-in-production"
JWT_EXPIRES_IN="24h"
PORT=3000
NODE_ENV=development
```

### 3. Set Up Database

```bash
# Generate Prisma Client
npm run prisma:generate

# Create and run migrations
npm run prisma:migrate

# (Optional) Seed database with sample data
npm run prisma:seed
```

### 4. Start Development Server

```bash
npm run start:dev
```

The API will be available at `http://localhost:3000`
Swagger documentation: `http://localhost:3000/api/docs`

## Production Deployment

### Option 1: Traditional Server Deployment

#### 1. Build the Application

```bash
npm run build
```

#### 2. Set Production Environment Variables

```env
DATABASE_URL="postgresql://user:password@host:5432/dbname?schema=public"
JWT_SECRET="strong-random-secret-key-minimum-32-characters"
JWT_EXPIRES_IN="24h"
PORT=3000
NODE_ENV=production
```

#### 3. Run Database Migrations

```bash
npx prisma migrate deploy
```

#### 4. Start the Application

```bash
npm run start:prod
```

### Option 2: Docker Deployment

#### 1. Create Dockerfile

```dockerfile
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm ci

# Generate Prisma Client
RUN npx prisma generate

# Copy source code
COPY . .

# Build application
RUN npm run build

# Production stage
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install production dependencies only
RUN npm ci --only=production

# Generate Prisma Client
RUN npx prisma generate

# Copy built application
COPY --from=builder /app/dist ./dist

# Expose port
EXPOSE 3000

# Start application
CMD ["node", "dist/main"]
```

#### 2. Create docker-compose.yml (Optional)

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: shrinika_derma
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      DATABASE_URL: postgresql://postgres:postgres@postgres:5432/shrinika_derma?schema=public
      JWT_SECRET: your-super-secret-jwt-key
      JWT_EXPIRES_IN: 24h
      NODE_ENV: production
    depends_on:
      - postgres
    command: sh -c "npx prisma migrate deploy && node dist/main"

volumes:
  postgres_data:
```

#### 3. Build and Run

```bash
# Build Docker image
docker build -t shrinika-derma-backend .

# Run with docker-compose
docker-compose up -d

# Or run manually
docker run -p 3000:3000 \
  -e DATABASE_URL="postgresql://user:password@host:5432/dbname" \
  -e JWT_SECRET="your-secret" \
  shrinika-derma-backend
```

### Option 3: Cloud Platform Deployment

#### Heroku

1. **Create Heroku App**
   ```bash
   heroku create shrinika-derma-backend
   ```

2. **Add PostgreSQL Addon**
   ```bash
   heroku addons:create heroku-postgresql:hobby-dev
   ```

3. **Set Environment Variables**
   ```bash
   heroku config:set JWT_SECRET="your-secret-key"
   heroku config:set JWT_EXPIRES_IN="24h"
   heroku config:set NODE_ENV="production"
   ```

4. **Deploy**
   ```bash
   git push heroku main
   ```

5. **Run Migrations**
   ```bash
   heroku run npx prisma migrate deploy
   ```

#### Railway

1. Connect your GitHub repository to Railway
2. Add environment variables in Railway dashboard
3. Railway will automatically detect and deploy
4. Run migrations: `railway run npx prisma migrate deploy`

#### AWS (EC2/ECS)

1. **EC2 Deployment**
   - Launch EC2 instance
   - Install Node.js and PostgreSQL
   - Clone repository
   - Set up environment variables
   - Use PM2 or systemd to run the application

2. **ECS Deployment**
   - Create ECR repository
   - Build and push Docker image
   - Create ECS task definition
   - Deploy to ECS cluster

#### Google Cloud Platform

1. **Cloud Run**
   - Build and push container to GCR
   - Deploy to Cloud Run
   - Set environment variables
   - Connect to Cloud SQL for PostgreSQL

## Database Migration Strategy

### Development

```bash
# Create a new migration
npm run prisma:migrate

# Apply migrations
npx prisma migrate deploy
```

### Production

```bash
# Apply pending migrations (safe for production)
npx prisma migrate deploy

# Generate Prisma Client
npx prisma generate
```

## Environment Variables Reference

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `DATABASE_URL` | PostgreSQL connection string | Yes | - |
| `JWT_SECRET` | Secret key for JWT tokens | Yes | - |
| `JWT_EXPIRES_IN` | JWT token expiration time | No | `24h` |
| `PORT` | Server port | No | `3000` |
| `NODE_ENV` | Environment (development/production) | No | `development` |

## Security Checklist

- [ ] Use strong, random `JWT_SECRET` (minimum 32 characters)
- [ ] Use SSL/TLS for database connections in production
- [ ] Enable CORS only for trusted domains
- [ ] Use environment variables for all secrets
- [ ] Keep dependencies updated
- [ ] Use rate limiting (consider adding)
- [ ] Enable request logging
- [ ] Set up monitoring and alerts
- [ ] Regular database backups

## Monitoring and Logging

### Recommended Tools

- **Application Monitoring**: New Relic, Datadog, or Sentry
- **Logging**: Winston or Pino with log aggregation
- **Uptime Monitoring**: UptimeRobot, Pingdom
- **Database Monitoring**: pgAdmin, DataDog

### Health Check Endpoint

Consider adding a health check endpoint:

```typescript
@Get('health')
@Public()
health() {
  return { status: 'ok', timestamp: new Date() };
}
```

## Scaling Considerations

1. **Database**: Use connection pooling (Prisma handles this)
2. **Application**: Use PM2 cluster mode or container orchestration
3. **Caching**: Consider Redis for frequently accessed data
4. **Load Balancing**: Use nginx or cloud load balancer
5. **CDN**: For static assets (if any)

## Troubleshooting

### Database Connection Issues

```bash
# Test database connection
npx prisma db pull

# Check Prisma Client
npx prisma generate
```

### Application Won't Start

1. Check environment variables
2. Verify database is accessible
3. Check port availability
4. Review application logs

### Migration Issues

```bash
# Reset database (development only)
npx prisma migrate reset

# Check migration status
npx prisma migrate status
```

## Backup and Recovery

### Database Backups

```bash
# PostgreSQL backup
pg_dump -h hostname -U username -d database_name > backup.sql

# Restore
psql -h hostname -U username -d database_name < backup.sql
```

### Automated Backups

Set up cron job or use cloud provider backup services:
- AWS RDS automated backups
- Google Cloud SQL automated backups
- Heroku Postgres backups

## Support

For deployment issues, refer to:
- NestJS documentation: https://docs.nestjs.com
- Prisma documentation: https://www.prisma.io/docs
- Platform-specific documentation

