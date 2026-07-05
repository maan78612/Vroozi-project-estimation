/*
 * ──────────────────────────────────────────────────────────────────
 !  Static auth copy
 *
 *  Demo password-reset hints and login error messages used until
 *  real auth (and real email delivery) is implemented.
 * ──────────────────────────────────────────────────────────────────
 */

export const STATIC_PASSWORD_RESET_HINTS: Record<string, string> = {
  admin: 'A reset link was sent to admin@vroozi.com. Demo password: admin123',
  ali: 'A reset link was sent to ali@vroozi.com. Demo password: pass123',
  sara: 'A reset link was sent to sara@vroozi.com. Demo password: pass123',
};

export const STATIC_AUTH_MESSAGES = {
  userNotFound: 'No account found with that username.',
  loginFailed: 'Invalid username or password.',
} as const;
