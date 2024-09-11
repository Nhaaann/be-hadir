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
  import { Pagination } from '../../../utils/decorator/pagination.decorator';
  // import { StafService } from './staf.service';
  import {
    DeleteBulkStafDto,
    RegisterBulkStafDto,
    RegisterStafDto,
    UpdateStafDto,
  } from '../staf/staf.dto';
  import { JwtGuard } from '../auth.guard';
  import { StafService } from '../staf/staf.service';
  
  @Controller('staf')
  export class StafController {
    constructor(private stafService: StafService) {}
  
    @Post('register')
    async register(@Body() payload: RegisterStafDto) {
      return this.stafService.registerStaf(payload);
    }
  
    @Post('register-bulk')
    async registerBulk(@Body() payloads: RegisterBulkStafDto) {
      return this.stafService.registerBulkStaf(payloads);
    }
  
    @Get('list')
    async getStafList(@Pagination() query: any) {
      return this.stafService.getStafList(query);
    }
  
    @UseGuards(JwtGuard)
    @Get('profil')
    async profile(@Req() req: any) {
      return this.stafService.getStafProfile();
    }
  
    @Post('delete-bulk')
    async deleteBulkStaf(@Body() payload: DeleteBulkStafDto) {
      return this.stafService.deleteBulkStaf(payload);
    }
  
    @Patch('update/:id')
    async updateStaf(
      @Param('id') id: number,
      @Body() updateStafDto: UpdateStafDto,
    ) {
      return this.stafService.updateStaf(id, updateStafDto);
    }
  }
  