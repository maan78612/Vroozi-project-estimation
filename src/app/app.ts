/*
 * ──────────────────────────────────────────────────────────────────
 !  Root standalone component
 *
 *  Hosts the router outlet that every feature route renders into.
 * ──────────────────────────────────────────────────────────────────
 */

import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.less',
})
export class App {}
