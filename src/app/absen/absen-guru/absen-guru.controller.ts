import { Controller, Get, HttpException, HttpStatus, Query, UseGuards } from '@nestjs/common';
import { ResponseSuccess } from 'src/utils/interface/respone';

import { JwtGuard } from 'src/app/auth/auth.guard';
import { AbsenGuruService } from '../absen-guru.service';

@UseGuards(JwtGuard)
@Controller('rekap-guru')
export class AbsenGuruController {
  constructor(private readonly absenGuruService: AbsenGuruService) {}

  @Get('/')
  async getWeeklySummary(
    @Query('bulan') month: string,
    @Query('minggu') minggu: number,
    @Query('mapel') mapel: string,
  ): Promise<any> {
    return this.absenGuruService.getRekapGuru(month, minggu, mapel);
  }
}
