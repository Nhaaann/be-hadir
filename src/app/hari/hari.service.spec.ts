import { Test, TestingModule } from '@nestjs/testing';
import { HariService } from './hari.service';

describe('HariService', () => {
  let service: HariService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [HariService],
    }).compile();

    service = module.get<HariService>(HariService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
