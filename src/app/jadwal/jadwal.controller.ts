// src/app/jadwal/jadwal.controller.ts
import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Request,
  Query,
  Put,
  Delete,
  Param,
  Req,
} from '@nestjs/common';
import { JadwalService } from './jadwal.service';
import {
  CreateJadwalDto,
  FindAllJadwalDTO,
  UpdateJadwalDto,
} from './jadwal.dto';
import { ResponseSuccess } from 'src/utils/interface/respone'; 
import { JwtGuard } from '../auth/auth.guard';
import { query } from 'express';
import { Roles } from '../../utils/decorator/roles.decorator';
import { Role } from '../auth/roles.enum';
import { RolesGuard } from '../auth/roles.guard';

@UseGuards(JwtGuard, RolesGuard)
@Controller('jadwal')
export class JadwalController {
  constructor(private readonly jadwalService: JadwalService) {}

  @Get('hari-ini')
  async getCurrentJamDetail() {
    return this.jadwalService.getCurrentJamDetailUser();
  }

  @Get('hari-ini-guru')
  async getCurrentJamDetailGuru() {
    return this.jadwalService.getCurrentJamDetailIdGuru();
  }

  @Get('hari-ini-siswa')
  async getCurrentJamDetailUser() {
    return this.jadwalService.getCurrentJamDetailIdSiswa();
  }

  @Post('create')
  // @Roles(Role.ADMIN, Role.GURU)
  async create(
    @Body() createJadwalDto: CreateJadwalDto,
  ): Promise<any> {
    return this.jadwalService.create(createJadwalDto);
  }

  @Get('list')
  // @Roles(Role.ADMIN)
  async findAll(@Query() query: FindAllJadwalDTO): Promise<any> {
    return this.jadwalService.findAll(query);
  }

  @Put('update/:id')
  async update(
    @Param('id') id: string,
    @Body() updateJadwalDto: UpdateJadwalDto,
  ): Promise<any> {
    return this.jadwalService.update(+id, updateJadwalDto);
  }

  @Get('detail/:id')
  async findOne(@Param('id') id: string): Promise<any> {
    return this.jadwalService.findOne(+id);
  }

  @Delete('delete/:id')
  // @Roles(Role.ADMIN)
  async delete(@Param('id') id: number): Promise<any> {
    return this.jadwalService.delete(id);
  }

  @Delete('delete-bulk')
  async deleteBulk(@Body('data') data: number[]): Promise<any> {
    return this.jadwalService.deleteBulk(data);
  }
}
