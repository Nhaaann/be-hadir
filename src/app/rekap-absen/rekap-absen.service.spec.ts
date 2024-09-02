import { Test, TestingModule } from '@nestjs/testing';
import { RekapAbsenService } from './rekap-absen.service';

describe('RekapAbsenService', () => {
  let service: RekapAbsenService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RekapAbsenService],
    }).compile();

    service = module.get<RekapAbsenService>(RekapAbsenService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
