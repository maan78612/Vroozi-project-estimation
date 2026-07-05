import { Component, OnInit, inject, input, output } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { FormFieldInterface } from '../../../core/intefaces/form/form-field.interface';
import { FieldTypeEnum } from '../../../core/enums/field-type.enum';
import { ButtonComponent } from '../button/button';

@Component({
  selector: 'app-form',
  imports: [ReactiveFormsModule, ButtonComponent],
  templateUrl: './form.component.html',
  styleUrl: './form.component.less',
})
export class FormComponent implements OnInit {
  private fb = inject(FormBuilder);

  fields = input.required<FormFieldInterface[]>();
  initialValue = input<Record<string, string | number>>({});
  isSubmitting = input(false);
  submitError = input('');
  submitSuccess = input(false);
  successMessage = input('Changes saved.');
  submitLabel = input('Save changes');
  loadingLabel = input('Saving...');
  gridLayout = input(false);

  formSubmit = output<Record<string, string | number>>();

  readonly FieldTypeEnum = FieldTypeEnum;

  /*
   * ──────────────────────────────────────────────────────────────────
   !  Why not initialize the form here like: formGroup = new FormGroup({}) ?
   *
   *  new FormGroup({}) creates a blank form with no fields — useless
   *  because we do not know which fields to add until ngOnInit runs
   *  and this.fields() becomes available.
   *
   *  The ! (Definite Assignment Assertion) tells 
   *  TypeScript: "this will be assigned before first use,
   *  trust me" — so we skip the blank form and build the real one
   *  in ngOnInit once all field definitions are ready.
   * ──────────────────────────────────────────────────────────────────
   */
  formGroup!: FormGroup;

  ngOnInit(): void {
    const initial = this.initialValue();
    const group: Record<string, unknown[]> = {};
    this.fields().forEach((field) => {
      group[field.key] = [initial[field.key] ?? '', field.required ? [Validators.required] : []];
    });
    this.formGroup = this.fb.group(group);
  }

  /*
   * ──────────────────────────────────────────────────────────────────
   !  Should we show a red error under this field right now?
   *
   *  We only show the error when TWO things are both true:
   *    1. The field has a problem  →  ctrl.invalid
   *       (e.g. it's empty but the field is marked required)
   *    2. The user has already visited it  →  ctrl.touched
   *       (they clicked in and then left the field)
   *
   *  Why wait for "touched"?
   *  We don't want to scold the user the moment the page opens —
   *  only after they've had a chance to interact with the field.
   * ──────────────────────────────────────────────────────────────────
   */
  isInvalid(key: string): boolean {
    const ctrl = this.formGroup.get(key);
    return !!ctrl && ctrl.invalid && ctrl.touched;
  }

  onSubmit(): void {
    if (this.formGroup.invalid) {
      this.formGroup.markAllAsTouched();
      return;
    }
    this.formSubmit.emit(this.formGroup.value as Record<string, string | number>);
  }
}
