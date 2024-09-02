// src/app/jadwal/jadwal.dto.ts
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsString,
  IsInt,
  IsDateString,
  IsNumber,
  IsObject,
  IsOptional,
  ValidateNested,
  IsArray,
  IsNotEmpty,
  IsBoolean,
} from 'class-validator';
import { PageRequestDto } from '../../utils/dto/page.dto';
// import { HariEnum } from './jadwal.entity';

class JamDetailDto {
  @IsOptional()
  id?: number;

  @IsOptional()
  @IsNumber()
  kelas?: number;

  @IsNotEmpty()
  // @IsNumber()
  subject_code: any; 
}

class JamJadwalDto {
  @IsOptional()
  id?: number; 

  @IsNotEmpty()
  @IsString()
  jam_mulai: string;

  @IsNotEmpty()
  @IsString()
  jam_selesai: string;

  @IsOptional()
  @IsBoolean()
  is_rest: boolean;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => JamDetailDto)
  jam_detail: JamDetailDto[];
}

export class CreateJadwalDto {
  @IsNotEmpty()
  @IsInt()
  hari_id: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => JamJadwalDto)
  jam_jadwal: JamJadwalDto[];
}

export class UpdateJadwalDto {
  @IsNotEmpty()
  @IsInt()
  hari_id: number;
  
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => JamJadwalDto)
  @IsOptional()
  jam_jadwal?: JamJadwalDto[];

  @IsObject()
  @IsOptional()
  updated_by?: { id: number };
}

export class FindAllJadwalDTO extends PageRequestDto {
  @IsOptional()
  @IsString()
  hari: string;

  @IsOptional()
  @IsString()
  kelas: string;

  @IsOptional()
  @IsString()
  mapel: string;
}
