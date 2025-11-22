import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { AddressResponseDto } from './dto/address-response.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { CreateAddressDto } from './dto/create-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        imageUrl: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async updateProfile(userId: string, updateProfileDto: UpdateProfileDto) {
    const updateData: any = {};

    if (updateProfileDto.name) {
      updateData.name = updateProfileDto.name;
    }

    if (updateProfileDto.email) {
      // Check if email is already taken by another user
      const existingUser = await this.prisma.user.findUnique({
        where: { email: updateProfileDto.email },
      });
      if (existingUser && existingUser.id !== userId) {
        throw new ForbiddenException('Email already in use');
      }
      updateData.email = updateProfileDto.email;
    }

    if (updateProfileDto.phone) {
      // Check if phone is already taken by another user
      const existingUser = await this.prisma.user.findUnique({
        where: { phone: updateProfileDto.phone },
      });
      if (existingUser && existingUser.id !== userId) {
        throw new ForbiddenException('Phone already in use');
      }
      updateData.phone = updateProfileDto.phone;
    }

    if (updateProfileDto.imageUrl !== undefined) {
      updateData.imageUrl = updateProfileDto.imageUrl;
    }

    const user = await this.prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        imageUrl: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return user;
  }

  async getAddresses(userId: string): Promise<AddressResponseDto[]> {
    const addresses = await this.prisma.address.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    return addresses;
  }

  async createAddress(
    userId: string,
    createAddressDto: CreateAddressDto,
  ): Promise<AddressResponseDto> {
    const address = await this.prisma.address.create({
      data: {
        ...createAddressDto,
        userId,
      },
    });

    return address;
  }

  async updateAddress(
    userId: string,
    addressId: string,
    updateAddressDto: UpdateAddressDto,
  ): Promise<AddressResponseDto> {
    // Verify address belongs to user
    const address = await this.prisma.address.findUnique({
      where: { id: addressId },
    });

    if (!address) {
      throw new NotFoundException('Address not found');
    }

    if (address.userId !== userId) {
      throw new ForbiddenException('You do not have permission to update this address');
    }

    const updatedAddress = await this.prisma.address.update({
      where: { id: addressId },
      data: updateAddressDto,
    });

    return updatedAddress;
  }

  async deleteAddress(userId: string, addressId: string): Promise<void> {
    // Verify address belongs to user
    const address = await this.prisma.address.findUnique({
      where: { id: addressId },
    });

    if (!address) {
      throw new NotFoundException('Address not found');
    }

    if (address.userId !== userId) {
      throw new ForbiddenException('You do not have permission to delete this address');
    }

    await this.prisma.address.delete({
      where: { id: addressId },
    });
  }
}
