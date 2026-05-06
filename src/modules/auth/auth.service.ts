import {
  Injectable,
  Logger,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

import { UserRepository } from './user.repository';
import { RefreshTokenRepository } from './refresh-token.repository';
import { LoginAttemptRepository } from './login-attempt.repository';
import { AccountLockedException } from './exceptions/account-locked.exception';
import { JwtPayload, LoginResponse, UserProfileResponse } from './dto';
import { CreateUserRequest } from './dto/create-user-request.dto';

const BCRYPT_SALT_ROUNDS = 10;

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly userRepository: UserRepository,
    private readonly refreshTokenRepository: RefreshTokenRepository,
    private readonly loginAttemptRepository: LoginAttemptRepository,
    private readonly jwtService: JwtService
  ) {}

  async loginWithCredentials(identifier: string, password: string): Promise<LoginResponse> {
    const user = await this.userRepository.findByUsernameOrEmail(identifier, true);

    if (!user || !user.password) {
      await this.loginAttemptRepository.recordFailure(identifier);
      throw new UnauthorizedException('Tên đăng nhập hoặc mật khẩu không đúng');
    }

    const preLockStatus = await this.loginAttemptRepository.isLocked(user.username);
    if (preLockStatus.locked) {
      throw new AccountLockedException(preLockStatus.remainingSeconds);
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      const result = await this.loginAttemptRepository.recordFailure(user.username);
      if (result.locked) throw new AccountLockedException(15 * 60);
      throw new UnauthorizedException('Tên đăng nhập hoặc mật khẩu không đúng');
    }

    await this.loginAttemptRepository.resetAttempts(user.username);
    return this._generateTokensForUser(user.id, user.email, user.username, user.vaiTro);
  }

  async createUser(dto: CreateUserRequest): Promise<UserProfileResponse> {
    if (await this.userRepository.findByUsername(dto.username)) {
      throw new ConflictException('Tên đăng nhập đã tồn tại');
    }
    if (await this.userRepository.findByEmail(dto.email)) {
      throw new ConflictException('Email đã tồn tại');
    }

    const hashedPassword = await bcrypt.hash(dto.password, BCRYPT_SALT_ROUNDS);
    const user = await this.userRepository.create({
      username: dto.username,
      password: hashedPassword,
      hoTen: dto.hoTen,
      email: dto.email,
      vaiTro: dto.vaiTro,
    });

    return {
      id: user.id,
      email: user.email,
      username: user.username,
      hoTen: user.hoTen,
      vaiTro: user.vaiTro,
      createdAt: user.createdAt,
    };
  }

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string
  ): Promise<void> {
    const user = await this.userRepository.findById(userId);
    if (!user) throw new BadRequestException('Không tìm thấy người dùng');

    const isCurrentValid = await bcrypt.compare(currentPassword, user.password);
    if (!isCurrentValid) throw new UnauthorizedException('Mật khẩu hiện tại không đúng');

    const hashedPassword = await bcrypt.hash(newPassword, BCRYPT_SALT_ROUNDS);
    await this.userRepository.updatePassword(userId, hashedPassword);
  }

  async adminChangePassword(userId: string, newPassword: string): Promise<void> {
    const user = await this.userRepository.findById(userId);
    if (!user) throw new BadRequestException('Không tìm thấy người dùng');

    const hashedPassword = await bcrypt.hash(newPassword, BCRYPT_SALT_ROUNDS);
    await this.userRepository.updatePassword(userId, hashedPassword);
  }

  async refreshAccessToken(refreshToken: string): Promise<LoginResponse> {
    const storedToken = await this.refreshTokenRepository.findActiveToken(refreshToken);
    if (!storedToken) throw new UnauthorizedException('Refresh token không hợp lệ hoặc đã hết hạn');

    try {
      const payload = this.jwtService.verify<JwtPayload>(refreshToken);
      const user = await this.userRepository.findById(payload.sub);
      if (!user) {
        await this.refreshTokenRepository.revoke(refreshToken);
        throw new UnauthorizedException('Không tìm thấy người dùng');
      }

      await this.refreshTokenRepository.revoke(refreshToken);
      return this._generateTokensForUser(
        payload.sub,
        payload.email,
        payload.username,
        payload.vaiTro
      );
    } catch (error) {
      if (error instanceof UnauthorizedException) throw error;
      throw new UnauthorizedException('Refresh token không hợp lệ');
    }
  }

  async logout(refreshToken: string): Promise<void> {
    try {
      await this.refreshTokenRepository.revoke(refreshToken);
    } catch {
      // Token đã bị revoke hoặc không tồn tại — bỏ qua
    }
  }

  async getUserProfile(userId: string): Promise<UserProfileResponse> {
    const user = await this.userRepository.findById(userId);
    if (!user) throw new NotFoundException('Không tìm thấy người dùng');

    return {
      id: user.id,
      email: user.email,
      username: user.username,
      hoTen: user.hoTen,
      vaiTro: user.vaiTro,
      createdAt: user.createdAt,
    };
  }

  private async _generateTokensForUser(
    userId: string,
    email: string,
    username: string,
    vaiTro: string
  ): Promise<LoginResponse> {
    const payload: JwtPayload = { sub: userId, email, username, vaiTro };

    const accessToken = this.jwtService.sign(payload, { expiresIn: '15m' });
    const refreshToken = this.jwtService.sign(payload, { expiresIn: '7d' });

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    await this.refreshTokenRepository.create(userId, refreshToken, expiresAt);

    const user = await this.userRepository.findById(userId);

    return {
      accessToken,
      refreshToken,
      expiresIn: 900,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        hoTen: user.hoTen,
        vaiTro: user.vaiTro,
      },
    };
  }
}
