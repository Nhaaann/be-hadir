// src/app/mapel/dto/create-mapel.dto.ts
import { IsString, IsNotEmpty, Length, IsOptional, IsObject, IsEnum } from 'class-validator';
import { StatusMapel } from '../auth/roles.enum';

export class CreateMapelDto {
  @IsString()
  @IsNotEmpty()
  nama_mapel: string;

  @IsEnum(StatusMapel)
  @IsNotEmpty()
  status_mapel: StatusMapel;
  
  @IsObject()
  @IsOptional()
  created_by: { id: number };
}

export class UpdateMapelDto {
  @IsString()
  @IsNotEmpty()
  nama_mapel: string;

  @IsEnum(StatusMapel)
  @IsNotEmpty()
  status_mapel: StatusMapel;
  
  @IsObject()
  @IsOptional()
  updated_by: { id: number };
}
