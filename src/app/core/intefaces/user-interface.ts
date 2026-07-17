import { RoleEnum } from '../enums/role-enum';

/*
 * Signed-in user / employee as the backend returns it (MongoDB `_id`
 * is mapped to `id`; the password never leaves the server).
 */
export interface UserInterface {
  id: string;
  name: string;
  email: string;
  role: RoleEnum;
  jobTitle?: string;
  department?: string;
}
