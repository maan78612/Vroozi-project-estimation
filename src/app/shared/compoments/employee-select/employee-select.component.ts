import {
  Component,
  ElementRef,
  HostListener,
  computed,
  forwardRef,
  inject,
  input,
  signal,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { UserInterface } from '../../../core/intefaces/user-interface';
import { InitialsPipe } from '../../pipes/initials.pipe';
import { AutofocusDirective } from '../../directives/autofocus.directive';

/*
 * ──────────────────────────────────────────────────────────────────
 !  Searchable employee dropdown
 *
 *  Replaces the plain <select> for assigning a project to an
 *  employee: click the box → a panel opens with a search field and
 *  the list of people. Type to filter, arrows + Enter to pick,
 *  Escape or an outside click to close.
 *
 *  It connects to the form with two pieces:
 *   1. ControlValueAccessor  → HOW the form talks to us
 *      (four standard methods, at the bottom of this file).
 *   2. NG_VALUE_ACCESSOR     → HOW the form finds us
 *      (the registration in `providers` below).
 *  Result: formControlName="user" works here like on any normal
 *  input, and the stored value is just a username like "sara".
 * ──────────────────────────────────────────────────────────────────
 */

@Component({
  selector: 'app-employee-select',
  standalone: true,
  imports: [InitialsPipe, AutofocusDirective],
  templateUrl: './employee-select.component.html',
  styleUrl: './employee-select.component.less',
  providers: [
    /*
     * NG_VALUE_ACCESSOR = how the form FINDS us.
     * formControlName never looks inside our class — it only checks
     * this registration. Without it: "No value accessor" error.
     *
     *  - forwardRef(...) → class is defined further down; look it up later
     *  - useExisting     → reuse this component instance, don't build a new one
     *  - multi: true     → the key holds a list (Angular requires this)
     */
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => EmployeeSelectComponent),
      multi: true,
    },
  ],
})
export class EmployeeSelectComponent implements ControlValueAccessor {
  /*
   * ──────────────────────────────────────────────────────────────────
   !  Settings passed in from the parent page
   * ──────────────────────────────────────────────────────────────────
   */
  employees = input<UserInterface[]>([]); // the list of people to choose from
  placeholder = input('Select an employee…'); // grey text when nothing is picked yet
  isError = input(false); // true → red border (validation failed)

  // Our own piece of the page — used to tell inside clicks from outside clicks.
  private readonly host: ElementRef<HTMLElement> = inject(ElementRef);

  /*
   * ──────────────────────────────────────────────────────────────────
   !  The component's memory (signals = values the screen reacts to)
   * ──────────────────────────────────────────────────────────────────
   */
  readonly isOpen = signal(false); // is the panel showing?
  readonly searchQuery = signal(''); // text typed in the search field
  readonly activeIndex = signal(-1); // highlighted row for keyboard use (-1 = none)
  readonly value = signal(''); // username of the chosen employee
  readonly isDisabled = signal(false); // true → whole control greyed out

  // The two functions the form hands us (see registerOnChange /
  // registerOnTouched below). We call them to report back:
  //   onChange('sara') → "user picked sara"
  //   onTouched()      → "user interacted with me" (allows the red error)
  private onChange: (value: string) => void = () => {};
  private onTouched: () => void = () => {};

  // Full record of the chosen employee, so the closed box can show
  // their name and initials. Updates by itself when value changes.
  readonly selectedEmployee = computed(
    () => this.employees().find((e) => e.username === this.value()) ?? null,
  );

  // The list shown in the panel: everyone, or only people whose name
  // or username contains the search text (case-insensitive).
  readonly filteredEmployees = computed(() => {
    const query = this.searchQuery().trim().toLowerCase();
    if (!query) return this.employees();
    return this.employees().filter(
      (e) =>
        e.username.toLowerCase().includes(query) ||
        (e.fullName ?? '').toLowerCase().includes(query),
    );
  });

  /*
   * ──────────────────────────────────────────────────────────────────
   !  Small display helpers
   * ──────────────────────────────────────────────────────────────────
   */

  // Full name, or username if no full name is set (e.g. admin).
  // The avatar letters come from the shared `initials` pipe (see template).
  displayName(employee: UserInterface): string {
    return employee.fullName || employee.username;
  }

  /*
   * ──────────────────────────────────────────────────────────────────
   !  Opening and closing the panel
   * ──────────────────────────────────────────────────────────────────
   */

