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
  clients = input<UserInterface[]>([]);
  submitSuccess = input(false);
  submitError = input('');

  edit = output<number>();

  fieldValue(key: keyof ProjectInterface): string {
    return (this.form().get(key)?.value as string) || '—';
  }

  tentativeRangeDisplay(): string {
    const value = this.fieldValue('tentativeRangeDays');
    return value === '—' ? value : `${value} days`;
  }

  // AI-assisted estimate — only meaningful once an admin has set a
  // non-zero efficiency % (see AiSettingsComponent); see aiPercentage().
  aiEstimatedRangeDisplay(): string {
    const value = this.fieldValue('aiEstimatedRangeDays');
    return value === '—' ? value : `${value} days`;
  }

  aiPercentage(): number {
    return this.numVal('aiEfficiencyPercentage');
  }

  // Who the entry is assigned to. For non-admins the assignable list is
  // empty (admin-only endpoint), so fall back to the signed-in user, then
  // to the owner name the API already populated onto the loaded entry —
  // needed for a client-user, who is reviewing someone else's project and
  // has no access to the employee directory to resolve the id otherwise.
  currentUser = input<UserInterface | null>(null);
  ownerName = input<string | null>(null);

  assignedToName(): string {
    const userId = this.form().get('user')?.value as string;
    const match = this.assignableUsers().find((u) => u.id === userId);
    if (match) return match.name;
    const me = this.currentUser();
    if (me && me.id === userId) return me.name;
    return this.ownerName() ?? '—';
  }

  // Which client this project is for — `client` on the form is the
  // client-user's id, so resolve it to a display name the same way
  // assignedToName() does for the employee.
  clientName(): string {
    const clientId = this.form().get('client')?.value as string;
    if (!clientId) return '—';
    const match = this.clients().find((c) => c.id === clientId);
    return match?.name ?? '—';
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
