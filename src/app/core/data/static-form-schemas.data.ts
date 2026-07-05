import { FieldTypeEnum } from '../enums/field-type.enum';
import { FormFieldInterface } from '../intefaces/form/form-field.interface';

export const FORM_DATA: FormFieldInterface[] = [
  { key: 'projectName', label: 'Projects', type: FieldTypeEnum.Text, required: true },
  { key: 'erp', label: 'ERP', type: FieldTypeEnum.Text, required: false },
  { key: 'supplier', label: 'Supplier', type: FieldTypeEnum.Text, required: false },
  { key: 'masterDataInterfaces', label: 'Master Data Interface', type: FieldTypeEnum.Number, required: true },
  { key: 'transactionalInterfaces', label: 'Transactional Interfaces', type: FieldTypeEnum.Number, required: true },
  { key: 'customLogic', label: 'Custom Logic', type: FieldTypeEnum.Dropdown, required: true, options: ['Yes', 'No'] },
  { key: 'uiImpact', label: 'UI Impact', type: FieldTypeEnum.Dropdown, required: true, options: ['Yes', 'No'] },
  { key: 'user', label: 'User', type: FieldTypeEnum.Text, required: true },
  { key: 'newApiOrBusinessFlows', label: 'New API Or Business Flows', type: FieldTypeEnum.Dropdown, required: true, options: ['Yes', 'No'] },
  { key: 'integrations', label: 'Integrations', type: FieldTypeEnum.Dropdown, required: true, options: ['Yes', 'No'] },
  { key: 'clientDependency', label: 'Client Dependency', type: FieldTypeEnum.Dropdown, required: true, options: ['Yes', 'No'] },
  { key: 'reportingAnalytics', label: 'Reporting/Analytics', type: FieldTypeEnum.Dropdown, required: true, options: ['Yes', 'No'] },
  { key: 'dataLayer', label: 'Data Layer', type: FieldTypeEnum.Percentage, required: true },
  { key: 'uncertainties', label: 'Uncertainties', type: FieldTypeEnum.Percentage, required: true },
  { key: 'inbound', label: 'Inbound', type: FieldTypeEnum.Number, required: true },
  { key: 'outbound', label: 'Outbound', type: FieldTypeEnum.Number, required: true },
  { key: 'existingErp', label: 'Existing ERP', type: FieldTypeEnum.Dropdown, required: true, options: ['Yes', 'No'] },
  { key: 'hyperCare', label: 'Hyper Care', type: FieldTypeEnum.Dropdown, required: true, options: ['Yes', 'No'] },
  { key: 'tentativeProjectSize', label: 'Tentative Project Size', type: FieldTypeEnum.Text, required: false },
  { key: 'tentativeRangeDays', label: 'Tentative Range (Days)', type: FieldTypeEnum.Text, required: true },
];
