import { FormGroup } from '@angular/forms';
import { ProjectInterface } from '../intefaces/form/project.interface';

/*
 * ──────────────────────────────────────────────────────────────────
 !  Shared helpers for reading/writing ProjectInterface-keyed controls
 *
 *  Used by the project-form wizard steps so each step doesn't
 *  reimplement the same yes/no toggle, stepper and slider logic.
 * ──────────────────────────────────────────────────────────────────
 */

type ProjectFormKey = keyof ProjectInterface;

export function yn(form: FormGroup, key: ProjectFormKey): 'Yes' | 'No' {
  return (form.get(key)?.value as 'Yes' | 'No') ?? 'No';
}

export function setYn(form: FormGroup, key: ProjectFormKey, val: 'Yes' | 'No'): void {
  form.get(key)?.setValue(val);
}

export function numVal(form: FormGroup, key: ProjectFormKey): number {
  return Number(form.get(key)?.value ?? 0);
}

export function increment(form: FormGroup, key: ProjectFormKey): void {
  form.get(key)?.setValue(numVal(form, key) + 1);
}

export function decrement(form: FormGroup, key: ProjectFormKey): void {
  form.get(key)?.setValue(Math.max(0, numVal(form, key) - 1));
}

export function sliderTrack(form: FormGroup, key: ProjectFormKey): string {
  const v = numVal(form, key);
  return `linear-gradient(to right, #6b4e0f ${v}%, #e0e0e0 ${v}%)`;
}

export function hasError(form: FormGroup, key: ProjectFormKey): boolean {
  const ctrl = form.get(key);
  return !!(ctrl?.invalid && ctrl.touched);
}
