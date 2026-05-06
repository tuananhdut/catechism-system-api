import { HttpException, HttpStatus } from '@nestjs/common';

export class AccountLockedException extends HttpException {
  constructor(remainingSeconds: number) {
    super(
      {
        statusCode: HttpStatus.TOO_MANY_REQUESTS,
        message: 'Tài khoản bị khóa do đăng nhập sai quá nhiều lần',
        error: 'AccountLocked',
        remainingSeconds,
      },
      HttpStatus.TOO_MANY_REQUESTS
    );
  }
}
