import { FormFieldInterface } from '../intefaces/form/form-field.interface';
import { FieldTypeEnum } from '../enums/field-type.enum';

/*
 * ──────────────────────────────────────────────────────────────────
 !  "Add/Edit Client" field set — a client is a role="client" User
 *  (a real login account), not a separate catalog entity, so this
 *  mirrors EMPLOYEE_FIELDS (users-list.component.ts) exactly.
 *
 *  No password on create — the account starts inactive and the user
 *  gets an emailed "set your password" link (see backend
 *  user.service.createUser). Edit still allows an admin to optionally
 *  set/override a password directly (blank = keep the current one).
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

export const CLIENT_CREATE_FIELDS: FormFieldInterface[] = BASE_CLIENT_FIELDS;

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
    minLength: 8,
  },
];
