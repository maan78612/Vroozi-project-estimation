import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../../core/services/auth/auth-service';
import { RoleEnum } from '../../../../core/enums/role-enum';
import { STATIC_AUTH_MESSAGES } from '../../../../core/data/static-auth.data';
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
      key: 'username',
      label: 'Username',
      type: FieldTypeEnum.Text,
      required: true,
      placeholder: 'Enter username',
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

    setTimeout(() => {
      const success = this.authService.login(
        value['username'] as string,
        value['password'] as string,
      );

      this.isSubmitting.set(false);

      if (!success) {
        this.submitError.set(STATIC_AUTH_MESSAGES.loginFailed);
        return;
      }

      const role = this.authService.getRole();
      this.router.navigateByUrl(role === RoleEnum.Admin ? '/admin/projects' : '/project');
    }, 800);
  }
}
