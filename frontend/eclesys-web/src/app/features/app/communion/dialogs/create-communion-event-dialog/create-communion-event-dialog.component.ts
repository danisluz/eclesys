import { Component, DestroyRef, computed, inject } from '@angular/core';
import { FormBuilder, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DynamicDialogRef, DynamicDialogConfig } from 'primeng/dynamicdialog';
import { AutoCompleteModule, AutoCompleteSelectEvent } from 'primeng/autocomplete';
import { DatePickerModule } from 'primeng/datepicker';
import { ButtonModule } from 'primeng/button';
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
    ReactiveFormsModule,
    AutoCompleteModule,
    DatePickerModule,
    ButtonModule,
  ],
  templateUrl: './create-communion-event-dialog.component.html',
  styleUrl: './create-communion-event-dialog.component.scss',
})
export class CreateCommunionEventDialogComponent {
  private formBuilder = inject(FormBuilder);
  private ref = inject(DynamicDialogRef);
  private eventsStore = inject(CommunionEventsStore);
  private destroyRef = inject(DestroyRef);

  data = inject(DynamicDialogConfig).data as CreateCommunionEventDialogData;

  isCreatingSignal = this.eventsStore.isCreatingSignal;
  errorMessageSignal = computed(() => this.eventsStore.createErrorMessageSignal());

  congregationSearchControl = new FormControl<OrganizationUnit | null>(null);
  filteredCongregations: OrganizationUnit[] = [];

  form = this.formBuilder.group({
    congregationId: [null as string | null, [Validators.required]],
    eventDate: [null as Date | null, [Validators.required]],
  });

  constructor() {
    const defaultCongregation = this.data.congregations.find(
      (c) => c.id === this.data.defaultCongregationId,
    );

    if (defaultCongregation) {
      this.congregationSearchControl.setValue(defaultCongregation);
      this.form.controls.congregationId.setValue(defaultCongregation.id);
    }

    this.filteredCongregations = [...this.data.congregations];

    this.congregationSearchControl.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((value) => {
        if (value === null) {
          this.form.controls.congregationId.setValue(null);
        }
      });
  }

  cancel(): void {
    this.ref.close();
  }

  async save(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();
    if (!value.eventDate || !value.congregationId) return;

    const created = await this.eventsStore.createEvent({
      congregationId: value.congregationId,
      eventDate: this.formatDateOnly(value.eventDate),
    });

    if (created) {
      this.ref.close(created as CommunionEvent);
    }
  }

  onCongregationSelected(event: AutoCompleteSelectEvent): void {
    const congregation = event.value as OrganizationUnit;
    this.form.controls.congregationId.setValue(congregation.id);
  }

  onCongregationClear(): void {
    this.form.controls.congregationId.setValue(null);
  }

  searchCongregations(event: { query: string }): void {
    const term = event.query.toLowerCase().trim();
    this.filteredCongregations = term
      ? this.data.congregations.filter((c) => c.name.toLowerCase().includes(term))
      : [...this.data.congregations];
  }

  private formatDateOnly(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
