// initial-schedule.controller.ts
import { Controller, Post, Get, Put, Delete, Body, Param } from '@nestjs/common';
import { InitialScheduleService } from './initial-schedule.service';
// import { CreateInitialScheduleDto, UpdateInitialScheduleDto } from './initial-schedule.dto';

@Controller('initial-schedule')
export class InitialScheduleController {
  constructor(private readonly initialScheduleService: InitialScheduleService) {}

  @Post('create')
  async create() {
    return this.initialScheduleService.createInitialSchedule();
  }

  @Get('list')
  async findAll() {
    return this.initialScheduleService.getAvailableSchedules();
  }

  @Put(':id')
  async update(@Param('id') id: number, @Body() dto: any) {
    return this.initialScheduleService.updateInitialSchedule(id, dto);
  }

  @Delete(':id')
  async remove(@Param('id') id: number) {
    return this.initialScheduleService.deleteInitialSchedule(id);
  }
}
