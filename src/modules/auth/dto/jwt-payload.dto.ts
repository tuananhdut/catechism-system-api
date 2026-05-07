export interface JwtPayload {
  sub: string;
  email: string | null;
  username: string;
  role: string;
  iat?: number;
  exp?: number;
}
