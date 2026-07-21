import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { ButtonComponent } from '../../../../shared/compoments/button/button';

/*
 * ──────────────────────────────────────────────────────────────────
 !  The backend has no password-reset endpoint yet — there's nothing
 *  for this page to submit. Deliberately NOT a form: an email field
 *  and a "Send reset link" button that always "succeeds" without ever
 *  calling an API looks functional but isn't, and a user only finds
 *  that out after they've already typed their email and submitted.
 *  Say it upfront instead. Replace this with a real form once the API
 *  grows a reset endpoint (and email delivery) to submit it to.
 * ──────────────────────────────────────────────────────────────────
 */
@Component({
  selector: 'app-forgot-password',
  imports: [ButtonComponent],
  templateUrl: './forgot-password.component.html',
  styleUrl: './forgot-password.component.less',
})
export class ForgotPasswordComponent {
  private router = inject(Router);

  onBackToLogin(): void {
    this.router.navigateByUrl('/login');
  }
}
