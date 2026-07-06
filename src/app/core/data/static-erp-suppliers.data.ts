import erpSuppliersJson from './erp-suppliers.json';

/*
 * ──────────────────────────────────────────────────────────────────
 !  Fixed pick-lists for the ERP System and Supplier dropdowns
 *
 *  Both are closed lists — the project form only lets you choose
 *  one of these, no typing a new one in. Add more here as they
 *  come up; nothing else in the app needs to change.
 * ──────────────────────────────────────────────────────────────────
 */

export const ERP_SYSTEMS: string[] = erpSuppliersJson.erpSystems;

export const SUPPLIERS: string[] = erpSuppliersJson.suppliers;
