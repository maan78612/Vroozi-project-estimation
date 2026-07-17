/*
 * ──────────────────────────────────────────────────────────────────
 !  Multi-step project estimation form
 *
 *  Each submission saves ONE supplier entry.
 *  Creating offers two modes: start a new project, or add a supplier
 *  to an existing project — the rest of the form is the same.
 *  Admins can assign/reassign entries to an employee; employees can
 *  only edit entries currently assigned to them.
 * ──────────────────────────────────────────────────────────────────
 */

import { Component, ElementRef, HostListener, ViewChild, computed, effect, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../../../core/services/auth/auth-service';
import { UsersService } from '../../../../core/services/users/users-service';
import { ErpsService } from '../../../../core/services/erps/erps-service';
import { SuppliersService } from '../../../../core/services/suppliers/suppliers-service';
import { ClientUsersService } from '../../../../core/services/client-users/client-users-service';
import { ProjectsStoreService } from '../../../../core/services/projects/projects-store.service';
import { RoleService } from '../../../../core/services/role/role-service';
import { COMPLEXITY_FLAGS, RISK_FLAGS } from '../../../../core/config/feature-flags.config';
import { CLIENT_CREATE_FIELDS } from '../../../../core/config/client-fields.config';
import { ProjectInterface, YesNo } from '../../../../core/intefaces/form/project.interface';
import { FormFieldInterface } from '../../../../core/intefaces/form/form-field.interface';
import { FieldTypeEnum } from '../../../../core/enums/field-type.enum';
import { ProjectSizeEnum } from '../../../../core/enums/project-size.enum';
import { estimateProjectSize } from '../../../../core/utils/project-size.util';
import { EstimateBreakdown, estimateRangeDays } from '../../../../core/utils/estimate.util';
import { AddOptionDialogComponent } from '../../../../shared/compoments/add-option-dialog/add-option-dialog.component';
import { EditProjectFormComponent } from '../edit-project-form/edit-project-form.component';
import { ProjectBasicsStepComponent } from './steps/project-basics-step/project-basics-step.component';
import { IntegrationScopeStepComponent } from './steps/integration-scope-step/integration-scope-step.component';
import { ComplexityFactorsStepComponent } from './steps/complexity-factors-step/complexity-factors-step.component';
import { RiskDependenciesStepComponent } from './steps/risk-dependencies-step/risk-dependencies-step.component';
import { ReviewSubmitStepComponent } from './steps/review-submit-step/review-submit-step.component';

@Component({
  selector: 'app-project-form',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    AddOptionDialogComponent,
    EditProjectFormComponent,
    ProjectBasicsStepComponent,
    IntegrationScopeStepComponent,
    ComplexityFactorsStepComponent,
    RiskDependenciesStepComponent,
    ReviewSubmitStepComponent,
  ],
  templateUrl: './project-form.component.html',
  styleUrl: './project-form.component.less',
})
export class ProjectFormComponent {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private authService = inject(AuthService);
  private usersService = inject(UsersService);
  private erpsService = inject(ErpsService);
  private suppliersService = inject(SuppliersService);
  private clientUsersService = inject(ClientUsersService);
  private projectsStore = inject(ProjectsStoreService);
  private roleService = inject(RoleService);
  private fb = inject(FormBuilder);
  // Scopes the outside-click check below to just the step header — the
  // component's own host element is the whole wizard page, so "outside
  // the host" would almost never be true.
  @ViewChild('stepHeader') private stepHeader?: ElementRef<HTMLElement>;

  /*
   * ──────────────────────────────────────────────────────────────────
   !  Wizard step metadata
   * ──────────────────────────────────────────────────────────────────
   */
  readonly stepMeta = [
    { title: 'Project Basics', subtitle: 'Name the project and identify the ERP system', icon: 'info' },
    { title: 'Integration Scope', subtitle: 'Count the interfaces and connection directions', icon: 'hub' },
    { title: 'Complexity Factors', subtitle: 'Flag the technical complexity drivers', icon: 'psychology' },
    { title: 'Risk & Dependencies', subtitle: 'Quantify uncertainty and external dependencies', icon: 'warning' },
    { title: 'Review & Submit', subtitle: 'Confirm everything looks right before saving', icon: 'fact_check' },
  ];

  readonly totalSteps = this.stepMeta.length;

