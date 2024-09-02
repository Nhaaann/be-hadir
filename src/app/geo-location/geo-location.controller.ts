import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import { GeoLocationService } from './geo-location.service';
import { ResponseSuccess } from 'src/utils/interface/respone'; 
import { CreateGeoLocationDto } from './geo-location.dto';

@Controller('geo-location')
export class GeoLocationController {
  constructor(private readonly geoLocationService: GeoLocationService) {}

  @Get('/:id')
  async getCurrentJamDetailSiswa(@Param('id') id: string) {
    return this.geoLocationService.getGeoLocation(+id);
  }

  @Post('create')
  // @Roles(Role.ADMIN, Role.GURU)
  async create(@Body() pay: CreateGeoLocationDto): Promise<any> {
    return this.geoLocationService.createGeoLocation(pay);
  }

  @Put('update/:id')
  async update(
    @Param('id') id: string,
    @Body() updateJadwalDto: CreateGeoLocationDto,
  ): Promise<any> {
    return this.geoLocationService.updateGeoLocation(+id, updateJadwalDto);
  }

  @Delete('delete/:id')
  // @Roles(Role.ADMIN)
  async delete(@Param('id') id: number): Promise<any> {
    return this.geoLocationService.deleteGeoLocation(id);
  }
}
