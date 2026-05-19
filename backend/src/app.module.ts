import { EmailModule } from './common/services/email/email.module';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { getTypeOrmConfig } from './config/typeorm.config';
import { CatalogModule } from './catalog/catalog.module';
import { BookingModule } from './booking/booking.module';
import { RolesGuard } from './common/guards/roles.guard';
import { UploadModule } from './upload/upload.module';
import { AdminModule } from './admin/admin.module';
import { AppController } from './app.controller';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppService } from './app.service';
import { APP_GUARD } from '@nestjs/core';
import { Module } from '@nestjs/common';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: getTypeOrmConfig,
    }),
    CatalogModule,
    BookingModule,
    UploadModule,
    AdminModule,
    EmailModule,
    AuthModule,
    UserModule,
  ],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
  controllers: [AppController],
})
export class AppModule {}
