// src/dto/create-geo-location.dto.ts
import { IsNumber, IsNotEmpty } from 'class-validator';

export class CreateGeoLocationDto {
  @IsNotEmpty()
  latitude: number;

  @IsNotEmpty()
  longitude: number;
}
