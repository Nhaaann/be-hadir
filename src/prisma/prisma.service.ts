import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor() {
    super({
      transactionOptions: {
        maxWait: 10000,
      },
      log: ['query', 'info', 'warn', 'error'],
      datasources: {
        db: {
          url: 'postgresql://postgres.fcvhhrzguywmeswewqek:prfVDcjEgBaP1lew@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres',
        },
      },
    });
  }
  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'], // Log Prisma operations
});
