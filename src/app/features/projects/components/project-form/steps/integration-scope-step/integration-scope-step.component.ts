import { Component, input } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { ProjectInterface } from '../../../../../../core/intefaces/form/project.interface';
import { decrement, increment, numVal } from '../../../../../../core/utils/form-control.util';

@Component({
  selector: 'app-integration-scope-step',
  standalone: true,
  imports: [],
  templateUrl: './integration-scope-step.component.html',
  styleUrl: './integration-scope-step.component.less',
})
export class IntegrationScopeStepComponent {
  form = input.required<FormGroup>();

  numVal(key: keyof ProjectInterface): number {
    return numVal(this.form(), key);
  }

  increment(key: keyof ProjectInterface): void {
    increment(this.form(), key);
  }

  decrement(key: keyof ProjectInterface): void {
    decrement(this.form(), key);
  }
}
