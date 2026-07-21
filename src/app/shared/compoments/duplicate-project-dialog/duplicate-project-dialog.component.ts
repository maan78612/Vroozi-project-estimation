import { Component, computed, effect, input, output, signal } from '@angular/core';
import { ProjectInterface } from '../../../core/intefaces/form/project.interface';
import { ProjectGroup } from '../../../core/utils/project-group.util';
import { ButtonComponent } from '../button/button';
import { InitialsPipe } from '../../pipes/initials.pipe';

/*
 * ──────────────────────────────────────────────────────────────────
 !  Project-level "Duplicate" dialog — admin only (see project-list)
 *
 *  Clones some or all of a project's supplier entries under a new
 *  project name in one go, instead of running the wizard once per
 *  supplier. Every entry starts checked; unchecking one excludes it
 *  from the clone. Closes on ×, backdrop click, or Escape.
 * ──────────────────────────────────────────────────────────────────
 */
@Component({
  selector: 'app-duplicate-project-dialog',
  standalone: true,
  imports: [ButtonComponent, InitialsPipe],
  templateUrl: './duplicate-project-dialog.component.html',
  styleUrl: './duplicate-project-dialog.component.less',
  host: {
    '(document:keydown.escape)': 'onCancel()',
    '[attr.title]': 'null',
  },
})
export class DuplicateProjectDialogComponent {
  group = input.required<ProjectGroup>();
  saving = input(false);
  errorMessage = input('');
  // Every project name already in use (including the source project's own
  // name) — a name that collides with one of these would silently merge
  // the clones into that existing group instead of creating a new project.
  existingNames = input<string[]>([]);

  confirmed = output<{ newProjectName: string; selectedEntries: ProjectInterface[] }>();
  cancelled = output<void>();

  readonly newName = signal('');
  readonly selectedIds = signal<Set<string>>(new Set());

  constructor() {
    // Re-seed the name + selection whenever a different project is opened
    // for duplication — same reset-on-input-change idea as
    // ProjectViewComponent's selectedEntryId/supplierQuery reset. The
    // suggested name is bumped past any name already taken (re-duplicating
    // the same project twice would otherwise suggest the exact same
    // "(Copy)" name both times).
    effect(() => {
      const g = this.group();
      this.newName.set(this.uniqueCopyName(g.projectName));
      this.selectedIds.set(new Set(g.entries.map((e) => e.id ?? '')));
    });
  }

  private uniqueCopyName(base: string): string {
    const taken = new Set(this.existingNames());
    let candidate = `${base} (Copy)`;
    for (let n = 2; taken.has(candidate); n++) {
      candidate = `${base} (Copy ${n})`;
    }
    return candidate;
  }

  isSelected(entry: ProjectInterface): boolean {
    return this.selectedIds().has(entry.id ?? '');
  }

  toggle(entry: ProjectInterface): void {
    if (this.saving()) return;
    const id = entry.id ?? '';
    const next = new Set(this.selectedIds());
    if (next.has(id)) next.delete(id);
    else next.add(id);
    this.selectedIds.set(next);
  }

  interfacesOf(entry: ProjectInterface): number {
    return entry.masterDataInterfaces + entry.transactionalInterfaces;
  }

  // Exact-match, same as how groupProjects()/entriesFor() key entries —
  // the check has to mirror the real grouping rule, not a looser one.
  readonly nameCollision = computed(() => {
    const trimmed = this.newName().trim();
    return trimmed.length > 0 && this.existingNames().includes(trimmed);
  });

  readonly canSubmit = computed(
    () =>
      this.newName().trim().length >= 2 &&
      !this.nameCollision() &&
      this.selectedIds().size > 0 &&
      !this.saving(),
  );

  onNameChange(value: string): void {
    this.newName.set(value);
  }

  onBackdropClick(): void {
    this.onCancel();
  }

  onCancel(): void {
    if (this.saving()) return;
    this.cancelled.emit();
  }

  onConfirm(): void {
    if (!this.canSubmit()) return;
    const selectedEntries = this.group().entries.filter((e) => this.selectedIds().has(e.id ?? ''));
    this.confirmed.emit({ newProjectName: this.newName().trim(), selectedEntries });
  }
}
