import { Component, computed, inject, signal, viewChild } from '@angular/core';
import { AuthService } from '../../../../core/services/auth/auth-service';
import { RoleEnum } from '../../../../core/enums/role-enum';
import { FormComponent } from '../../../../shared/compoments/form/form.component';
import { InitialsPipe } from '../../../../shared/pipes/initials.pipe';
import { FormFieldInterface } from '../../../../core/intefaces/form/form-field.interface';
import { FieldTypeEnum } from '../../../../core/enums/field-type.enum';

/*
 * ──────────────────────────────────────────────────────────────────
 !  My Profile — shared by all three roles (admin / user / client).
 *
 *  Two independent forms against PATCH /auth/me: account details
 *  (name — email stays admin-managed since it's the login id) and
 *  change password (current + new, verified server-side). The session
 *  user is refreshed by AuthService.updateProfile, so the shell
 *  header's name/avatar update immediately on save.
 * ──────────────────────────────────────────────────────────────────
 */

const NAME_FIELDS: FormFieldInterface[] = [
  {
    key: 'name',
    label: 'Full name',
    type: FieldTypeEnum.Text,
    required: true,
    placeholder: 'Your display name',
    icon: 'person',
  },
];

const PASSWORD_FIELDS: FormFieldInterface[] = [
  {
    key: 'currentPassword',
    label: 'Current password',
    type: FieldTypeEnum.Text,
    required: true,
    inputType: 'password',
    placeholder: 'Enter your current password',
    icon: 'lock',
  },
  {
    key: 'newPassword',
    label: 'New password',
    type: FieldTypeEnum.Text,
    required: true,
    inputType: 'password',
    placeholder: 'Minimum 8 characters',
    icon: 'lock_reset',
  },
];

const ROLE_LABELS: Record<RoleEnum, string> = {
  [RoleEnum.Admin]: 'Administrator',
  [RoleEnum.User]: 'Employee',
  [RoleEnum.Client]: 'Client',
};

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [FormComponent, InitialsPipe],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.less',
})
export class ProfileComponent {
  private authService = inject(AuthService);

  readonly nameFields = NAME_FIELDS;
  readonly passwordFields = PASSWORD_FIELDS;

  readonly user = computed(() => this.authService.getCurrentUser());
  readonly roleLabel = computed(() => {
    const role = this.user()?.role;
    return role ? ROLE_LABELS[role] : '';
  });
  readonly nameInitial = computed<Record<string, string>>(() => ({
    name: this.user()?.name ?? '',
  }));

  private readonly passwordForm = viewChild<FormComponent>('passwordForm');

  savingName = signal(false);
  nameError = signal('');
  nameSuccess = signal(false);

  savingPassword = signal(false);
  passwordError = signal('');
  passwordSuccess = signal(false);

  saveName(value: Record<string, string | number>): void {
    const name = (value['name'] as string)?.trim();
    if (!name || name.length < 2) {
      this.nameError.set('Name must be at least 2 characters.');
      return;
    }

    this.savingName.set(true);
    this.nameError.set('');
    this.nameSuccess.set(false);

    this.authService.updateProfile({ name }).subscribe({
      next: () => {
        this.savingName.set(false);
        this.nameSuccess.set(true);
      },
      error: (err: unknown) => {
        this.savingName.set(false);
        this.nameError.set(err instanceof Error ? err.message : 'Could not update your name.');
      },
    });
  }

  savePassword(value: Record<string, string | number>): void {
    const currentPassword = value['currentPassword'] as string;
    const newPassword = value['newPassword'] as string;
    if (!currentPassword || !newPassword) return;
    if (newPassword.length < 8) {
      this.passwordError.set('New password must be at least 8 characters.');
      return;
    }

    this.savingPassword.set(true);
    this.passwordError.set('');
    this.passwordSuccess.set(false);

    this.authService.updateProfile({ currentPassword, newPassword }).subscribe({
      next: () => {
        this.savingPassword.set(false);
        this.passwordSuccess.set(true);
        // Don't leave passwords sitting in the fields after a save.
        this.passwordForm()?.formGroup.reset();
      },
      error: (err: unknown) => {
        this.savingPassword.set(false);
        this.passwordError.set(
          err instanceof Error ? err.message : 'Could not change your password.',
        );
      },
    });
  }
}
