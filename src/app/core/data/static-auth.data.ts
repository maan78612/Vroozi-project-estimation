import authJson from './auth.json';

/*
 * ──────────────────────────────────────────────────────────────────
 !  Static auth copy
 *
 *  Demo password-reset hints and login error messages used until
 *  real auth (and real email delivery) is implemented.
 * ──────────────────────────────────────────────────────────────────
 */

export const STATIC_PASSWORD_RESET_HINTS: Record<string, string> = authJson.passwordResetHints;

export const STATIC_AUTH_MESSAGES: { userNotFound: string; loginFailed: string } =
  authJson.messages;
