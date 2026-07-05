import { Component, input } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { FeatureFlagInterface } from '../../../../../../core/intefaces/form/feature-flag.interface';
import { setYn, yn } from '../../../../../../core/utils/form-control.util';
import { FlagToggleComponent } from '../../../../../../shared/compoments/flag-toggle/flag-toggle';

@Component({
  selector: 'app-complexity-factors-step',
  standalone: true,
  imports: [FlagToggleComponent],
  templateUrl: './complexity-factors-step.component.html',
  styleUrl: './complexity-factors-step.component.less',
})
export class ComplexityFactorsStepComponent {
  form = input.required<FormGroup>();
  flags = input.required<FeatureFlagInterface[]>();

  yn(key: FeatureFlagInterface['key']): 'Yes' | 'No' {
    return yn(this.form(), key);
  }

  toggle(key: FeatureFlagInterface['key']): void {
    setYn(this.form(), key, this.yn(key) === 'Yes' ? 'No' : 'Yes');
  }
}
