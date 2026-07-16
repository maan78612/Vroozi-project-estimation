import { FieldTypeEnum } from '../../enums/field-type.enum';

export interface FormFieldInterface {
  key: string;
  label: string;
  type: FieldTypeEnum;
  required: boolean;
  options?: string[];
  inputType?: 'text' | 'password' | 'email' | 'number';
  placeholder?: string;
  // Material Symbols icon name shown inside the field (leading edge).
  icon?: string;
  // Optional link rendered inline with the field's label (e.g. "Forgot password?").
  trailingLink?: { label: string; route: string };
  // Grabs the cursor as soon as the form renders — set on at most one field.
  autofocus?: boolean;
}
