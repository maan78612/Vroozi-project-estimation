import { Component, input, output } from '@angular/core';
import { ProjectInterface } from '../../../core/intefaces/form/project.interface';
import { ProjectGroup } from '../../../core/utils/project-group.util';
import { InitialsPipe } from '../../pipes/initials.pipe';

/*
 * ──────────────────────────────────────────────────────────────────
 !  Supplier picker dialog
 *
 *  Opens when a project card with several suppliers is edited —
 *  each row is one supplier entry; picking one opens its edit form.
 *  Closes on ×, backdrop click, or Escape.
 * ──────────────────────────────────────────────────────────────────
 */
@Component({
  selector: 'app-supplier-picker',
  standalone: true,
  imports: [InitialsPipe],
  templateUrl: './supplier-picker.component.html',
  styleUrl: './supplier-picker.component.less',
  host: { '(document:keydown.escape)': 'closed.emit()' },
})
export class SupplierPickerComponent {
  group = input.required<ProjectGroup>();
  // Deleting is an admin-only action on the backend — hide the buttons for others.
  showDelete = input(true);

  pick = output<ProjectInterface>();
  delete = output<ProjectInterface>();
  closed = output<void>();

  interfacesOf(entry: ProjectInterface): number {
    return entry.masterDataInterfaces + entry.transactionalInterfaces;
  }
}
