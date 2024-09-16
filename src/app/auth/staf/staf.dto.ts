// src/app/auth/auth.dto/staf.dto.ts
import { Type } from 'class-transformer';
import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsArray,
  ValidateNested,
  IsNumber,
  IsEmail,
} from 'class-validator';

export class RegisterStafDto {
  @IsNotEmpty()
  @IsString()
  nama: string; // Nama user staf

  @IsNotEmpty()
  @IsEmail()
  email: string; // Email user staf

  @IsNotEmpty()
  @IsString()
  alamat: string; // Email user staf

  @IsNotEmpty()
  @IsString()
  password: string; // Password user staf

  @IsOptional()
  @IsNumber()
  userId?: number; // Opsional, referensi ke user ID jika sudah ada user yang terkait
}

export class RegisterBulkStafDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RegisterStafDto)
  data: RegisterStafDto[];
}

export class DeleteBulkStafDto {
  @IsArray()
  @IsNotEmpty({ each: true })
  data: number[]; // Daftar ID staf yang akan dihapus
}

export class UpdateStafDto {
  // Field opsional untuk memperbarui jurnal kegiatan staf
  @IsOptional()
  @IsNumber()
  userId?: number; // Field opsional untuk memperbarui referensi user
}
