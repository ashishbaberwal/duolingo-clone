export interface AuthenticatedUser {
  id: number;
  username: string;
  display_name: string;
  avatar_key: string;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface LogoutResponse {
  message: string;
}