  /*
   * ──────────────────────────────────────────────────────────────────
   !  Fields validated before advancing each step
   *
   * Yes/No fields are optional toggles and are not listed here.
   * These are list of required fields for each step,

   * ──────────────────────────────────────────────────────────────────
   */
  private readonly stepRequiredFields: (keyof ProjectInterface)[][] = [
    ['projectName', 'user', 'erp'],
    ['masterDataInterfaces', 'transactionalInterfaces', 'inbound', 'outbound'],
    [],
    ['dataLayer', 'uncertainties'],
    [],
  ];

  // Step 3 (complexity) and step 4 (risk) toggle definitions — shared with the project list cards.
  readonly complexityFlags = COMPLEXITY_FLAGS;
  readonly riskFlags = RISK_FLAGS;

  /*
   * ──────────────────────────────────────────────────────────────────
   !  Reactive form : all fields are initialized with default values and validators
   * ──────────────────────────────────────────────────────────────────
   */
  readonly form = this.fb.group({
    projectName: ['', [Validators.required, Validators.minLength(2)]],
    erp: ['', [Validators.required]],
    supplier: [''],
    // Admin-editable only — see the basics step template.
    client: [''],
    user: ['', [Validators.required]],
    masterDataInterfaces: [0, [Validators.required, Validators.min(0)]],
    transactionalInterfaces: [0, [Validators.required, Validators.min(0)]],
    inbound: [0, [Validators.required, Validators.min(0)]],
    outbound: [0, [Validators.required, Validators.min(0)]],
    customLogic: ['No'],
    uiImpact: ['No'],
    newApiOrBusinessFlows: ['No'],
    integrations: ['No'],
    existingErp: ['No'],
    hyperCare: ['No'],
    clientDependency: ['No'],
    reportingAnalytics: ['No'],
    dataLayer: [10, [Validators.required, Validators.min(0), Validators.max(100)]],
    uncertainties: [10, [Validators.required, Validators.min(0), Validators.max(100)]],
    // Derived, never typed — see recomputeEstimate().
    tentativeRangeDays: [''],
    tentativeProjectSize: [null as ProjectSizeEnum | null],
  });

  /*
   * ──────────────────────────────────────────────────────────────────
   !  Component state signals variables:
   * ──────────────────────────────────────────────────────────────────
   */
  private readonly _routeKey = this.route.snapshot.paramMap.get('key');
  // Which supplier row of the project is being edited (may be empty).
  private readonly _routeSupplier = this.route.snapshot.queryParamMap.get('supplier') ?? '';

  currentStep = signal(0);
  // Mobile-only: the sidebar step drawer collapses into a compact
  // "Step X of N" toggle below tablet width (see project-form.component.less)
  // — this is whether its tap-to-expand step list is open.
  mobileStepListOpen = signal(false);
  editingProject = signal<ProjectInterface | null>(null);
  loadError = signal('');
  isSubmitting = signal(false);
  submitError = signal('');
  submitSuccess = signal(false);

  // Create mode: brand-new project, or another supplier for an existing one.
  entryMode = signal<'new' | 'existing'>('new');

  // Live estimate breakdown — the Review step and the Edit page's sticky
  // sidebar both read this; recomputed on every form change (see constructor).
  readonly estimateBreakdown = signal<EstimateBreakdown | null>(null);
  readonly estimateSize = computed(() =>
    estimateProjectSize(this.estimateBreakdown()?.range ?? ''),
  );

  /*
   * ──────────────────────────────────────────────────────────────────
   !  "+ Add new" dialog for the ERP / Supplier / Client pick-lists
   *  (admin only; the API rejects the call for anyone else). Which
   *  list is being added to (null = dialog closed), plus request
   *  progress/error. Only offered from the create wizard's basics step
   *  (see project-basics-step.component.html) — not from the edit form.
   * ──────────────────────────────────────────────────────────────────
   */
  addOptionTarget = signal<'erp' | 'supplier' | 'client' | null>(null);
  addOptionSaving = signal(false);
  addOptionError = signal('');

  /*
   * ──────────────────────────────────────────────────────────────────
   ! Computed Signals: because these values are derived from other signals,
   * they are automatically updated when their dependencies change.
   * but we cannot change them directly, because they are computed
   * [!!this._routeKey] means that if there is a route key, we are editing
   * an existing project rather than creating a new one.
   * ──────────────────────────────────────────────────────────────────
   */

  // * !! at this._routeKey is used for converting a value to a boolean.

  readonly isEditMode = computed(() => !!this._routeKey);

