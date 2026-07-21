import { FieldTypeEnum } from '../../enums/field-type.enum';

export interface FormFieldInterface {
  key: string;
  label: string;
  type: FieldTypeEnum;
  required: boolean;
  options?: string[];
  inputType?: 'text' | 'password' | 'email' | 'number';
  placeholder?: string;
  // Enforced client-side (Validators.minLength) — only when the field
  // actually has a value, so it's safe on an optional field too (e.g.
  // "leave blank to keep the current password"). Used for NEW passwords
  // being set; deliberately not applied to a "re-enter your existing
  // password to confirm" field like login or Profile's current password,
  // since that value's length was decided under a possibly-older policy.
  minLength?: number;
  // Material Symbols icon name shown inside the field (leading edge).
  icon?: string;
  // Optional link rendered inline with the field's label (e.g. "Forgot password?").
  trailingLink?: { label: string; route: string };
  // Grabs the cursor as soon as the form renders — set on at most one field.
  autofocus?: boolean;
}
