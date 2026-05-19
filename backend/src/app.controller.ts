import { EmailService } from './common/services/email/email.services';
import { Public } from './common/decorators/public.decorator';
import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Public()
@Controller()
export class AppController {
  constructor(
    private appService: AppService,
    private emailService: EmailService,
  ) {}

  @Get()
  getRootRoute() {
    return this.appService.getRootRoute();
  }
  @Get('send-email')
  async sendTestEmail() {
    return this.emailService.sendForgotPasswordEmail('nurav0402@gmail.com', 'test-token');
  }
  @Get('health')
  getRootRouteHealth() {
    return this.appService.getRootRouteHealth();
  }
}
