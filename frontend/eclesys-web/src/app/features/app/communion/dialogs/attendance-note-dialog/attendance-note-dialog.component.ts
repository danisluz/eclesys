import { Component, inject } from '@angular/core';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { DynamicDialogRef, DynamicDialogConfig } from 'primeng/dynamicdialog';
import { ButtonModule } from 'primeng/button';
import { TextareaModule } from 'primeng/textarea';

export interface AttendanceNoteDialogData {
  memberName: string;
  note: string | null;
  canEdit: boolean;
}

@Component({
  selector: 'app-attendance-note-dialog',
  standalone: true,
  imports: [ReactiveFormsModule, ButtonModule, TextareaModule],
  templateUrl: './attendance-note-dialog.component.html',
  styleUrl: './attendance-note-dialog.component.scss',
})
export class AttendanceNoteDialogComponent {
  private readonly ref = inject(DynamicDialogRef);
  readonly data = inject(DynamicDialogConfig).data as AttendanceNoteDialogData;

  noteControl = new FormControl<string>(this.data.note ?? '', { nonNullable: true });

  close(): void {
    this.ref.close();
  }

  save(): void {
    if (!this.data.canEdit) {
      this.ref.close();
      return;
    }
    const note = this.normalizeNote(this.noteControl.value);
    this.ref.close(note.length > 0 ? note : null);
  }

  canSave(): boolean {
    if (!this.data.canEdit) return false;
    const original = this.normalizeNote(this.data.note ?? '');
    const current = this.normalizeNote(this.noteControl.value);
    return original !== current;
  }

  private normalizeNote(value: string): string {
    return value.trim();
  }
}
