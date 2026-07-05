/*
 * ──────────────────────────────────────────────────────────────────
 !  Root application configuration
 *
 *  Registers the global providers (router, HTTP client, error
 *  listeners) that get bootstrapped into the app.
 * ──────────────────────────────────────────────────────────────────
 */

import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';

import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(),
  ],
};
