import { RoleEnum } from '../enums/role-enum';

export interface UserInterface {
  id: string;
  fullName?: string; // contact/display name; not set for the built-in admin account
  username: string;
  password: string;
  role: RoleEnum;
}
