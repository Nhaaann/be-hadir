// src/app/auth/auth.dto/create-student.dto.ts
import { Type } from 'class-transformer';
import { IsNotEmpty, IsString, IsDateString, IsNumber, IsArray, ValidateNested, IsOptional } from 'class-validator';

export class RegisterSiswaDto {
  @IsNotEmpty()
  @IsString()
  nama: string;

  @IsNotEmpty()
  @IsString()
  email: string;

  @IsNotEmpty()
  @IsString()
  password: string;

  @IsNotEmpty()
  @IsNumber()
  kelas: number;

  @IsNotEmpty()
  @IsString()
  NISN: string;

  @IsNotEmpty()
  @IsDateString()
  tanggal_lahir: string;

  @IsNotEmpty()
  @IsString()
  alamat: string;
}

export class RegisterBulkSiswaDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RegisterSiswaDto)
  data: RegisterSiswaDto[];
}

export class DeleteBulkUserDto {
  @IsArray()
  @IsNotEmpty({ each: true })
  data: number[]; // Assuming you are deleting by user ID
}

export class UpdateSiswaDto {
  @IsOptional()
  @IsString()
  avatar?: string;

  @IsOptional()
  @IsString()
  nomor_hp?: string;

  @IsOptional()
  @IsString()
  alamat?: string;
}