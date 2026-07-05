import { Component, input, output } from '@angular/core';
import { FeatureFlagInterface } from '../../../core/intefaces/form/feature-flag.interface';

@Component({
  selector: 'app-flag-toggle',
  standalone: true,
  imports: [],
  templateUrl: './flag-toggle.html',
  styleUrl: './flag-toggle.less',
})
export class FlagToggleComponent {
  flag = input.required<FeatureFlagInterface>();
  value = input<'Yes' | 'No'>('No');

  toggle = output<void>();
}
