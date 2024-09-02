import { Test, TestingModule } from '@nestjs/testing';
import { SubjectCodeController } from './subject_code.controller';

describe('SubjectCodeController', () => {
  let controller: SubjectCodeController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SubjectCodeController],
    }).compile();

    controller = module.get<SubjectCodeController>(SubjectCodeController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
