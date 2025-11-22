import { CatalogController } from './catalog.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { CatalogService } from './catalog.service';
import { Module } from '@nestjs/common';

@Module({
  imports: [PrismaModule],
  controllers: [CatalogController],
  providers: [CatalogService],
  exports: [CatalogService],
})
export class CatalogModule {}
