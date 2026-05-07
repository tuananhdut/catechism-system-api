export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: {
    id: string;
    email: string | null;
    username: string;
    fullName: string;
    role: string;
  };
}

export interface CookieLoginResponse {
  expiresIn: number;
  user: {
    id: string;
    email: string | null;
    username: string;
    fullName: string;
    role: string;
  };
}

export interface UserProfileResponse {
  id: string;
  email: string | null;
  username: string;
  fullName: string;
  role: string;
  createdAt: Date;
}
