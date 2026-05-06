export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: {
    id: string;
    email: string;
    username: string;
    hoTen: string;
    vaiTro: string;
  };
}

export interface CookieLoginResponse {
  expiresIn: number;
  user: {
    id: string;
    email: string;
    username: string;
    hoTen: string;
    vaiTro: string;
  };
}

export interface UserProfileResponse {
  id: string;
  email: string;
  username: string;
  hoTen: string;
  vaiTro: string;
  createdAt: Date;
}
