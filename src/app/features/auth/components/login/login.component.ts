import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../../core/services/auth/auth-service';
import { ThemeService } from '../../../../core/services/theme/theme-service';
import { homeRouteForRole } from '../../../../core/utils/role-route.util';
import { FormComponent } from '../../../../shared/compoments/form/form.component';
import { AppLogoComponent } from '../../../../shared/compoments/app-logo/app-logo.component';
import { ConfirmDialogComponent } from '../../../../shared/compoments/confirm-dialog/confirm-dialog.component';
import { FormFieldInterface } from '../../../../core/intefaces/form/form-field.interface';
import { FieldTypeEnum } from '../../../../core/enums/field-type.enum';
import { ApiClientError, ACCOUNT_NOT_ACTIVATED_CODE } from '../../../../core/intefaces/api.interface';

@Component({
  selector: 'app-login',
  imports: [FormComponent, AppLogoComponent, ConfirmDialogComponent],
  templateUrl: './login.component.html',
  styleUrl: './login.component.less',
})
export class LoginComponent {
  private authService = inject(AuthService);
  private router = inject(Router);
  readonly themeService = inject(ThemeService);

  readonly loginFields: FormFieldInterface[] = [
    {
      key: 'email',
      label: 'Email',
      type: FieldTypeEnum.Text,
      required: true,
      inputType: 'email',
      placeholder: 'Enter email',
      icon: 'mail',
    },
    {
      key: 'password',
      label: 'Password',
      type: FieldTypeEnum.Text,
      required: true,
      inputType: 'password',
      placeholder: 'Enter password',
      icon: 'lock',
      trailingLink: { label: 'Forgot password?', route: '/forgot-password' },
    },
  ];

  isSubmitting = signal(false);
  submitError = signal('');
  submitSuccess = signal(false);
  successMessage = signal('');

  // Shown instead of the generic error when login fails specifically
  // because an admin-created account hasn't set its password yet.
  showActivationDialog = signal(false);
  resendPending = signal(false);
  resendError = signal('');
  private attemptedEmail = '';

  onSubmit(value: Record<string, string | number>): void {
    this.attemptedEmail = value['email'] as string;
    this.isSubmitting.set(true);
    this.submitError.set('');
    this.submitSuccess.set(false);

    this.authService.login(this.attemptedEmail, value['password'] as string).subscribe({
      next: (user) => {
        this.isSubmitting.set(false);
        this.router.navigateByUrl(homeRouteForRole(user.role));
      },
      error: (err: unknown) => {
        this.isSubmitting.set(false);
        if (err instanceof ApiClientError && err.code === ACCOUNT_NOT_ACTIVATED_CODE) {
          this.showActivationDialog.set(true);
          return;
        }
        this.submitError.set(
          err instanceof Error ? err.message : 'Invalid email or password.',
        );
      },
    });
  }

  onResendActivation(): void {
    this.resendPending.set(true);
    this.resendError.set('');

    this.authService.resendActivationEmail(this.attemptedEmail).subscribe({
      next: () => {
        this.resendPending.set(false);
        this.showActivationDialog.set(false);
        this.successMessage.set('Activation email resent — check your inbox.');
        this.submitSuccess.set(true);
      },
      error: (err: unknown) => {
        this.resendPending.set(false);
        this.resendError.set(
          err instanceof Error ? err.message : 'Could not resend the activation email.',
        );
      },
    });
  }

  onCloseActivationDialog(): void {
    if (this.resendPending()) return;
    this.showActivationDialog.set(false);
  }
}
