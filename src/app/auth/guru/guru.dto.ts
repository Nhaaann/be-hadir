import { IsNotEmpty, IsString, IsOptional, IsInt, IsNumber, IsArray, Max, Min, Length, ArrayNotEmpty } from 'class-validator';
export class RegisterGuruDto {
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
  @IsString()
  initial_schedule: string;

  @IsNotEmpty()
  mapel: any;
}

export class UpdateGuruDto {
  @IsOptional()
  @IsString()
  avatar?: string;

  @IsOptional()
  @IsString()
  nomor_hp?: string;

  @IsOptional()
  @IsString()
  nama?: string;

  @IsOptional()
  @IsArray()
  // @ArrayNotEmpty()
  @IsInt({ each: true })
  mapel?: number[];
}

export class DeleteBulkGuruDto {
  @IsArray()
  @IsNumber({}, { each: true })
  data: number[];
}

export class GuruProfileDto {
  id: number;
  nama: string;
  email: string;
  mapel: {
    id: number;
    nama_mapel: string; // Adjust this based on the Mapel entity structure
  }[];
  created_at: Date;
  updated_at: Date;
}