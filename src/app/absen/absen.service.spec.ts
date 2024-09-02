import { Test, TestingModule } from '@nestjs/testing';
import { AbsenService } from './absen.service';

describe('AbsenService', () => {
  let service: AbsenService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AbsenService],
    }).compile();

    service = module.get<AbsenService>(AbsenService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
