import { FormFieldInterface } from '../intefaces/form/form-field.interface';
import { FieldTypeEnum } from '../enums/field-type.enum';

/*
 * ──────────────────────────────────────────────────────────────────
 !  "Add/Edit Client" field set — a client is a role="client" User
 *  (a real login account), not a separate catalog entity, so this
 *  mirrors EMPLOYEE_FIELDS (users-list.component.ts) exactly.
 *
 *  Password is required on create, optional on edit (blank = keep
 *  the current password) — hence two field sets sharing everything
 *  else.
 * ──────────────────────────────────────────────────────────────────
 */
const BASE_CLIENT_FIELDS: FormFieldInterface[] = [
  {
    key: 'name',
    label: 'Full name',
    type: FieldTypeEnum.Text,
    required: true,
    placeholder: 'e.g. Julian Sterling',
    icon: 'person',
    autofocus: true,
  },
  {
    key: 'email',
    label: 'Email',
    type: FieldTypeEnum.Text,
    required: true,
    inputType: 'email',
    placeholder: 'julian@acme.com',
    icon: 'mail',
  },
];

export const CLIENT_CREATE_FIELDS: FormFieldInterface[] = [
  ...BASE_CLIENT_FIELDS,
  {
    key: 'password',
    label: 'Password',
    type: FieldTypeEnum.Text,
    required: true,
    inputType: 'password',
    placeholder: 'Minimum 8 characters',
    icon: 'lock',
  },
];

export const CLIENT_EDIT_FIELDS: FormFieldInterface[] = [
  ...BASE_CLIENT_FIELDS,
  {
    key: 'password',
    label: 'Password',
    type: FieldTypeEnum.Text,
    required: false,
    inputType: 'password',
    placeholder: 'Leave blank to keep the current password',
    icon: 'lock',
  },
];
