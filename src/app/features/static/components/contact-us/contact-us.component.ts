import { Component } from '@angular/core';

/*
 * ──────────────────────────────────────────────────────────────────
 !  Static info page — rendered inside the app shell for every role
 *  (admin / user / client); see the `contact` child route in both
 *  shell trees (app.routes.ts) and the shell footer links.
 * ──────────────────────────────────────────────────────────────────
 */
@Component({
  selector: 'app-contact-us',
  standalone: true,
  imports: [],
  templateUrl: './contact-us.component.html',
  styleUrl: './contact-us.component.less',
})
export class ContactUsComponent {}
