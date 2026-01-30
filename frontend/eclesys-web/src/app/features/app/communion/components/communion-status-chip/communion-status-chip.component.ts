import { CommonModule } from '@angular/common';
import { Component, computed, input } from '@angular/core';
import { MatChipsModule } from '@angular/material/chips';
import { CommunionEventStatus } from '../../models/communion.models';

@Component({
  selector: 'app-communion-status-chip',
  standalone: true,
  imports: [CommonModule, MatChipsModule],
  templateUrl: './communion-status-chip.component.html',
  styleUrl: './communion-status-chip.component.scss',
})
export class CommunionStatusChipComponent {
  statusSignal = input.required<CommunionEventStatus>();

  labelSignal = computed(() => {
    const status = this.statusSignal();
    switch (status) {
      case 'OPEN':
        return 'Aberto';
      case 'CLOSED':
        return 'Fechado';
      default:
        return 'Rascunho';
    }
  });

  classSignal = computed(() => `status-${this.statusSignal().toLowerCase()}`);
}
