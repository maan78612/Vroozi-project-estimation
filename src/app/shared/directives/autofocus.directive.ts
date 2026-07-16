import { Directive, ElementRef, afterNextRender, inject, input } from '@angular/core';

/*
 * ──────────────────────────────────────────────────────────────────
 !  <input appAutofocus /> → the field grabs the typing cursor as
 *  soon as it appears on screen.
 *
 *  A directive is a behavior you attach to an existing element —
 *  no template of its own. This one waits until the element has
 *  been drawn (afterNextRender), then calls focus() on it. The
 *  component that uses it needs no viewChild / setTimeout code.
 *
 *  `[appAutofocus]="someCondition"` opts out when the bound value is
 *  false — used by FormComponent, which renders N fields and should
 *  only focus the one the caller flagged, not all of them (the bare
 *  `appAutofocus` attribute with no binding still means "always", via
 *  the `true` default below).
 * ──────────────────────────────────────────────────────────────────
 */
@Directive({
  selector: '[appAutofocus]',
})
export class AutofocusDirective {
  // The element this directive sits on.
  private readonly el: ElementRef<HTMLElement> = inject(ElementRef);

  appAutofocus = input(true);

  constructor() {
    // Runs once, right after the element is first drawn.
    afterNextRender(() => {
      if (this.appAutofocus()) this.el.nativeElement.focus();
    });
  }
}
