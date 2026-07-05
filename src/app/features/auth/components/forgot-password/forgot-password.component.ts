import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../../core/services/auth/auth-service';
import { FormComponent } from '../../../../shared/compoments/form/form.component';
import { ButtonComponent } from '../../../../shared/compoments/button/button';
import { FormFieldInterface } from '../../../../core/intefaces/form/form-field.interface';
import { FieldTypeEnum } from '../../../../core/enums/field-type.enum';

@Component({
  selector: 'app-forgot-password',
  imports: [FormComponent, ButtonComponent],
  templateUrl: './forgot-password.component.html',
  styleUrl: './forgot-password.component.less',
})
export class ForgotPasswordComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  readonly resetFields: FormFieldInterface[] = [
    {
      key: 'username',
      label: 'Username',
      type: FieldTypeEnum.Text,
      required: true,
      placeholder: 'Enter username',
    },
  ];

  isSubmitting = signal(false);
  submitError = signal('');
  submitSuccess = signal(false);
  successMessage = signal('');

  onSubmit(value: Record<string, string | number>): void {
    this.isSubmitting.set(true);
    this.submitError.set('');
    this.submitSuccess.set(false);

    setTimeout(() => {
      const result = this.authService.requestPasswordReset(value['username'] as string);

      this.isSubmitting.set(false);

      if (!result.success) {
        this.submitError.set(result.message);
        return;
      }

      this.submitSuccess.set(true);
      this.successMessage.set(result.message);
    });
  }

  onBackToLogin(): void {
    this.router.navigateByUrl('/login');
  }
}
