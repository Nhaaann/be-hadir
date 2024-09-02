/* eslint-disable prettier/prettier */
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const InjectCreatedBy = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const req = ctx.switchToHttp().getRequest();
    console.log('req', req);

    req.body.created_by = {
      id: req.user.id,
      nama: req.user.nama,
      email: req.user.email,
    };

    return req.body;
  },
);
