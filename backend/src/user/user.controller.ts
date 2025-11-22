import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ErrorResponseDto } from '../common/dto/error-response.dto';
import { AddressResponseDto } from './dto/address-response.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { CreateAddressDto } from './dto/create-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';
import { UserService } from './user.service';
import {
  Controller,
  HttpStatus,
  HttpCode,
  Delete,
  Param,
  Post,
  Body,
  Get,
  Put,
} from '@nestjs/common';

@ApiTags('User')
@ApiBearerAuth('JWT-auth')
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('profile')
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, description: 'Profile retrieved successfully' })
  async getProfile(@CurrentUser() user: any) {
    return this.userService.getProfile(user.id);
  }

  @Put('profile')
  @ApiOperation({ summary: 'Update current user profile' })
  @ApiResponse({ status: 200, description: 'Profile updated successfully' })
  @ApiResponse({
    status: 403,
    description: 'Email or phone already in use',
    type: ErrorResponseDto,
  })
  async updateProfile(@CurrentUser() user: any, @Body() updateProfileDto: UpdateProfileDto) {
    return this.userService.updateProfile(user.id, updateProfileDto);
  }

  @Get('addresses')
  @ApiOperation({ summary: 'Get all addresses of current user' })
  @ApiResponse({
    status: 200,
    description: 'Addresses retrieved successfully',
    type: [AddressResponseDto],
  })
  async getAddresses(@CurrentUser() user: any): Promise<AddressResponseDto[]> {
    return this.userService.getAddresses(user.id);
  }

  @Post('addresses')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new address' })
  @ApiResponse({
    status: 201,
    description: 'Address created successfully',
    type: AddressResponseDto,
  })
  async createAddress(
    @CurrentUser() user: any,
    @Body() createAddressDto: CreateAddressDto,
  ): Promise<AddressResponseDto> {
    return this.userService.createAddress(user.id, createAddressDto);
  }

  @Put('addresses/:id')
  @ApiOperation({ summary: 'Update an address' })
  @ApiResponse({
    status: 200,
    description: 'Address updated successfully',
    type: AddressResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Address not found', type: ErrorResponseDto })
  @ApiResponse({ status: 403, description: 'Permission denied', type: ErrorResponseDto })
  async updateAddress(
    @CurrentUser() user: any,
    @Param('id') addressId: string,
    @Body() updateAddressDto: UpdateAddressDto,
  ): Promise<AddressResponseDto> {
    return this.userService.updateAddress(user.id, addressId, updateAddressDto);
  }

  @Delete('addresses/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete an address' })
  @ApiResponse({ status: 204, description: 'Address deleted successfully' })
  @ApiResponse({ status: 404, description: 'Address not found', type: ErrorResponseDto })
  @ApiResponse({ status: 403, description: 'Permission denied', type: ErrorResponseDto })
  async deleteAddress(@CurrentUser() user: any, @Param('id') addressId: string): Promise<void> {
    return this.userService.deleteAddress(user.id, addressId);
  }
}