  readonly isAdmin = this.roleService.isAdmin;
  readonly isClient = this.roleService.isClient;
  readonly currentUser = computed(() => this.authService.getCurrentUser());
  readonly username = computed(() => this.currentUser()?.name ?? '');
  private readonly currentUserId = computed(() => this.currentUser()?.id ?? '');
  readonly isLastStep = computed(() => this.currentStep() === this.totalSteps - 1);

  // Employees a project can be assigned/reassigned to — admin-only concern, loaded from the API.
  readonly assignableUsers = this.usersService.assignableUsers;

  // Dropdown pick-lists, loaded from the API (GET /erps, GET /suppliers, GET /users?role=client).
  readonly erps = this.erpsService.erps;
  readonly suppliers = this.suppliersService.suppliers;
  readonly clients = this.clientUsersService.clientUsers;

  // Edit mode waits for the store before it can populate the form.
  readonly projectsLoading = this.projectsStore.loading;

  // Project names for the "add supplier to existing project" dropdown.
  readonly existingProjects = this.projectsStore.projectNames;

  /*
   * ──────────────────────────────────────────────────────────────────
   *  autopopulated the form when we are in edit mode, either via route param or user role
   * ──────────────────────────────────────────────────────────────────
   */
  constructor() {
    // Tentative range + size are fully derived from the fields below — never
    // typed directly. Recomputed on every change; emitEvent:false on both
    // targets means this can't loop back into itself.
    this.form.valueChanges.subscribe(() => this.recomputeEstimate());
    this.recomputeEstimate();

    // "Existing project" mode: picking a project auto-fills its ERP as a
    // convenience (still editable). Re-fires on every distinct pick, and
    // is a no-op in 'new' mode or when the field is cleared.
    //
    // Client is different: it's not just a convenience default, it's
    // locked to whatever was set on the project's first supplier entry
    // and can't be changed here. Client-role visibility is scoped
    // per-document (project.client, see project.service.ts) — a later
    // entry saved with a different client would silently vanish from
    // part of "their" project, so every entry sharing a projectName must
    // carry the same client. (Still editable from the edit form, which
    // changes it on all — see edit-project-form.component.ts.)
    this.form.get('projectName')?.valueChanges.subscribe((name) => {
      if (this.entryMode() !== 'existing' || !name) return;
      const first = this.projectsStore.entriesFor(name)[0];
      if (!first) return;
      this.form.get('erp')?.setValue(first.erp);
      this.form.get('client')?.setValue(first.client ?? '');
      this.form.get('client')?.disable();
    });

    // The store feeds edit-mode lookups and the "existing project" dropdown.
    this.projectsStore.load();
    // ERP + Supplier pick-lists for the basics step.
    this.erpsService.load();
    this.suppliersService.load();
    // Client + assignee dropdowns are fed by admin-only endpoints — the
    // call would just 403 for employees/clients, who see read-only text
    // instead of these dropdowns anyway.
    if (this.isAdmin()) {
      this.clientUsersService.load();
      this.usersService.load();
    }

    /*
     * Employees don't get to reassign their own project — lock the field
     * to themselves. Client-users must NOT be locked here: they aren't
     * the project's owner (an employee is), so forcing `user` to their
     * own id would silently steal ownership away from the real employee
     * on save. The "Assigned To" control isn't even rendered for either
     * role (admin-only in the basics step), so for a client the form
     * simply keeps whatever `user` was patched in from the loaded entry.
     */
    if (this.roleService.isUser()) {
      this.form.get('user')?.setValue(this.currentUserId());
    }

    /*
     * "Add New Supplier" from the project view page arrives here as
     * ?project=<name> (create mode only — edit mode already has its own
     * key). Preselects "existing project" mode with that project chosen,
     * same as picking it manually from the dropdown.
     */
    if (!this.isEditMode()) {
      const projectParam = this.route.snapshot.queryParamMap.get('project');
      if (projectParam) {
        this.setEntryMode('existing');
        this.form.get('projectName')?.setValue(projectParam);
      }
    }

    effect(() => {
      const p = this.editingProject();
      if (!p) return;
      /*
       * patchValue = auto-populate the form fields with this project's
       * saved values, so in edit mode the user sees existing data instead
       * of typing everything again. It only fills the fields listed here
       * and leaves any field not mentioned (e.g. tentativeProjectSize)
       * untouched — unlike setValue, which demands a value for EVERY
       * field and throws an error if one is missing.
       */
      this.form.patchValue({
        projectName: p.projectName ?? '',
        erp: p.erp ?? '',
        supplier: p.supplier ?? '',
        client: p.client ?? '',
        user: p.user ?? '',
        masterDataInterfaces: p.masterDataInterfaces ?? 0,
        transactionalInterfaces: p.transactionalInterfaces ?? 0,
        inbound: p.inbound ?? 0,
        outbound: p.outbound ?? 0,
        customLogic: p.customLogic ?? 'No',
        uiImpact: p.uiImpact ?? 'No',
        newApiOrBusinessFlows: p.newApiOrBusinessFlows ?? 'No',
        integrations: p.integrations ?? 'No',
        existingErp: p.existingErp ?? 'No',
        hyperCare: p.hyperCare ?? 'No',
        clientDependency: p.clientDependency ?? 'No',
        reportingAnalytics: p.reportingAnalytics ?? 'No',
        dataLayer: p.dataLayer ?? 10,
        uncertainties: p.uncertainties ?? 10,
      });
    });

    // Edit mode: look the project up once the store has finished loading.
    // No route key means a brand-new project — form starts blank.
    effect(() => {
      if (!this._routeKey || this.editingProject()) return;
      if (this.projectsStore.loading()) return;
      this.loadProjectByKey(this._routeKey);
    });
  }

