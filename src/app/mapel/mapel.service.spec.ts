import { Test, TestingModule } from '@nestjs/testing';
import { MapelService } from './mapel.service';

describe('MapelService', () => {
  let service: MapelService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MapelService],
    }).compile();

    service = module.get<MapelService>(MapelService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
