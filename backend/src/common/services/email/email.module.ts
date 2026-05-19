import { EmailService } from './email.services';
import { Global, Module } from '@nestjs/common';

@Global()
@Module({
  providers: [EmailService],
  exports: [EmailService],
})
export class EmailModule {}
