import { PartialType, PickType } from '@nestjs/mapped-types';
import { ArrayMinSize, ArrayNotEmpty, IsArray, IsEmail, IsInt, IsOptional, IsString, Length, MinLength } from 'class-validator';
import { PageRequestDto } from '../../utils/dto/page.dto';
import { PrimaryGeneratedColumn } from 'typeorm';
import { Role } from './roles.enum';

export class UserDto {
  @PrimaryGeneratedColumn()
  id: number;

  @IsString()
  nama: string;

  @IsString()
  avatar: string;

  @IsString()
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsString()
  refresh_token: string;

  @IsString()
  role: string;
}

export class queryUSerDTO extends PageRequestDto {
  @IsOptional()
  @IsString()
  nama: string;

  @IsOptional()
  @IsString()
  role: string;
}

export class DeleteUSer extends PickType(UserDto, ['id']) {}

// auth.dto.ts
export class DeleteBulkUserDto {
  @IsArray()
  data: DeleteUSer[];
}


export class RegisterDto {
  @IsString()
  nama: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsString()
  role: Role;

  @IsOptional()
  @IsString()
  NIK: string;
}

export class LoginDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsOptional()
  @IsString()
  role: string;
}

export class ResetPasswordDto {
  @IsString()
  @MinLength(8)
  new_password: string;

  @IsString()
  @MinLength(8)
  confirm_password: string;
}
