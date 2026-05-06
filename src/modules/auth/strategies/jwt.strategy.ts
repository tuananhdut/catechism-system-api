import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';

import { JwtPayload } from '../dto/jwt-payload.dto';
import { UserRepository } from '../user.repository';
import { COOKIE_NAMES } from '../utils/cookie.util';

function extractJwtFromRequest(req: Request): string | null {
  const cookieToken = (req?.cookies as Record<string, string>)?.[COOKIE_NAMES.ACCESS_TOKEN];
  if (cookieToken) return cookieToken;
  return ExtractJwt.fromAuthHeaderAsBearerToken()(req);
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    configService: ConfigService,
    private readonly userRepository: UserRepository
  ) {
    super({
      jwtFromRequest: extractJwtFromRequest,
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET'),
    });
  }

  async validate(
    payload: JwtPayload
  ): Promise<{ id: string; email: string; username: string; vaiTro: string }> {
    const user = await this.userRepository.findById(payload.sub);
    if (!user) throw new UnauthorizedException('Không tìm thấy người dùng');

    return {
      id: user.id,
      email: user.email,
      username: user.username,
      vaiTro: user.vaiTro,
    };
  }
}
