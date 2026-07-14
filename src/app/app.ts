/*
 * ──────────────────────────────────────────────────────────────────
 !  Root standalone component
 *
 *  Hosts the router outlet that every feature route renders into.
 * ──────────────────────────────────────────────────────────────────
 */

import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { LoadingBarComponent } from './shared/compoments/loading-bar/loading-bar.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, LoadingBarComponent],
  templateUrl: './app.html',
  styleUrl: './app.less',
})
export class App {}
