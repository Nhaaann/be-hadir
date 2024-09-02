import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString } from 'class-validator';

export class PageRequestDto {
  @IsString()
  @IsOptional()
  sort_by: string;

  @IsString()
  @IsOptional()
  order_by: string;

  @IsInt()
  @Type(() => Number)
  page = 1;

  @IsInt()
  @Type(() => Number)
  pageSize = 10;

  @IsInt()
  @IsOptional()
  limit;
}
