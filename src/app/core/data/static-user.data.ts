import { UserInterface } from '../intefaces/user-interface';
import usersJson from './users.json';

// Static user data — temporary stand-in for the future MongoDB collection.
export const STATIC_USERS: UserInterface[] = usersJson as UserInterface[];
