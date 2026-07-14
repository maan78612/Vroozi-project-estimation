import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FormComponent } from '../../../../shared/compoments/form/form.component';
import { ButtonComponent } from '../../../../shared/compoments/button/button';
import { FormFieldInterface } from '../../../../core/intefaces/form/form-field.interface';
import { FieldTypeEnum } from '../../../../core/enums/field-type.enum';

/*
 * ──────────────────────────────────────────────────────────────────
 !  The backend has no password-reset endpoint yet, so this page only
 *  points the user to an administrator. Wire it to a real endpoint
 *  (and email delivery) once the API grows one.
 * ──────────────────────────────────────────────────────────────────
 */
@Component({
  selector: 'app-forgot-password',
  imports: [FormComponent, ButtonComponent],
  templateUrl: './forgot-password.component.html',
  styleUrl: './forgot-password.component.less',
})
export class ForgotPasswordComponent {
  private router = inject(Router);

  readonly resetFields: FormFieldInterface[] = [
    {
      key: 'email',
      label: 'Email',
      type: FieldTypeEnum.Text,
      required: true,
      inputType: 'email',
      placeholder: 'Enter email',
    },
  ];

  isSubmitting = signal(false);
  submitError = signal('');
  submitSuccess = signal(false);
  successMessage = signal('');

  onSubmit(_value: Record<string, string | number>): void {
    this.submitError.set('');
    this.submitSuccess.set(true);
    this.successMessage.set(
      'Password reset is not available yet — please contact your administrator to reset your password.',
    );
  }

  onBackToLogin(): void {
    this.router.navigateByUrl('/login');
  }
}
