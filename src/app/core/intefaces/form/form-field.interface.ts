import { FieldTypeEnum } from '../../enums/field-type.enum';

export interface FormFieldInterface {
  key: string;
  label: string;
  type: FieldTypeEnum;
  required: boolean;
  options?: string[];
  inputType?: 'text' | 'password' | 'email' | 'number';
  placeholder?: string;
}
