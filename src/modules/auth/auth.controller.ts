import {
  Controller,
  Get,
  Post,
  Body,
  Req,
  Res,
  UseGuards,
  HttpCode,
  HttpStatus,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import type { Request, Response } from 'express';

import { AuthService } from './auth.service';
import { RolesGuard } from './guards/roles.guard';
import { Public } from './decorators/public.decorator';
import { CurrentUser } from './decorators/current-user.decorator';
import { Roles } from './decorators/roles.decorator';
import { CookieLoginResponse, LoginRequest, CreateUserRequest, UserProfileResponse } from './dto';
import {
  ChangePasswordRequest,
  AdminChangePasswordRequest,
} from './dto/change-password-request.dto';
import { ErrorResponseDto } from '../../common/dto/error-response.dto';
import { setAuthCookies, clearAuthCookies, COOKIE_NAMES } from './utils/cookie.util';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @Public()
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Đăng nhập bằng username/email và mật khẩu' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Đăng nhập thành công' })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Sai thông tin đăng nhập',
    type: ErrorResponseDto,
  })
  async login(
    @Body() body: LoginRequest,
    @Res({ passthrough: true }) res: Response
  ): Promise<CookieLoginResponse> {
    const result = await this.authService.loginWithCredentials(body.username, body.password);
    setAuthCookies(res, result.accessToken, result.refreshToken);
    return { expiresIn: result.expiresIn, user: result.user };
  }

  @Post('users')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Tạo người dùng mới (chỉ ADMIN)' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Tạo người dùng thành công' })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Username hoặc email đã tồn tại',
    type: ErrorResponseDto,
  })
  async createUser(@Body() body: CreateUserRequest): Promise<UserProfileResponse> {
    return this.authService.createUser(body);
  }

  @Post('refresh')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Làm mới access token bằng refresh token từ cookie' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Token được làm mới thành công' })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Refresh token không hợp lệ',
    type: ErrorResponseDto,
  })
  async refreshToken(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response
  ): Promise<CookieLoginResponse> {
    const refreshTokenValue = req.cookies?.[COOKIE_NAMES.REFRESH_TOKEN] as string | undefined;
    if (!refreshTokenValue) {
      clearAuthCookies(res);
      throw new UnauthorizedException('Không có refresh token');
    }
    const result = await this.authService.refreshAccessToken(refreshTokenValue);
    setAuthCookies(res, result.accessToken, result.refreshToken);
    return { expiresIn: result.expiresIn, user: result.user };
  }

  @Post('logout')
  @Public()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Đăng xuất — xoá cookie và revoke refresh token' })
  @ApiResponse({ status: HttpStatus.NO_CONTENT, description: 'Đăng xuất thành công' })
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response): Promise<void> {
    const refreshTokenValue = req.cookies?.[COOKIE_NAMES.REFRESH_TOKEN] as string | undefined;
    if (refreshTokenValue) await this.authService.logout(refreshTokenValue);
    clearAuthCookies(res);
  }

  @Get('profile')
  @ApiOperation({ summary: 'Lấy thông tin người dùng hiện tại' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Lấy profile thành công' })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Chưa xác thực',
    type: ErrorResponseDto,
  })
  async getProfile(@CurrentUser() user: { id: string }): Promise<UserProfileResponse> {
    return this.authService.getUserProfile(user.id);
  }

  @Post('change-password')
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Đổi mật khẩu (người dùng tự đổi)' })
  @ApiResponse({ status: HttpStatus.NO_CONTENT, description: 'Đổi mật khẩu thành công' })
  async changePassword(
    @CurrentUser() user: { id: string },
    @Body() body: ChangePasswordRequest
  ): Promise<void> {
    await this.authService.changePassword(user.id, body.currentPassword, body.newPassword);
  }

  @Post('admin/change-password')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Admin đổi mật khẩu cho người dùng bất kỳ' })
  @ApiResponse({ status: HttpStatus.NO_CONTENT, description: 'Đổi mật khẩu thành công' })
  async adminChangePassword(@Body() body: AdminChangePasswordRequest): Promise<void> {
    await this.authService.adminChangePassword(body.userId, body.newPassword);
  }
}
