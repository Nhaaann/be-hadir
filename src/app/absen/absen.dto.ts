import { PartialType } from '@nestjs/mapped-types';
import {
  IsNotEmpty,
  IsString,
  IsDate,
  IsNumber,
  IsObject,
  IsOptional,
  IsInt,
  IsArray,
} from 'class-validator';

export class CreateAbsenGuruDto {
  @IsInt()
  readonly jam_detail: number;

  @IsOptional()
  latitude: number;

  @IsOptional()
  longitude: number;
}

export class CreateAbsenSiswaDto {
  @IsString()
  readonly kode_class: string;

  @IsOptional()
  latitude: number;

  @IsOptional()
  longitude: number;
}

export class CreateEnterClassGuruDto {
  @IsNotEmpty()
  @IsInt()
  readonly jam_detail: number;
}

export class FilterAbsenDto {
  @IsString()
  readonly mapel: string;

  @IsString()
  readonly kelas: string;
}

export class CreateJurnalKegiatanDto {
  @IsOptional()
  @IsString()
  readonly matapelajaran: string;

  @IsOptional()
  @IsString()
  readonly jam_pelajaran: string;

  @IsNotEmpty()
  @IsString()
  readonly materi: string;

  @IsOptional()
  @IsString()
  readonly kendala?: string;
}
// export class UpdateAbsenDto extends PartialType(CreateAbsenDto) {}
