import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService], // Ekspor PrismaService agar dapat digunakan di modul lain
})
export class PrismaModule {}
