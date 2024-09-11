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
import { ResponseSuccess } from '../../../utils/interface/respone'; 
import { JwtGuard } from '../auth.guard';

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
  async getGuruList(): Promise<any> {
    return this.guruService.getGuruList();
  }

  @Get('list-subject')
  async getGuruListSubject(): Promise<any> {
    return this.guruService.getGuruListWithSubject();
  }

  @UseGuards(JwtGuard)
  @Get('profile')
  async profile(): Promise<any> {
    return this.guruService.getGuruProfile();
  }
}
