/*
 * ──────────────────────────────────────────────────────────────────
 !  Fixed pick-lists for the ERP System and Supplier dropdowns
 *
 *  Both are closed lists — the project form only lets you choose
 *  one of these, no typing a new one in. Add more here as they
 *  come up; nothing else in the app needs to change.
 * ──────────────────────────────────────────────────────────────────
 */

export const ERP_SYSTEMS: string[] = [
  'SAP S/4HANA',
  'SAP ECC',
  'Oracle Fusion',
  'Oracle EBS',
  'Microsoft D365',
  'NetSuite',
];

export const SUPPLIERS: string[] = [
  'Acme Supplies Ltd',
  'AndesTrade Ltda',
  'AsiaTrade Partners',
  'BrasilVend SA',
  'Daymark Retail',
  'GulfTech LLC',
  'MedSupply Inc',
  'NordicPower AB',
  'Siffron',
  'TechVend Corp',
];
