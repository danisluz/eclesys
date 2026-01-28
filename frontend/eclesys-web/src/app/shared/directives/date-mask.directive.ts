import { Directive, ElementRef, HostListener } from '@angular/core';

@Directive({
  selector: '[appDateMask]',
  standalone: true,
})
export class DateMaskDirective {
  constructor(private elementRef: ElementRef<HTMLInputElement>) {}

  @HostListener('input', ['$event'])
  onInput(event: Event) {
    const input = event.target as HTMLInputElement;
    const rawDigits = input.value.replace(/\D/g, '').slice(0, 8);
    const formatted = this.formatDate(rawDigits);

    if (formatted !== input.value) {
      input.value = formatted;
      input.dispatchEvent(new Event('input', { bubbles: true }));
    }

  }

  @HostListener('blur')
  onBlur() {
    const input = this.elementRef.nativeElement;
    const rawDigits = input.value.replace(/\D/g, '');
    if (rawDigits.length === 8) {
      const formatted = this.formatDate(rawDigits);
      if (formatted !== input.value) {
        input.value = formatted;
        input.dispatchEvent(new Event('input', { bubbles: true }));
      }
    }
  }

  private formatDate(value: string): string {
    const day = value.slice(0, 2);
    const month = value.slice(2, 4);
    const year = value.slice(4, 8);

    if (value.length <= 2) {
      return day;
    }

    if (value.length <= 4) {
      return `${day}/${month}`;
    }

    return `${day}/${month}/${year}`;
  }
}
