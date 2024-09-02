import { Test, TestingModule } from '@nestjs/testing';
import { SubjectCodeService } from './subject_code.service';

describe('SubjectCodeService', () => {
  let service: SubjectCodeService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SubjectCodeService],
    }).compile();

    service = module.get<SubjectCodeService>(SubjectCodeService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
