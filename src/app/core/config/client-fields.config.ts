import { FormFieldInterface } from '../intefaces/form/form-field.interface';
import { FieldTypeEnum } from '../enums/field-type.enum';

/*
 * ──────────────────────────────────────────────────────────────────
 !  Shared "Add/Edit Client Company" field set
 *
 *  Used by the Clients Directory's add/edit dialog and the Add
 *  Project wizard's "+ Add new" client-company shortcut, so both
 *  render the exact same fields instead of drifting apart.
 * ──────────────────────────────────────────────────────────────────
 */
export const CLIENT_COMPANY_FIELDS: FormFieldInterface[] = [
  {
    key: 'name',
    label: 'Client company name',
    type: FieldTypeEnum.Text,
    required: true,
    placeholder: 'e.g. Acme Client Co.',
    icon: 'domain',
    autofocus: true,
  },
  {
    key: 'email',
    label: 'Email',
    type: FieldTypeEnum.Text,
    required: false,
    inputType: 'email',
    placeholder: 'contact@acme.com',
    icon: 'mail',
  },
  {
    key: 'primaryContact',
    label: 'Primary contact',
    type: FieldTypeEnum.Text,
    required: false,
    placeholder: 'e.g. Julian Sterling',
    icon: 'person',
  },
];
