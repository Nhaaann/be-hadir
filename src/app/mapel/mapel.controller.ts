// src/app/mapel/mapel.controller.ts
import { Controller, Post, Body, Get, Param, Put, Delete, Query, UseGuards } from '@nestjs/common';
import { MapelService } from './mapel.service';
import { CreateMapelDto, UpdateMapelDto } from './mapel.dto';
import { ResponseSuccess } from 'src/utils/interface/respone'; 
import { JwtGuard } from '../auth/auth.guard';
import { InjectCreatedBy } from '../../utils/decorator/createByDecorator';
import { PageRequestDto } from 'src/utils/dto/page.dto';

@UseGuards(JwtGuard)
@Controller('mapel')
export class MapelController {
  constructor(private readonly mapelService: MapelService) {}

  @Post('create')
  async create(@InjectCreatedBy() createMapelDto: CreateMapelDto): Promise<any> {
    return this.mapelService.create(createMapelDto);
  }

  @Post('create-bulk')
  async createBulk(@Body() payload: { data: CreateMapelDto[] }) {
    return await this.mapelService.createBulk(payload);
  }

  @Get('list')
  async findAll(query: PageRequestDto): Promise<any> {
    return this.mapelService.findAll(query);
  }

  @Put('update/:id')
  async update(
    @Param('id') id: number,
    @Body() updateMapelDto: UpdateMapelDto,
  ): Promise<any> {
    return this.mapelService.update(id, updateMapelDto);
  }

  @Delete('delete/:id')
  async delete(@Param('id') id: number): Promise<any> {
    return this.mapelService.delete(id);
  }

  @Delete('delete-bulk')
  async deleteBulk(@Query('ids') ids: string): Promise<any> {
    const idsArray = ids.split(',').map(id => parseInt(id, 10));
    return this.mapelService.deleteBulk(idsArray);
  }
}
