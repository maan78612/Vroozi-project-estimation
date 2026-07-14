import { Component, input, output } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { FeatureFlagInterface } from '../../../../../../core/intefaces/form/feature-flag.interface';
import { ProjectInterface } from '../../../../../../core/intefaces/form/project.interface';
import { UserInterface } from '../../../../../../core/intefaces/user-interface';
import { ProjectSizeEnum } from '../../../../../../core/enums/project-size.enum';
import { numVal, yn } from '../../../../../../core/utils/form-control.util';

@Component({
  selector: 'app-review-submit-step',
  standalone: true,
  templateUrl: './review-submit-step.component.html',
  styleUrl: './review-submit-step.component.less',
})
export class ReviewSubmitStepComponent {
  form = input.required<FormGroup>();
  complexityFlags = input.required<FeatureFlagInterface[]>();
  riskFlags = input.required<FeatureFlagInterface[]>();
  assignableUsers = input<UserInterface[]>([]);
  submitSuccess = input(false);
  submitError = input('');

  edit = output<number>();

  fieldValue(key: keyof ProjectInterface): string {
    return (this.form().get(key)?.value as string) || '—';
  }

  // Who the entry is assigned to. For non-admins the assignable list is
  // empty (admin-only endpoint), so fall back to the signed-in user.
  currentUser = input<UserInterface | null>(null);

  assignedToName(): string {
    const userId = this.form().get('user')?.value as string;
    const match = this.assignableUsers().find((u) => u.id === userId);
    if (match) return match.name;
    const me = this.currentUser();
    return me && me.id === userId ? me.name : '—';
  }

  numVal(key: keyof ProjectInterface): number {
    return numVal(this.form(), key);
  }

  yn(key: FeatureFlagInterface['key']): 'Yes' | 'No' {
    return yn(this.form(), key);
  }

  projectSize(): ProjectSizeEnum | null {
    return (this.form().get('tentativeProjectSize')?.value as ProjectSizeEnum) || null;
  }
}
