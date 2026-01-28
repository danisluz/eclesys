import { Injectable } from '@angular/core';
import { NativeDateAdapter } from '@angular/material/core';

@Injectable()
export class BrazilDateAdapter extends NativeDateAdapter {
  override parse(value: unknown): Date | null {
    if (typeof value === 'string' && value.trim().length > 0) {
      const parts = value.trim().split('/');
      if (parts.length === 3) {
        const day = Number(parts[0]);
        const month = Number(parts[1]) - 1;
        const year = Number(parts[2]);

        if (!Number.isNaN(day) && !Number.isNaN(month) && !Number.isNaN(year)) {
          const date = new Date(year, month, day);
          if (
            date.getFullYear() === year &&
            date.getMonth() === month &&
            date.getDate() === day
          ) {
            return date;
          }
        }
      }
    }

    return super.parse(value);
  }

  override format(date: Date, displayFormat: unknown): string {
    const day = this.twoDigit(date.getDate());
    const month = this.twoDigit(date.getMonth() + 1);
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  }

  private twoDigit(value: number): string {
    return value < 10 ? `0${value}` : `${value}`;
  }
}

export const BRAZIL_DATE_FORMATS = {
  parse: {
    dateInput: 'DD/MM/YYYY',
  },
  display: {
    dateInput: 'DD/MM/YYYY',
    monthYearLabel: 'MMM YYYY',
    dateA11yLabel: 'DD/MM/YYYY',
    monthYearA11yLabel: 'MMMM YYYY',
  },
};
