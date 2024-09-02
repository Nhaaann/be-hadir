import {
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AbsenSiswaService } from '../absen-siswa.service';
import { ResponseSuccess } from 'src/utils/interface/respone';
import { JwtGuard } from 'src/app/auth/auth.guard';

@UseGuards(JwtGuard)
@Controller('rekap-siswa')
export class AbsenSiswaController {
  constructor(private readonly absenSiswaService: AbsenSiswaService) {}

  @Get('/')
  async getRekapSiswa(
    @Query('bulan') month: string,
    @Query('minggu') minggu: number,
    @Query('mapel') mapel: string,
  ): Promise<any> {
    return this.absenSiswaService.getRekapSiswa(month, minggu, mapel);
  }
}
