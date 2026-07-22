import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../../core/services/auth/auth-service';
import { FormComponent } from '../../../../shared/compoments/form/form.component';
import { AppLogoComponent } from '../../../../shared/compoments/app-logo/app-logo.component';
import { ButtonComponent } from '../../../../shared/compoments/button/button';
import { FormFieldInterface } from '../../../../core/intefaces/form/form-field.interface';
import { FieldTypeEnum } from '../../../../core/enums/field-type.enum';

@Component({
  selector: 'app-forgot-password',
  imports: [FormComponent, AppLogoComponent, ButtonComponent],
  templateUrl: './forgot-password.component.html',
  styleUrl: './forgot-password.component.less',
})
export class ForgotPasswordComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  onBackToLogin(): void {
    this.router.navigateByUrl('/login');
  }

  readonly fields: FormFieldInterface[] = [
    {
      key: 'email',
      label: 'Email',
      type: FieldTypeEnum.Text,
      required: true,
      inputType: 'email',
      placeholder: 'Enter email',
      icon: 'mail',
      autofocus: true,
    },
  ];

  isSubmitting = signal(false);
  submitError = signal('');
  submitSuccess = signal(false);

  // Same message regardless of whether the email is registered — mirrors
  // the backend's anti-enumeration response.
  readonly successMessage = "If an account exists for that email, we've sent a reset link.";

  onSubmit(value: Record<string, string | number>): void {
    this.isSubmitting.set(true);
    this.submitError.set('');
    this.submitSuccess.set(false);

    this.authService.forgotPassword(value['email'] as string).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.submitSuccess.set(true);
      },
      error: (err: unknown) => {
        this.isSubmitting.set(false);
        this.submitError.set(
          err instanceof Error ? err.message : 'Could not send reset email. Please try again.',
        );
      },
    });
  }
}