  /*
   * ──────────────────────────────────────────────────────────────────
   !  Tentative range + size — no longer entered on an Estimation step;
   *  derived client-side so the Review step can show it immediately.
   * ──────────────────────────────────────────────────────────────────
   */
  private recomputeEstimate(): void {
    const raw = this.form.getRawValue();
    const breakdown = estimateRangeDays({
      masterDataInterfaces: raw.masterDataInterfaces ?? 0,
      transactionalInterfaces: raw.transactionalInterfaces ?? 0,
      customLogic: (raw.customLogic ?? 'No') as YesNo,
      uiImpact: (raw.uiImpact ?? 'No') as YesNo,
      newApiOrBusinessFlows: (raw.newApiOrBusinessFlows ?? 'No') as YesNo,
      integrations: (raw.integrations ?? 'No') as YesNo,
      clientDependency: (raw.clientDependency ?? 'No') as YesNo,
      reportingAnalytics: (raw.reportingAnalytics ?? 'No') as YesNo,
      dataLayer: raw.dataLayer ?? 0,
      uncertainties: raw.uncertainties ?? 0,
      existingErp: (raw.existingErp ?? 'No') as YesNo,
      hyperCare: (raw.hyperCare ?? 'No') as YesNo,
    });

    this.estimateBreakdown.set(breakdown);
    this.form.get('tentativeRangeDays')?.setValue(breakdown.range, { emitEvent: false });
    this.form
      .get('tentativeProjectSize')
      ?.setValue(estimateProjectSize(breakdown.range), { emitEvent: false });
  }

  /*
   * ──────────────────────────────────────────────────────────────────
   * ----------------------- Data loading ----------------------------
   * ──────────────────────────────────────────────────────────────────
   */
  private loadProjectByKey(key: string): void {
    const decoded = decodeURIComponent(key);

    // Avoid an extra lookup when we already have the entry in memory
    // (passed via router state from the list page's "edit" action).
    const stateProject = this.router.lastSuccessfulNavigation()?.extras?.state?.['project'] as
      ProjectInterface | undefined;

    const found =
      stateProject &&
      stateProject.projectName === decoded &&
      stateProject.supplier === this._routeSupplier
        ? stateProject
        : this.projectsStore.getByKey(decoded, this._routeSupplier);

    if (!found) {
      this.loadError.set('This project entry could not be found.');
      return;
    }
    /*
     * Defense-in-depth re-check in case the in-memory store is stale
     * (e.g. reassigned after it loaded, but before this click) — the
     * actual authorization already happened on the server. Each role
     * is scoped by a different field, so each gets its own check.
     */
    if (this.isClient()) {
      if (found.client !== this.currentUserId()) {
        this.loadError.set('This project is no longer assigned to you.');
        return;
      }
    } else if (!this.isAdmin() && found.user !== this.currentUserId()) {
      this.loadError.set('This project is no longer assigned to you.');
      return;
    }
    /*
     * Non-admins see the name but can't change it (renaming would split
     * this entry out of its project group — the backend strips the field
     * from their updates too, this just makes the form honest about it).
     * getRawValue() in onSubmit still reads disabled controls, so the
     * rest of the payload is unaffected.
     */
    if (!this.isAdmin()) {
      this.form.get('projectName')?.disable({ emitEvent: false });
    }
    this.editingProject.set(found);
  }

