import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';
import { TagModule } from 'primeng/tag';
import { CommunionEventStatus } from '../../models/communion.models';

@Component({
  selector: 'app-communion-status-chip',
  standalone: true,
  imports: [TagModule],
  templateUrl: './communion-status-chip.component.html',
  styleUrl: './communion-status-chip.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CommunionStatusChipComponent {
  statusSignal = input.required<CommunionEventStatus>();

  labelSignal = computed(() => {
    switch (this.statusSignal()) {
      case 'OPEN': return 'Aberto';
      case 'CLOSED': return 'Fechado';
      default: return 'Rascunho';
    }
  });

  severitySignal = computed((): 'success' | 'info' | 'secondary' => {
    switch (this.statusSignal()) {
      case 'OPEN': return 'success';
      case 'DRAFT': return 'info';
      default: return 'secondary';
    }
  });
}
