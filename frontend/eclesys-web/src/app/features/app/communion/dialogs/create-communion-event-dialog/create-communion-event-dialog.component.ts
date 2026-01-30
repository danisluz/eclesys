import { CommonModule } from '@angular/common';
import { Component, DestroyRef, computed, inject } from '@angular/core';
import {
  MatDialogModule,
  MAT_DIALOG_DATA,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import {
  MatAutocompleteModule,
  MatAutocompleteSelectedEvent,
} from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import {
  FormBuilder,
  FormControl,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { OrganizationUnit } from '../../../../../shared/api/organization-unit.model';
import { CommunionEventsStore } from '../../stores/communion-events.store';
import { CommunionEvent } from '../../models/communion.models';

interface CreateCommunionEventDialogData {
  congregations: OrganizationUnit[];
  defaultCongregationId?: string | null;
  congregationLabel: string;
}

@Component({
  selector: 'app-create-communion-event-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatAutocompleteModule,
    MatButtonModule,
    MatDatepickerModule,
    MatNativeDateModule,
  ],
  templateUrl: './create-communion-event-dialog.component.html',
  styleUrl: './create-communion-event-dialog.component.scss',
})
export class CreateCommunionEventDialogComponent {
  private formBuilder = inject(FormBuilder);
  private dialogRef = inject(
    MatDialogRef<CreateCommunionEventDialogComponent>,
  );
  private eventsStore = inject(CommunionEventsStore);
  private destroyRef = inject(DestroyRef);

  data = inject<CreateCommunionEventDialogData>(MAT_DIALOG_DATA);

  isCreatingSignal = this.eventsStore.isCreatingSignal;
  errorMessageSignal = computed(
    () => this.eventsStore.createErrorMessageSignal(),
  );

  congregationSearchControl = new FormControl<string | OrganizationUnit | null>(
    '',
  );

  form = this.formBuilder.group({
    congregationId: [null as string | null, [Validators.required]],
    eventDate: [null as Date | null, [Validators.required]],
  });

  constructor() {
    const defaultCongregation = this.data.congregations.find(
      (congregation) => congregation.id === this.data.defaultCongregationId,
    );

    if (defaultCongregation) {
      this.congregationSearchControl.setValue(defaultCongregation);
      this.form.controls.congregationId.setValue(defaultCongregation.id);
    }

    this.congregationSearchControl.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((value) => {
        if (typeof value === 'string' || value === null) {
          this.form.controls.congregationId.setValue(null);
        }
      });
  }

  cancel(): void {
    this.dialogRef.close();
  }

  async save(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();
    if (!value.eventDate || !value.congregationId) return;

    const eventDate = this.formatDateOnly(value.eventDate);

    const created = await this.eventsStore.createEvent({
      congregationId: value.congregationId,
      eventDate,
    });

    if (created) {
      this.dialogRef.close(created as CommunionEvent);
    }
  }

  onCongregationSelected(event: MatAutocompleteSelectedEvent): void {
    const congregation = event.option.value as OrganizationUnit;
    this.form.controls.congregationId.setValue(congregation.id);
  }

  displayCongregation(
    congregation: OrganizationUnit | string | null,
  ): string {
    if (!congregation || typeof congregation === 'string') return '';
    return congregation.name;
  }

  filterCongregations(
    value: string | OrganizationUnit | null,
  ): OrganizationUnit[] {
    if (!this.data.congregations?.length) return [];

    const term =
      typeof value === 'string' ? value : value?.name ?? '';
    const normalized = term.toLowerCase().trim();

    if (!normalized) return this.data.congregations;

    return this.data.congregations.filter((congregation) =>
      congregation.name.toLowerCase().includes(normalized),
    );
  }

  private formatDateOnly(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
