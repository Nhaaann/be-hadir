// src/app/subject_code/subject_code.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
// import { SubjectCodeEntity} from './subject_code.entity';
import { SubjectCodeService } from './subject_code.service';
import { SubjectCodeController } from './subject_code.controller';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [SubjectCodeService],
  controllers: [SubjectCodeController],
})
export class SubjectCodeModule {}
