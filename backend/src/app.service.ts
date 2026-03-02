import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  constructor() {}
  getRootRoute() {
    return {
      message: 'Everything is working fine!',
      status: 200,
      date: new Date(),
    };
  }
  getRootRouteHealth() {
    return {
      message: 'Api health is fine !',
      status: 200,
      date: new Date(),
    };
  }
}
