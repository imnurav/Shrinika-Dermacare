import { ApiProperty } from '@nestjs/swagger';

export class DashboardAnalyticsDto {
  @ApiProperty()
  totalBookings: number;

  @ApiProperty()
  pendingBookings: number;

  @ApiProperty()
  confirmedBookings: number;

  @ApiProperty()
  completedBookings: number;

  @ApiProperty()
  cancelledBookings: number;

  @ApiProperty()
  totalCategories: number;

  @ApiProperty()
  totalServices: number;

  @ApiProperty()
  totalUsers: number;

  @ApiProperty({ type: () => [Object] })
  recentBookings: Array<{
    id: string;
    personName: string;
    status: string;
    preferredDate: Date;
    createdAt: Date;
  }>;
}