  /*
   * ──────────────────────────────────────────────────────────────────
   !  "+ Add new" ERP / Supplier / Client — opened from the basics step.
   *  On success the created value is selected in the matching field.
   * ──────────────────────────────────────────────────────────────────
   */
  openAddOption(target: 'erp' | 'supplier' | 'client'): void {
    this.addOptionError.set('');
    this.addOptionTarget.set(target);
  }

  closeAddOption(): void {
    if (this.addOptionSaving()) return;
    this.addOptionTarget.set(null);
  }

  // Copy for the "+ Add new" dialog — one small lookup instead of a
  // three-way ternary repeated across the template for every field.
  // `fields` is a single-element FormFieldInterface[] — <app-form>
  // (via the generalized AddOptionDialogComponent) renders it the
  // same way it renders any other form. Client reuses CLIENT_CREATE_FIELDS
  // (name/email/password) since it creates a real login account, not
  // just a pick-list name.
  private static readonly ADD_OPTION_COPY: Record<
    'erp' | 'supplier' | 'client',
    { title: string; subtitle: string; fields: FormFieldInterface[] }
  > = {
    erp: {
      title: 'Add ERP System',
      subtitle: 'It becomes selectable in every project estimation.',
      fields: [
        {
          key: 'name',
          label: 'ERP system name',
          type: FieldTypeEnum.Text,
          required: true,
          placeholder: 'e.g. SAP S/4HANA',
          autofocus: true,
        },
      ],
    },
    supplier: {
      title: 'Add Supplier',
      subtitle: 'It becomes selectable in every supplier entry.',
      fields: [
        {
          key: 'name',
          label: 'Supplier name',
          type: FieldTypeEnum.Text,
          required: true,
          placeholder: 'e.g. Daymark Retail',
          autofocus: true,
        },
      ],
    },
    client: {
      title: 'Add Client',
      subtitle: 'Creates a login account — the client can sign in immediately.',
      fields: CLIENT_CREATE_FIELDS,
    },
  };

  readonly addOptionCopy = computed(() => {
    const target = this.addOptionTarget();
    return target ? ProjectFormComponent.ADD_OPTION_COPY[target] : null;
  });

  saveAddOption(value: Record<string, string | number>): void {
    const target = this.addOptionTarget();
    if (!target) return;

    if (target === 'client') {
      const name = (value['name'] as string)?.trim();
      const email = (value['email'] as string)?.trim();
      const password = (value['password'] as string) ?? '';
      if (!name || !email || !password) return;

      this.addOptionSaving.set(true);
      this.addOptionError.set('');

      this.clientUsersService.create({ name, email, password }).subscribe({
        next: (created) => {
          this.addOptionSaving.set(false);
          this.addOptionTarget.set(null);
          // Convenience: what you just added is what you meant to pick —
          // the field stores the client's id, not their name.
          this.form.get('client')?.setValue(created.id);
        },
        error: (err: unknown) => {
          this.addOptionSaving.set(false);
          this.addOptionError.set(
            err instanceof Error ? err.message : 'Could not save. Please try again.',
          );
        },
      });
      return;
    }

    const name = (value['name'] as string)?.trim();
    if (!name) return;

    this.addOptionSaving.set(true);
    this.addOptionError.set('');

    const create$ = target === 'erp' ? this.erpsService.create(name) : this.suppliersService.create(name);

    create$.subscribe({
      next: (created) => {
        this.addOptionSaving.set(false);
        this.addOptionTarget.set(null);
        // Convenience: what you just added is what you meant to pick.
        this.form.get(target)?.setValue(created);
      },
      error: (err: unknown) => {
        this.addOptionSaving.set(false);
        this.addOptionError.set(
          err instanceof Error ? err.message : 'Could not save. Please try again.',
        );
      },
    });
  }

  /*
   * ──────────────────────────────────────────────────────────────────
   !  Create-mode selection: new project vs supplier for an existing one
   * ──────────────────────────────────────────────────────────────────
   */
  setEntryMode(mode: 'new' | 'existing'): void {
    if (this.entryMode() === mode) return;
    this.entryMode.set(mode);
    // The name field switches between free text and the project dropdown.
    this.form.get('projectName')?.setValue('');
    // Release the client lock from a previous 'existing' pick (see the
    // projectName subscription above) — re-locked once a project is
    // chosen again, left editable in 'new' mode.
    this.form.get('client')?.enable();
  }

