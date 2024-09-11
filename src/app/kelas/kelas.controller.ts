// src/app/kelas/kelas.controller.ts
import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Put,
  Delete,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { KelasService } from './kelas.service';
import { ResponseSuccess } from '../../utils/interface/respone'; 
import { BulkCreateKelasDto, CreateKelasDto } from './kelas.dto';
import { InjectCreatedBy } from '../../utils/decorator/createByDecorator';
import { JwtGuard } from '../auth/auth.guard';
import { Pagination } from '../../utils/decorator/pagination.decorator';

@UseGuards(JwtGuard)
@Controller('kelas')
export class KelasController {
  constructor(private readonly kelasService: KelasService) {}

  @Post('create')
  async create(
    @Body() createKelasDto: CreateKelasDto,
  ): Promise<any> {
    return this.kelasService.create(createKelasDto);
  }

  @Get('list')
  async findAll(@Pagination() query: any): Promise<any> {
    // const { id } = req.user;
      return this.kelasService.findAll(query);
  }

  @Put('update/:id')
  async update(
    @Param('id') id: number,
    @Body() updateKelasDto: CreateKelasDto,
  ): Promise<any> {
    return this.kelasService.update(id, updateKelasDto);
  }

  @Delete('delete/:id')
  async delete(@Param('id') id: number): Promise<any> {
    return this.kelasService.delete(id);
  }

  @Delete('delete-bulk')
  async deleteBulk(@Query('ids') ids: string): Promise<any> {
    const idsArray = ids.split(',').map((id) => parseInt(id, 10));
    return this.kelasService.deleteBulk(idsArray);
  }

  @Get('detail/:id')
  async getKelasDetail(@Param('id') id: number): Promise<any> {
    return this.kelasService.findOneWithStudents(id);
  }

  @Post('create/bulk')
  async createBulk(@Body() bulkCreateKelasDto: BulkCreateKelasDto): Promise<any> {
    return this.kelasService.createBulk(bulkCreateKelasDto);
  }
}
