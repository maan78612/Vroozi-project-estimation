import { Component } from '@angular/core';

/*
 * ──────────────────────────────────────────────────────────────────
 !  Static info page — rendered inside the app shell for every role
 *  (admin / user / client); see the `terms` child route in both
 *  shell trees (app.routes.ts) and the shell footer links.
 * ──────────────────────────────────────────────────────────────────
 */
@Component({
  selector: 'app-terms-of-use',
  standalone: true,
  imports: [],
  templateUrl: './terms-of-use.component.html',
  styleUrl: './terms-of-use.component.less',
})
export class TermsOfUseComponent {}
