// src/app/kelas/create-kelas.dto.ts
import { IsArray, IsEnum, IsNotEmpty, IsObject, IsOptional, IsString, MaxLength, ValidateNested } from 'class-validator';
import { KelasEnum } from '../auth/roles.enum';
import { Type } from 'class-transformer';

export class CreateKelasDto {
  @IsNotEmpty()
  @IsString()
  nama_kelas: string;

  @IsObject()
  @IsOptional()
  created_by: { id: number };
}

export class UpdateKelasDto {
  @IsNotEmpty()
  @IsString()
  nama_kelas: string;

  @IsObject()
  @IsOptional()
  updated_by: { id: number };
}

export class BulkCreateKelasDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateKelasDto)
  @IsNotEmpty()
  data: CreateKelasDto[];
}
