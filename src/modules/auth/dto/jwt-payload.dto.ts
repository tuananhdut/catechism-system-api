export interface JwtPayload {
  sub: string;
  email: string;
  username: string;
  vaiTro: string;
  iat?: number;
  exp?: number;
}
