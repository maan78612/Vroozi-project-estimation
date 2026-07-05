import { Directive, ElementRef, afterNextRender, inject } from '@angular/core';

/*
 * ──────────────────────────────────────────────────────────────────
 !  <input appAutofocus /> → the field grabs the typing cursor as
 *  soon as it appears on screen.
 *
 *  A directive is a behavior you attach to an existing element —
 *  no template of its own. This one waits until the element has
 *  been drawn (afterNextRender), then calls focus() on it. The
 *  component that uses it needs no viewChild / setTimeout code.
 * ──────────────────────────────────────────────────────────────────
 */
@Directive({
  selector: '[appAutofocus]',
})
export class AutofocusDirective {
  // The element this directive sits on.
  private readonly el: ElementRef<HTMLElement> = inject(ElementRef);

  constructor() {
    // Runs once, right after the element is first drawn.
    afterNextRender(() => this.el.nativeElement.focus());
  }
}
