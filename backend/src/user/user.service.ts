import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { AddressResponseDto } from './dto/address-response.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { CreateAddressDto } from './dto/create-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Address } from './entities/address.entity';
import { User } from './entities/user.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Address)
    private readonly addressRepository: Repository<Address>,
  ) {}

  async getProfile(userId: string) {
    const user = await this.userRepository.findOne({
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
    const updateData: Partial<User> = {};

    if (updateProfileDto.name) {
      updateData.name = updateProfileDto.name;
    }

    if (updateProfileDto.email) {
      // Check if email is already taken by another user
      const existingUser = await this.userRepository.findOne({
        where: { email: updateProfileDto.email },
      });
      if (existingUser && existingUser.id !== userId) {
        throw new ForbiddenException('Email already in use');
      }
      updateData.email = updateProfileDto.email;
    }

    if (updateProfileDto.phone) {
      // Check if phone is already taken by another user
      const existingUser = await this.userRepository.findOne({
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

    const existingUser = await this.userRepository.findOne({ where: { id: userId } });
    if (!existingUser) {
      throw new NotFoundException('User not found');
    }

    await this.userRepository.update({ id: userId }, updateData);

    return this.userRepository.findOne({
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
  }

  async changePassword(userId: string, changePasswordDto: ChangePasswordDto) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      select: { id: true, password: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const isCurrentPasswordValid = await bcrypt.compare(changePasswordDto.currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      throw new ForbiddenException('Current password is incorrect');
    }

    const hashed = await bcrypt.hash(changePasswordDto.newPassword, 10);
    await this.userRepository.update({ id: userId }, { password: hashed });

    return { success: true };
  }

  async getAddresses(userId: string): Promise<AddressResponseDto[]> {
    const addresses = await this.addressRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });

    return addresses;
  }

  async createAddress(
    userId: string,
    createAddressDto: CreateAddressDto,
  ): Promise<AddressResponseDto> {
    return this.addressRepository.save(
      this.addressRepository.create({
        ...createAddressDto,
        userId,
      }),
    );
  }

  async updateAddress(
    userId: string,
    addressId: string,
    updateAddressDto: UpdateAddressDto,
  ): Promise<AddressResponseDto> {
    // Verify address belongs to user
    const address = await this.addressRepository.findOne({ where: { id: addressId } });

    if (!address) {
      throw new NotFoundException('Address not found');
    }

    if (address.userId !== userId) {
      throw new ForbiddenException('You do not have permission to update this address');
    }

    await this.addressRepository.update({ id: addressId }, updateAddressDto);
    const updatedAddress = await this.addressRepository.findOne({ where: { id: addressId } });

    return updatedAddress as AddressResponseDto;
  }

  async deleteAddress(userId: string, addressId: string): Promise<void> {
    // Verify address belongs to user
    const address = await this.addressRepository.findOne({ where: { id: addressId } });

    if (!address) {
      throw new NotFoundException('Address not found');
    }

    if (address.userId !== userId) {
      throw new ForbiddenException('You do not have permission to delete this address');
    }

    await this.addressRepository.delete({ id: addressId });
  }
}
