import { Module } from '@nestjs/common';
import { GeoLocationService } from './geo-location.service';
import { GeoLocationController } from './geo-location.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [GeoLocationService],
  controllers: [GeoLocationController],
})
export class GeoLocationModule {}
