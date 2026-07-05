import { Component, input } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { FeatureFlagInterface } from '../../../../../../core/intefaces/form/feature-flag.interface';
import { ProjectInterface } from '../../../../../../core/intefaces/form/project.interface';
import { numVal, setYn, sliderTrack, yn } from '../../../../../../core/utils/form-control.util';
import { FlagToggleComponent } from '../../../../../../shared/compoments/flag-toggle/flag-toggle';

@Component({
  selector: 'app-risk-dependencies-step',
  standalone: true,
  imports: [ReactiveFormsModule, FlagToggleComponent],
  templateUrl: './risk-dependencies-step.component.html',
  styleUrl: './risk-dependencies-step.component.less',
})
export class RiskDependenciesStepComponent {
  form = input.required<FormGroup>();
  flags = input.required<FeatureFlagInterface[]>();

  yn(key: FeatureFlagInterface['key']): 'Yes' | 'No' {
    return yn(this.form(), key);
  }

  toggle(key: FeatureFlagInterface['key']): void {
    setYn(this.form(), key, this.yn(key) === 'Yes' ? 'No' : 'Yes');
  }

  numVal(key: keyof ProjectInterface): number {
    return numVal(this.form(), key);
  }

  sliderTrack(key: keyof ProjectInterface): string {
    return sliderTrack(this.form(), key);
  }
}
