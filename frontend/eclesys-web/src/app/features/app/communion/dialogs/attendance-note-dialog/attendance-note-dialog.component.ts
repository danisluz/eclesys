import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { FormControl, ReactiveFormsModule } from '@angular/forms';

export interface AttendanceNoteDialogData {
  memberName: string;
  note: string | null;
  canEdit: boolean;
}

@Component({
  selector: 'app-attendance-note-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
  ],
  templateUrl: './attendance-note-dialog.component.html',
  styleUrl: './attendance-note-dialog.component.scss',
})
export class AttendanceNoteDialogComponent {
  private dialogRef = inject(MatDialogRef<AttendanceNoteDialogComponent>);
  data = inject<AttendanceNoteDialogData>(MAT_DIALOG_DATA);

  noteControl = new FormControl<string>(this.data.note ?? '', { nonNullable: true });

  close(): void {
    this.dialogRef.close();
  }

  save(): void {
    if (!this.data.canEdit) {
      this.dialogRef.close();
      return;
    }

    const note = this.normalizeNote(this.noteControl.value);
    this.dialogRef.close(note.length > 0 ? note : null);
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
