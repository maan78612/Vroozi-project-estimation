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

  assignedToName(): string {
    const username = this.form().get('user')?.value as string;
    const match = this.assignableUsers().find((u) => u.username === username);
    return match ? (match.fullName || match.username) : username || '—';
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
