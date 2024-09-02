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
      log: ['query', 'info', 'warn', 'error'],
      datasources: {
        db: {
          url: 'postgresql://postgres.htuicllcgplhhvvrxxdf:JJaIaIilhOnfqi0F@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true',
        },
      },
    });
  }
  async onModuleInit() {
    await this.$connect();
  }
}
