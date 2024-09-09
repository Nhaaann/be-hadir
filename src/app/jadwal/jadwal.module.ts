import { Module } from '@nestjs/common';
import { JadwalController } from './jadwal.controller';
import { JadwalService } from './jadwal.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PrismaModule } from 'src/prisma/prisma.module';
import { InitialScheduleService } from './initial-schedule.service';
import { InitialScheduleController } from './initial-schedule.controller';

@Module({
  imports: [PrismaModule],
  controllers: [JadwalController, InitialScheduleController],
  providers: [JadwalService, InitialScheduleService],
})
export class JadwalModule {}
