import { Module } from '@nestjs/common';
import { RekapAbsenService } from './rekap-absen.service';
import { TypeOrmModule } from '@nestjs/typeorm';
// import { RekapAbsen } from './rekap-absen.entity';
import { RekapAbsenController } from './rekap-absen.controller';

@Module({
  // imports: [TypeOrmModule.forFeature([RekapAbsen])],
  providers: [RekapAbsenService],
  controllers: [RekapAbsenController]
})

export class RekapAbsenModule {}
