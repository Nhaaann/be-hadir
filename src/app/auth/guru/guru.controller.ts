import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { GuruService } from './guru.service';
import { RegisterGuruDto, UpdateGuruDto } from './guru.dto';
import { ResponsePagination, ResponseSuccess } from '../../../utils/interface/respone'; 
import { JwtGuard } from '../auth.guard';
import { Pagination } from 'src/utils/decorator/pagination.decorator';

@Controller('guru')
export class GuruController {
  constructor(private readonly guruService: GuruService) {}

  // Endpoint to register a new teacher
  @Post('register')
  async registerGuru(
    @Body() registerGuruDto: RegisterGuruDto,
  ): Promise<any> {
    return this.guruService.registerGuru(registerGuruDto);
  }

  // Endpoint to update teacher information
  @Put('update/:id')
  async updateGuru(
    @Param('id') id: number,
    @Body() updateGuruDto: UpdateGuruDto,
  ): Promise<any> {
    return this.guruService.updateGuru(id, updateGuruDto);
  }

  @Get('detail/:id')
  async getGuruDetailWithSubject(
    @Param('id') id: string,
  ): Promise<any> {
    return this.guruService.getGuruDetailWithSubject(+id);
  }

  //   // Endpoint to delete a teacher
  @Delete('delete/:id')
  async deleteGuru(@Param('id') id: number): Promise<any> {
    return this.guruService.deleteGuru(id);
  }

  //   // Endpoint to get a list of all teachers
  @Get('list')
  async getGuruList(@Pagination() query: any): Promise<any> {
    return this.guruService.getGuruList(query);
  }

  @Get('list-subject')
  async getGuruListSubject(@Pagination() query: any): Promise<ResponsePagination> {
    return this.guruService.getGuruListWithSubject(query);
  }

  @UseGuards(JwtGuard)
  @Get('profile')
  async profile(): Promise<any> {
    return this.guruService.getGuruProfile();
  }
}
