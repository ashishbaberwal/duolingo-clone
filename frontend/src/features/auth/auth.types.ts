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

export interface RegistrationDetails {
  display_name: string;
  username: string;
  email: string;
  password: string;
}

export interface RegisteredUser extends AuthenticatedUser {
  email: string;
}

export interface LogoutResponse {
  message: string;
}