  /*
   * ──────────────────────────────────────────────────────────────────
   !  Wizard () navigation
   * ──────────────────────────────────────────────────────────────────
   */
  nextStep(): void {
    // Touch this step's required fields so their errors become visible
    const required = this.stepRequiredFields[this.currentStep()];
    required.forEach((key) => this.form.get(key)?.markAsTouched());
    // Block advancing while any required field on this step is invalid
    if (required.some((key) => this.form.get(key)?.invalid)) return;

    // Advance one step, capped at the last step
    this.currentStep.update((s) => Math.min(s + 1, this.totalSteps - 1));
    window.scrollTo(0, 0);
  }

  prevStep(): void {
    // Go back one step, floored at the first step
    this.currentStep.update((s) => Math.max(s - 1, 0));
    window.scrollTo(0, 0);
  }

  goToStep(index: number): void {
    // Only allow jumping backward to an already-completed step
    if (index < this.currentStep()) {
      this.currentStep.set(index);
      window.scrollTo(0, 0);
    }
    this.mobileStepListOpen.set(false);
  }

  toggleMobileStepList(): void {
    this.mobileStepListOpen.update((open) => !open);
  }

  // Outside click / Escape close the mobile step list, same pattern as
  // SearchDropdownComponent — there's otherwise no way to dismiss it
  // without picking a step.
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (
      this.mobileStepListOpen() &&
      !this.stepHeader?.nativeElement.contains(event.target as Node)
    ) {
      this.mobileStepListOpen.set(false);
    }
  }

  @HostListener('document:keydown.escape')
  onDocumentEscape(): void {
    this.mobileStepListOpen.set(false);
  }

  /*
   * ──────────────────────────────────────────────────────────────────
   !  Header actions
   * ──────────────────────────────────────────────────────────────────
   */
  onBack(): void {
    this.router.navigateByUrl(this.isAdmin() ? '/admin/projects' : '/project');
  }

  signOut(): void {
    this.authService.logout();
    this.router.navigateByUrl('/login');
  }

  /*
   * ──────────────────────────────────────────────────────────────────
   !  Form submit
   * ──────────────────────────────────────────────────────────────────
   */
  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.getRawValue();
    const entry: ProjectInterface = {
      projectName: (raw.projectName ?? '').trim(),
      erp: raw.erp ?? '',
      supplier: (raw.supplier ?? '').trim(),
      client: raw.client ?? '',
      user: raw.user ?? '',
      masterDataInterfaces: raw.masterDataInterfaces ?? 0,
      transactionalInterfaces: raw.transactionalInterfaces ?? 0,
      customLogic: (raw.customLogic ?? 'No') as YesNo,
      uiImpact: (raw.uiImpact ?? 'No') as YesNo,
      newApiOrBusinessFlows: (raw.newApiOrBusinessFlows ?? 'No') as YesNo,
      integrations: (raw.integrations ?? 'No') as YesNo,
      clientDependency: (raw.clientDependency ?? 'No') as YesNo,
      reportingAnalytics: (raw.reportingAnalytics ?? 'No') as YesNo,
      dataLayer: raw.dataLayer ?? 0,
      uncertainties: raw.uncertainties ?? 0,
      inbound: raw.inbound ?? 0,
      outbound: raw.outbound ?? 0,
      existingErp: (raw.existingErp ?? 'No') as YesNo,
      hyperCare: (raw.hyperCare ?? 'No') as YesNo,
      tentativeRangeDays: raw.tentativeRangeDays ?? '',
      tentativeProjectSize: raw.tentativeProjectSize ?? undefined,
    };

    const editing = this.editingProject();

    // Block a second entry with the same project + supplier combination.
    const duplicate = this.projectsStore.getByKey(entry.projectName, entry.supplier);
    const isItself =
      editing &&
      editing.projectName === entry.projectName &&
      editing.supplier === entry.supplier;
    if (duplicate && !isItself) {
      this.submitError.set(
        `"${entry.projectName}" already has an entry for supplier "${entry.supplier || '—'}".`,
      );
      return;
    }

    this.isSubmitting.set(true);
    this.submitError.set('');
    this.submitSuccess.set(false);

    const save$ = editing
      ? this.projectsStore.updateEntry(editing.projectName, editing.supplier, entry)
      : this.projectsStore.add(entry);

    save$.subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.submitSuccess.set(true);
        setTimeout(() => this.onBack(), 900);
      },
      error: (err: unknown) => {
        this.isSubmitting.set(false);
        this.submitError.set(
          err instanceof Error ? err.message : 'Could not save the project. Please try again.',
        );
      },
    });
  }
}
