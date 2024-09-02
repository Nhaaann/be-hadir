import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const InjectCreatedBulkBy = createParamDecorator(
  (data: any, ctx: ExecutionContext) => {
    const req = ctx.switchToHttp().getRequest();

    const tes = req.body.data.map((item) => {
      return {
        ...item,
        created_by: { id: req.user.id },
      };
    });

    req.body.data = tes;

    return req.body;
  },
);
