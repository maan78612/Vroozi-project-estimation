import { Component, inject, OnInit, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { map } from 'rxjs';
import { AuthService } from '../../../../core/services/auth/auth-service';
import { FormComponent } from '../../../../shared/compoments/form/form.component';
import { AppLogoComponent } from '../../../../shared/compoments/app-logo/app-logo.component';
import { SpinnerComponent } from '../../../../shared/compoments/spinner/spinner.component';
import { FormFieldInterface } from '../../../../core/intefaces/form/form-field.interface';
import { FieldTypeEnum } from '../../../../core/enums/field-type.enum';

type TokenStatus = 'checking' | 'valid' | 'invalid';

@Component({
  selector: 'app-reset-password',
  imports: [FormComponent, AppLogoComponent, SpinnerComponent, RouterLink],
  templateUrl: './reset-password.component.html',
  styleUrl: './reset-password.component.less',
})
export class ResetPasswordComponent implements OnInit {
  private authService = inject(AuthService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  private readonly token = toSignal(
    this.route.paramMap.pipe(map((params) => params.get('token') ?? '')),
    { initialValue: this.route.snapshot.paramMap.get('token') ?? '' },
  );

  // Checked once up front so a link that's already been used (or has
  // expired) says so immediately, instead of only failing after the user
  // fills in a new password and hits submit.
  tokenStatus = signal<TokenStatus>('checking');

  ngOnInit(): void {
    this.authService.verifyResetToken(this.token()).subscribe((valid) => {
      this.tokenStatus.set(valid ? 'valid' : 'invalid');
    });
  }

  readonly fields: FormFieldInterface[] = [
    {
      key: 'password',
      label: 'New password',
      type: FieldTypeEnum.Text,
      required: true,
      inputType: 'password',
      placeholder: 'Enter new password',
      minLength: 8,
      icon: 'lock',
      autofocus: true,
    },
    {
      key: 'confirmPassword',
      label: 'Confirm password',
      type: FieldTypeEnum.Text,
      required: true,
      inputType: 'password',
      placeholder: 'Re-enter new password',
      icon: 'lock',
    },
  ];

  isSubmitting = signal(false);
  submitError = signal('');
  submitSuccess = signal(false);

  readonly successMessage = 'Your password has been reset. Redirecting to sign in...';

  onSubmit(value: Record<string, string | number>): void {
    const password = value['password'] as string;
    const confirmPassword = value['confirmPassword'] as string;

    if (password !== confirmPassword) {
      this.submitError.set('Passwords do not match.');
      return;
    }

    this.isSubmitting.set(true);
    this.submitError.set('');
    this.submitSuccess.set(false);

    this.authService.resetPassword(this.token(), password, confirmPassword).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.submitSuccess.set(true);
        setTimeout(() => this.router.navigateByUrl('/login'), 1500);
      },
      error: (err: unknown) => {
        this.isSubmitting.set(false);
        this.submitError.set(
          err instanceof Error ? err.message : 'Could not reset password. Please try again.',
        );
      },
    });
  }
}
