import { Test, TestingModule } from '@nestjs/testing';
import { AbsenGateway } from './absen.gateway';

describe('AbsenGateway', () => {
  let gateway: AbsenGateway;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AbsenGateway],
    }).compile();

    gateway = module.get<AbsenGateway>(AbsenGateway);
  });

  it('should be defined', () => {
    expect(gateway).toBeDefined();
  });
});
