import {
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
  Req,
  Param,
  Put,
  Query,
  HttpException,
  Delete,
  Patch,
} from '@nestjs/common';
import { ResponseSuccess } from '../../../utils/interface/respone'; 
import { query } from 'express';
// import { Pagination } from '../../../utils/decorator/pagination.decorator';
import { SiswaService } from './siswa.service';
import { DeleteBulkUserDto, RegisterBulkSiswaDto, RegisterSiswaDto, UpdateSiswaDto } from './siswa.dto';
import { JwtGuard } from '../auth.guard';
import { Pagination } from '../../../utils/decorator/pagination.decorator';

@Controller('siswa')
export class SiswaController {
  constructor(private siswaService: SiswaService) {}

  @Post('register')
  async register(@Body() payload: RegisterSiswaDto) {
    return this.siswaService.registerSiswa(payload);
  }

  @Post('register-bulk')
  async registerBulk(@Body() payloads: RegisterBulkSiswaDto) {
    return this.siswaService.registerBulkSiswa(payloads);
  }

  @Get('list')
  async getSiswaList(@Pagination() query: any) {
    return this.siswaService.getSiswaList(query);
  }

  @UseGuards(JwtGuard)
  @Get('profil')
  async profile() {  // hasil validate dari jwt strategy akan ditambakan pada req.user. isi object req.user akan sama dengan payload dari jwt token. Silahkan coba console.log(req.user)
    return this.siswaService.getSiswaProfile();
  }

  @Post('delete-bulk')
  async deleteBulkSiswa(@Body() payload: DeleteBulkUserDto) {
    return this.siswaService.DeleteBulkSiswa(payload);
  }

  @Patch('update/:id')
  async updateSiswa(
    @Param('id') id: number,
    @Body() updateSiswaDto: UpdateSiswaDto,
  ) {
    return this.siswaService.updateSiswa(id, updateSiswaDto);
  }
}
