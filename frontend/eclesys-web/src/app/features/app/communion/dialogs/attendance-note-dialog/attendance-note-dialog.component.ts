import {
  ChangeDetectionStrategy,
  Component,
  Input,
  Output,
  EventEmitter,
  OnChanges,
} from '@angular/core';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { TextareaModule } from 'primeng/textarea';
import { DialogModule } from 'primeng/dialog';

@Component({
  selector: 'app-attendance-note-dialog',
  standalone: true,
  imports: [ReactiveFormsModule, ButtonModule, TextareaModule, DialogModule],
  templateUrl: './attendance-note-dialog.component.html',
  styleUrl: './attendance-note-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AttendanceNoteDialogComponent implements OnChanges {
  readonly dialogStyle = { width: '520px' };

  @Input() visible = false;
  @Input() memberName = '';
  @Input() note: string | null = null;
  @Input() canEdit = true;
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() saved = new EventEmitter<string | null>();
  @Output() closed = new EventEmitter<void>();

  noteControl = new FormControl<string>('', { nonNullable: true });

  ngOnChanges(): void {
    if (this.visible) {
      this.noteControl.setValue(this.note ?? '');
    }
  }

  close(): void {
    this.visibleChange.emit(false);
    this.closed.emit();
  }

  save(): void {
    if (!this.canEdit) {
      this.close();
      return;
    }
    const note = this.normalizeNote(this.noteControl.value);
    this.saved.emit(note.length > 0 ? note : null);
    this.visibleChange.emit(false);
  }

  canSave(): boolean {
    if (!this.canEdit) return false;
    const original = this.normalizeNote(this.note ?? '');
    const current = this.normalizeNote(this.noteControl.value);
    return original !== current;
  }

  private normalizeNote(value: string): string {
    return value.trim();
  }
}
