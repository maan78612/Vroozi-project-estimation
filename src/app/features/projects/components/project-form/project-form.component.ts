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

import { Component, computed, effect, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../../../core/services/auth/auth-service';
import { ProjectsStoreService } from '../../../../core/services/projects/projects-store.service';
import { COMPLEXITY_FLAGS, RISK_FLAGS } from '../../../../core/data/feature-flags.data';
import { ProjectInterface, YesNo } from '../../../../core/intefaces/form/project.interface';
import { RoleEnum } from '../../../../core/enums/role-enum';
import { ProjectSizeEnum } from '../../../../core/enums/project-size.enum';
import { estimateProjectSize } from '../../../../core/utils/project-size.util';
import { estimateRangeDays } from '../../../../core/utils/estimate.util';
import { ButtonComponent } from '../../../../shared/compoments/button/button';
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
    ButtonComponent,
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
  private projectsStore = inject(ProjectsStoreService);
  private fb = inject(FormBuilder);

  /*
   * ──────────────────────────────────────────────────────────────────
   !  Wizard step metadata
   * ──────────────────────────────────────────────────────────────────
   */
  readonly stepMeta = [
    { title: 'Project Basics', subtitle: 'Name the project and identify the ERP system' },
    { title: 'Integration Scope', subtitle: 'Count the interfaces and connection directions' },
    { title: 'Complexity Factors', subtitle: 'Flag the technical complexity drivers' },
    { title: 'Risk & Dependencies', subtitle: 'Quantify uncertainty and external dependencies' },
    { title: 'Review & Submit', subtitle: 'Confirm everything looks right before saving' },
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
  editingProject = signal<ProjectInterface | null>(null);
  loadError = signal('');
  isSubmitting = signal(false);
  submitError = signal('');
  submitSuccess = signal(false);

  // Create mode: brand-new project, or another supplier for an existing one.
  entryMode = signal<'new' | 'existing'>('new');

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

  readonly isAdmin = computed(() => this.authService.getRole() === RoleEnum.Admin);
  readonly username = computed(() => this.authService.getCurrentUser()?.username ?? '');
  readonly isLastStep = computed(() => this.currentStep() === this.totalSteps - 1);

  // Employees a project can be assigned/reassigned to — admin-only concern, static for the session.
  readonly assignableUsers = this.authService.getAssignableUsers();

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

    // Regular users don't get to reassign their own project — lock the field to themselves.
    if (!this.isAdmin()) {
      this.form.get('user')?.setValue(this.username());
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
    const range = estimateRangeDays({
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

    this.form.get('tentativeRangeDays')?.setValue(range, { emitEvent: false });
    this.form.get('tentativeProjectSize')?.setValue(estimateProjectSize(range), { emitEvent: false });
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
    if (!this.isAdmin() && found.user !== this.username()) {
      this.loadError.set('This project is no longer assigned to you.');
      return;
    }
    this.editingProject.set(found);
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
  }

  onExistingProjectPicked(name: string): void {
    this.form.get('projectName')?.setValue(name);
    // Start from the project's ERP as a convenience — still editable per supplier.
    const first = this.projectsStore.entriesFor(name)[0];
    if (first) this.form.get('erp')?.setValue(first.erp);
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