  // Clicking the box flips the panel open/closed (unless disabled).
  toggle(): void {
    if (this.isDisabled()) return;
    if (this.isOpen()) {
      this.closePanel();
    } else {
      this.openPanel();
    }
  }

  private openPanel(): void {
    this.isOpen.set(true);
    this.searchQuery.set(''); // fresh empty search each time
    // Start the keyboard highlight on whoever is already chosen.
    this.activeIndex.set(this.employees().findIndex((e) => e.username === this.value()));
    // The search field focuses itself via the appAutofocus directive (see template).
  }

  closePanel(): void {
    if (!this.isOpen()) return;
    this.isOpen.set(false);
    this.onTouched(); // "user interacted with me" → red error allowed if still empty
  }

  // Listens to clicks on the WHOLE page — a handler on the component
  // alone can't hear clicks that happen elsewhere. Outside click →
  // close; inside clicks are handled by the buttons themselves.
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (this.isOpen() && !this.host.nativeElement.contains(event.target as Node)) {
      this.closePanel();
    }
  }

  // Escape closes the panel. Lives on the outer wrapper (see template)
  // so it works whichever inner element has focus.
  onEscape(event: Event): void {
    if (!this.isOpen()) return;
    event.preventDefault();
    this.closePanel();
  }

  /*
   * ──────────────────────────────────────────────────────────────────
   !  Picking someone + keyboard support
   * ──────────────────────────────────────────────────────────────────
   */

  // The moment of choice: remember it, report it to the form, close.
  select(employee: UserInterface): void {
    this.value.set(employee.username);
    this.onChange(employee.username);
    this.closePanel();
  }

  // Every keystroke: store the text (the list re-filters itself) and
  // highlight the first match so Enter always picks something sensible.
  onSearch(event: Event): void {
    this.searchQuery.set((event.target as HTMLInputElement).value);
    this.activeIndex.set(this.filteredEmployees().length > 0 ? 0 : -1);
  }

  // On the closed box: Enter/Space already "click" a button natively,
  // so we only add the arrow keys as an extra way to open.
  onTriggerKeydown(event: KeyboardEvent): void {
    if (!this.isOpen() && (event.key === 'ArrowDown' || event.key === 'ArrowUp')) {
      event.preventDefault();
      this.openPanel();
    }
  }

  // In the search field: arrows move the highlight, Enter picks the
  // highlighted person, Tab means the user is leaving → close.
  onSearchKeydown(event: KeyboardEvent): void {
    const options = this.filteredEmployees();
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        this.moveActive(1, options.length);
        break;
      case 'ArrowUp':
        event.preventDefault();
        this.moveActive(-1, options.length);
        break;
      case 'Enter': {
        event.preventDefault();
        const active = options[this.activeIndex()];
        if (active) this.select(active);
        break;
      }
      case 'Tab':
        this.closePanel();
        break;
    }
  }

  // Move the highlight one row; the % math wraps it around (down on
  // the last person jumps to the first, and the other way round).
  private moveActive(step: number, count: number): void {
    if (count === 0) return;
    this.activeIndex.set((this.activeIndex() + step + count) % count);
    // setTimeout: let the highlight get drawn first, then scroll to it.
    setTimeout(() =>
      this.host.nativeElement
        .querySelector('.emp-option.is-active')
        ?.scrollIntoView({ block: 'nearest' }),
    );
  }

  /*
   * ──────────────────────────────────────────────────────────────────
   !  ControlValueAccessor = how the form TALKS to us.
   *  Four standard methods every form input must have.
   *  The form calls them — we never call them ourselves.
   *
   *  Live example: editing a project → form.patchValue({user:'ali'})
   *  → the form calls writeValue('ali') → box shows Ali Khan.
   *  Picking Sara → we call onChange('sara') → the form now holds
   *  user:'sara', which is what Save reads via getRawValue().
   * ──────────────────────────────────────────────────────────────────
   */

  // Form → us: "display this value" (on form build and on patchValue).
  writeValue(value: string | null): void {
    this.value.set(value ?? '');
  }

  // Form → us: "call fn whenever your value changes" (we do, in select()).
  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  // Form → us: "call fn once the user has interacted" (we do, on close).
  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  // Form → us: "grey yourself out" (or back in).
  setDisabledState(isDisabled: boolean): void {
    this.isDisabled.set(isDisabled);
  }
}
