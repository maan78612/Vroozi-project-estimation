/*
 * ──────────────────────────────────────────────────────────────────
 !  Compact single-page edit form — reusable, self-contained
 *
 *  Renders the whole "Edit Estimation" page (header, banners, the
 *  four field sections and the sticky live effort sidebar) for a
 *  single supplier entry. Deliberately does NOT reuse the wizard's
 *  step components (ProjectBasicsStepComponent etc.) — those render
 *  big spacious cards built for the multi-step wizard, whereas this
 *  page uses a much denser 2-column / single-row layout. It binds
 *  straight to the FormGroup its parent (ProjectFormComponent) built,
 *  the same way the step components do.
 * ──────────────────────────────────────────────────────────────────
 */
import { Component, input, output } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { FeatureFlagInterface } from '../../../../core/intefaces/form/feature-flag.interface';
import { ProjectInterface } from '../../../../core/intefaces/form/project.interface';
import { UserInterface } from '../../../../core/intefaces/user-interface';
import { ProjectSizeEnum } from '../../../../core/enums/project-size.enum';
import { EstimateBreakdown } from '../../../../core/utils/estimate.util';
import {
  decrement,
  hasError,
  increment,
  numVal,
  setYn,
  sliderTrack,
  yn,
} from '../../../../core/utils/form-control.util';
import {
  SearchDropdownComponent,
  SearchDropdownOption,
} from '../../../../shared/compoments/search-dropdown/search-dropdown.component';
import { SpinnerComponent } from '../../../../shared/compoments/spinner/spinner.component';

@Component({
  selector: 'app-edit-project-form',
  standalone: true,
  imports: [ReactiveFormsModule, SearchDropdownComponent, SpinnerComponent],
  templateUrl: './edit-project-form.component.html',
  styleUrl: './edit-project-form.component.less',
})
export class EditProjectFormComponent {
  form = input.required<FormGroup>();
  loading = input(false);
  isAdmin = input(false);
  assignableUsers = input<UserInterface[]>([]);
  erps = input<string[]>([]);
  suppliers = input<string[]>([]);
  clientCompanies = input<string[]>([]);
  complexityFlags = input.required<FeatureFlagInterface[]>();
  riskFlags = input.required<FeatureFlagInterface[]>();
  estimateBreakdown = input<EstimateBreakdown | null>(null);
  estimateSize = input<ProjectSizeEnum | null>(null);
  isSubmitting = input(false);
  submitError = input('');
  submitSuccess = input(false);

  back = output<void>();
  save = output<void>();
  addErpRequested = output<void>();
  addSupplierRequested = output<void>();

  readonly erpOptions = () =>
    this.erps().map((name): SearchDropdownOption => ({ id: name, label: name }));
  readonly supplierOptions = () =>
    this.suppliers().map((name): SearchDropdownOption => ({ id: name, label: name }));
  readonly clientCompanyOptions = () =>
    this.clientCompanies().map((name): SearchDropdownOption => ({ id: name, label: name }));
  readonly employeeOptions = () =>
    this.assignableUsers().map(
      (u): SearchDropdownOption => ({ id: u.id, label: u.name, sublabel: u.email }),
    );

  hasError(key: keyof ProjectInterface): boolean {
    return hasError(this.form(), key);
  }

  numVal(key: keyof ProjectInterface): number {
    return numVal(this.form(), key);
  }

  increment(key: keyof ProjectInterface): void {
    increment(this.form(), key);
  }

  decrement(key: keyof ProjectInterface): void {
    decrement(this.form(), key);
  }

  yn(key: FeatureFlagInterface['key']): 'Yes' | 'No' {
    return yn(this.form(), key);
  }

  setFlag(key: FeatureFlagInterface['key'], val: 'Yes' | 'No'): void {
    setYn(this.form(), key, val);
  }

  sliderTrack(key: keyof ProjectInterface): string {
    return sliderTrack(this.form(), key);
  }

  // Mockup shows the 0–100 stored value as an "X/10" dial — display-only,
  // the underlying value/validators/estimate math all stay 0–100.
  tenthsVal(key: keyof ProjectInterface): number {
    return Math.round(this.numVal(key) / 10);
  }

  onSubmit(): void {
    this.save.emit();
  }
}
