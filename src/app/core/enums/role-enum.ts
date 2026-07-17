export enum RoleEnum {
  Admin = 'admin',
  User = 'user',
  // External client-side contact — same project edit/view rights as
  // User, but scoped to the one project directly assigned to them
  // (see the `client` field on Project) instead of ownership.
  Client = 'client',
}
