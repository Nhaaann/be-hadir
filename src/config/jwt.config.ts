import * as dotenv from 'dotenv';
dotenv.config();

export const jwt_config = {
  access_token_secret: process.env.JWT_SECRET,
  expired: Number(process.env.JWT_EXPIRED),
  refresh_token_secret: process.env.TOKEN_SECRET
};
