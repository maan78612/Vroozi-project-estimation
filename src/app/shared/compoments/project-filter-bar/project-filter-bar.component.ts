import { Component, input, output } from '@angular/core';
import { ProjectSizeEnum } from '../../../core/enums/project-size.enum';
import { PROJECT_SIZE_ORDER, ProjectSortOption } from '../../../core/utils/project-sort.util';

/*
 * ──────────────────────────────────────────────────────────────────
 !  Shared project list toolbar
 *
 *  Search + ERP filter + sort + size chips, used identically by the
 *  admin's "All Projects" list and the employee's "My Projects" list.
 * ──────────────────────────────────────────────────────────────────
 */
@Component({
  selector: 'app-project-filter-bar',
  standalone: true,
  imports: [],
  templateUrl: './project-filter-bar.component.html',
  styleUrl: './project-filter-bar.component.less',
})
export class ProjectFilterBarComponent {
  searchQuery = input('');
  searchPlaceholder = input('Search…');
  erpFilter = input('');
  availableErps = input<string[]>([]);
  sizeFilter = input<ProjectSizeEnum | null>(null);
  sortBy = input<ProjectSortOption>('name');
  hasActiveFilters = input(false);

  searchChange = output<string>();
  erpChange = output<string>();
  sizeToggle = output<ProjectSizeEnum>();
  sortChange = output<ProjectSortOption>();
  clear = output<void>();

  readonly sizeOrder = PROJECT_SIZE_ORDER;
}
