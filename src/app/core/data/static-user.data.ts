import { RoleEnum } from '../enums/role-enum';
import { UserInterface } from '../intefaces/user-interface';

export const STATIC_USERS: UserInterface[] = [
  {
    id: 'u1',
    fullName: 'Admin',
    username: 'admin',
    password: 'admin123',
    role: RoleEnum.Admin,
    spreadsheetId: null, // admin doesn't own a sheet
  },
  {
    id: 'u2',
    fullName: 'Ali Khan',
    username: 'ali',
    password: 'pass123',
    role: RoleEnum.User,
    spreadsheetId: '1XfwbNuZAorduu2yUweVF53_Pr-cg_YRTl-f0mHpgzLk',
  },
  {
    id: 'u3',
    fullName: 'Sara Ahmed',
    username: 'sara',
    password: 'pass123',
    role: RoleEnum.User,
    spreadsheetId: '1AnotherUsersSheetIdGoesHere1234567',
  },
  {
    id: 'u4',
    fullName: 'Majid',
    username: 'majid',
    password: 'pass123',
    role: RoleEnum.User,
    spreadsheetId: '1XfwbNuZAorduu2yUweVF53_Pr-cg_YRTl-f0mHpgzLk',
  },
];
