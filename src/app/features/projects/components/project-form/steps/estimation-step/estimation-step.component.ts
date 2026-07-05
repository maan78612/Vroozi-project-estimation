import { Component, input } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ProjectInterface } from '../../../../../../core/intefaces/form/project.interface';
import { ProjectSizeEnum } from '../../../../../../core/enums/project-size.enum';
import { hasError } from '../../../../../../core/utils/form-control.util';
import { RangeSliderComponent } from '../../../../../../shared/compoments/range-slider/range-slider.component';

@Component({
  selector: 'app-estimation-step',
  standalone: true,
  imports: [ReactiveFormsModule, RangeSliderComponent],
  templateUrl: './estimation-step.component.html',
  styleUrl: './estimation-step.component.less',
})
export class EstimationStepComponent {
  form = input.required<FormGroup>();

  hasError(key: keyof ProjectInterface): boolean {
    return hasError(this.form(), key);
  }

  projectSize(): ProjectSizeEnum | null {
    return (this.form().get('tentativeProjectSize')?.value as ProjectSizeEnum) || null;
  }
}
