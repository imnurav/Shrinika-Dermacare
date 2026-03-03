import { Public } from './common/decorators/public.decorator';
import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Public()
@Controller()
export class AppController {
  constructor(private appService: AppService) {}

  @Get()
  getRootRoute() {
    return this.appService.getRootRoute();
  }

  @Get('health')
  getRootRouteHealth() {
    return this.appService.getRootRouteHealth();
  }
}
