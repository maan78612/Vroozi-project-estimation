export enum RoleEnum {
  Admin = 'admin',
  User = 'user',
  // External client-side contact — same project edit/view rights as
  // User, but scoped by clientCompany instead of individual ownership.
  Client = 'client',
}
