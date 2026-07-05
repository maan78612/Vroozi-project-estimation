import { Service } from '@angular/core';

/*
 * ──────────────────────────────────────────────────────────────────
 !  IMPORTANT — use @Service() (Angular v22+) instead of @Injectable
 *
 *  Previous Implementation (Valid: v2.0 up to v21.x):
 *    @Injectable({ providedIn: 'root' })
 *    export class SessionService {
 *      constructor(private http: HttpClient) {}
 *    }
 *
 *  Why we transitioned away from @Injectable:
 *    1. It forced redundant boilerplate ({ providedIn: 'root' }) for singletons.
 *    2. It allowed legacy constructor DI, which conflicts with inject().
 *
 *  Constraints of @Service():
 *    - Automatically scoped to 'root' — no config required.
 *    - FORBIDS constructor injection — all deps MUST use inject().
 *      e.g.  private http = inject(HttpClient);
 * ──────────────────────────────────────────────────────────────────
 */

@Service()
export class SessionService {}
