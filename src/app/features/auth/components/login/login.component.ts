import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../../core/services/auth/auth-service';
import { RoleEnum } from '../../../../core/enums/role-enum';
import { FormComponent } from '../../../../shared/compoments/form/form.component';
import { FormFieldInterface } from '../../../../core/intefaces/form/form-field.interface';
import { FieldTypeEnum } from '../../../../core/enums/field-type.enum';

@Component({
  selector: 'app-login',
  imports: [RouterLink, FormComponent],
  templateUrl: './login.component.html',
  styleUrl: './login.component.less',
})
export class LoginComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  readonly loginFields: FormFieldInterface[] = [
    {
      key: 'email',
      label: 'Email',
      type: FieldTypeEnum.Text,
      required: true,
      inputType: 'email',
      placeholder: 'Enter email',
    },
    {
      key: 'password',
      label: 'Password',
      type: FieldTypeEnum.Text,
      required: true,
      inputType: 'password',
      placeholder: 'Enter password',
    },
  ];

  isSubmitting = signal(false);
  submitError = signal('');

  onSubmit(value: Record<string, string | number>): void {
    this.isSubmitting.set(true);
    this.submitError.set('');

    this.authService.login(value['email'] as string, value['password'] as string).subscribe({
      next: (user) => {
        this.isSubmitting.set(false);
        this.router.navigateByUrl(user.role === RoleEnum.Admin ? '/admin/projects' : '/project');
      },
      error: (err: unknown) => {
        this.isSubmitting.set(false);
        this.submitError.set(
          err instanceof Error ? err.message : 'Invalid email or password.',
        );
      },
    });
  }
}
