import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  constructor() {
    super({
      transactionOptions: {
        maxWait: 10000,
      },
      errorFormat: 'pretty',
      datasourceUrl:
        'postgresql://postgres.fcvhhrzguywmeswewqek:prfVDcjEgBaP1lew@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres',
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
}
