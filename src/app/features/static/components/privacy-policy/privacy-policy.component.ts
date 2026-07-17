import { Component } from '@angular/core';

/*
 * ──────────────────────────────────────────────────────────────────
 !  Static info page — rendered inside the app shell for every role
 *  (admin / user / client); see the `privacy-policy` child route in
 *  both shell trees (app.routes.ts) and the shell footer links.
 * ──────────────────────────────────────────────────────────────────
 */
@Component({
  selector: 'app-privacy-policy',
  standalone: true,
  imports: [],
  templateUrl: './privacy-policy.component.html',
  styleUrl: './privacy-policy.component.less',
})
export class PrivacyPolicyComponent {}
