import type { CookieOptions } from 'express';
import { TOKEN_LIFETIME_SECONDS } from './token';

export const AUTH_COOKIE = 'session';

/**
 * httpOnly: not readable from JavaScript (XSS can't steal it).
 * sameSite lax: not sent on cross-site POSTs (basic CSRF protection); the app is same-origin.
 * secure is off because the demo runs over plain http://localhost.
 */
export const authCookieOptions: CookieOptions = {
  httpOnly: true,
  sameSite: 'lax',
  secure: false,
  path: '/',
  maxAge: TOKEN_LIFETIME_SECONDS * 1000,
};

export const clearAuthCookieOptions: CookieOptions = {
  httpOnly: authCookieOptions.httpOnly,
  sameSite: authCookieOptions.sameSite,
  secure: authCookieOptions.secure,
  path: authCookieOptions.path,
};
