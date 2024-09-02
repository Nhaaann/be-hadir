import { Controller, Get, Query } from '@nestjs/common';
import { RekapAbsenService } from './rekap-absen.service';

@Controller('rekap-absen')
export class RekapAbsenController {
  constructor(private readonly rekapAbsenService: RekapAbsenService) {}

  // @Get('mingguan')
  // async getRekapMingguan(
  //   @Query('startDate') startDate: string,
  //   @Query('endDate') endDate: string,
  // ) {
  //   const start = new Date(startDate);
  //   const end = new Date(endDate);
  //   return this.rekapAbsenService.getRekapMingguan(start, end);
  // }

  // @Get('bulanan')
  // async getRekapBulanan(
  //   @Query('year') year: number,
  //   @Query('month') month: number,
  // ) {
  //   return this.rekapAbsenService.getRekapBulanan(year, month);
  // }

  // @Get('rekap-siswa')
  // async rekapSiswa(
  //   @Query('startDate') startDate: string,
  //   @Query('endDate') endDate: string,
  // ) {
  //   const start = new Date(startDate);
  //   const end = new Date(endDate);
  //   return this.rekapAbsenService.rekapSiswa(start, end);
  // }

  // @Get('rekap-guru')
  // async rekapGuru(
  //   @Query('startDate') startDate: string,
  //   @Query('endDate') endDate: string,
  // ) {
  //   const start = new Date(startDate);
  //   const end = new Date(endDate);
  //   return this.rekapAbsenService.rekapGuru(start, end);
  // }
}
