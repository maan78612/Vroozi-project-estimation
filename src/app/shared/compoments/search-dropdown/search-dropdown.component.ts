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
import { InitialsPipe } from '../../pipes/initials.pipe';
import { AutofocusDirective } from '../../directives/autofocus.directive';

// One row in the list: `id` is the real form value, `label`/`sublabel` are just display text.
export interface SearchDropdownOption {
  id: string;
  label: string;
  sublabel?: string;
}

/*
 * ──────────────────────────────────────────────────────────────────
 !  Generic searchable dropdown — pick one option from a closed list
 *
 *  Click the box → a panel opens with a search field and the option
 *  list. Type to filter, arrows + Enter to pick, Escape or an
 *  outside click to close. Used for "Assigned To", "ERP System" and
 *  "Supplier" — same component, just a different `options` list.
 *
 *  It connects to the form with two pieces:
 *   1. ControlValueAccessor  → HOW the form talks to us
 *      (four standard methods, at the bottom of this file).
 *   2. NG_VALUE_ACCESSOR     → HOW the form finds us
 *      (the registration in `providers` below).
 *  Result: formControlName="erp" works here like on any normal
 *  input, and the stored value is just the option's `id`.
 * ──────────────────────────────────────────────────────────────────
 */
@Component({
  selector: 'app-search-dropdown',
  standalone: true,
  imports: [InitialsPipe, AutofocusDirective],
  templateUrl: './search-dropdown.component.html',
  styleUrl: './search-dropdown.component.less',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SearchDropdownComponent),
      multi: true,
    },
  ],
})
export class SearchDropdownComponent implements ControlValueAccessor {
  /*
   * ──────────────────────────────────────────────────────────────────
   !  Settings passed in from the parent page
   * ──────────────────────────────────────────────────────────────────
   */
  options = input<SearchDropdownOption[]>([]); // the pick-list
  placeholder = input('Select…'); // grey text when nothing is picked yet
  searchPlaceholder = input('Search…'); // placeholder inside the search box
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
  readonly value = signal(''); // id of the chosen option
  readonly isDisabled = signal(false); // true → whole control greyed out

  // The two functions the form hands us (see registerOnChange /
  // registerOnTouched below). We call them to report back:
  //   onChange('sap') → "user picked sap"
  //   onTouched()     → "user interacted with me" (allows the red error)
  private onChange: (value: string) => void = () => {};
  private onTouched: () => void = () => {};

  // The option matching the current value. Falls back to showing the raw
  // stored value if it's no longer in `options()` (e.g. an old entry),
  // so editing never looks like the value silently disappeared.
  readonly selectedOption = computed(() => {
    const found = this.options().find((o) => o.id === this.value());
    if (found) return found;
    return this.value() ? { id: this.value(), label: this.value() } : null;
  });

  // The list shown in the panel: everyone, or only rows whose label or
  // sublabel contains the search text (case-insensitive).
  readonly filteredOptions = computed(() => {
    const query = this.searchQuery().trim().toLowerCase();
    if (!query) return this.options();
    return this.options().filter(
      (o) =>
        o.label.toLowerCase().includes(query) ||
        (o.sublabel ?? '').toLowerCase().includes(query),
    );
  });

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
    this.activeIndex.set(this.options().findIndex((o) => o.id === this.value()));
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
   !  Picking + clearing + keyboard support
   * ──────────────────────────────────────────────────────────────────
   */

  // The moment of choice: remember it, report it to the form, close.
  select(option: SearchDropdownOption): void {
    this.value.set(option.id);
    this.onChange(option.id);
    this.closePanel();
  }

  // The small × on the trigger — resets back to "nothing picked" without
  // opening the panel. Stops the click from also toggling the panel open.
  clear(event: Event): void {
    event.stopPropagation();
    if (this.isDisabled()) return;
    this.value.set('');
    this.onChange('');
    this.onTouched();
  }

  // Every keystroke: store the text (the list re-filters itself) and
  // highlight the first match so Enter always picks something sensible.
  onSearch(event: Event): void {
    this.searchQuery.set((event.target as HTMLInputElement).value);
    this.activeIndex.set(this.filteredOptions().length > 0 ? 0 : -1);
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
  // highlighted option, Tab means the user is leaving → close.
  onSearchKeydown(event: KeyboardEvent): void {
    const options = this.filteredOptions();
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
  // the last option jumps to the first, and the other way round).
  private moveActive(step: number, count: number): void {
    if (count === 0) return;
    this.activeIndex.set((this.activeIndex() + step + count) % count);
    // setTimeout: let the highlight get drawn first, then scroll to it.
    setTimeout(() =>
      this.host.nativeElement
        .querySelector('.sd-option.is-active')
        ?.scrollIntoView({ block: 'nearest' }),
    );
  }

  /*
   * ──────────────────────────────────────────────────────────────────
   !  ControlValueAccessor = how the form TALKS to us.
   *  Four standard methods every form input must have.
   *  The form calls them — we never call them ourselves.
   * ──────────────────────────────────────────────────────────────────
   */

  // Form → us: "display this value" (on form build and on patchValue).
  writeValue(value: string | null): void {
    this.value.set(value ?? '');
  }

  // Form → us: "call fn whenever your value changes" (we do, in select()/clear()).
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
