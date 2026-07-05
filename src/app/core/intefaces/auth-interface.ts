import { UserInterface } from './user-interface';

export interface LoginCredentialsInterface {
  username: string;
  password: string;
}

export interface AuthInterface {
  isAuthenticated: boolean;
  currentUser: UserInterface | null;
}

export interface PasswordResetResultInterface {
  success: boolean;
  message: string;
}
