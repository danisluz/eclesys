import { Component, inject, OnInit, signal } from '@angular/core';
import { DialogService } from 'primeng/dynamicdialog';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { TabsModule } from 'primeng/tabs';
import { TooltipModule } from 'primeng/tooltip';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { TransferApprovalsService } from '../../../../../shared/api/transfer-approvals.service';
import { MemberTransfer } from '../../../../../shared/models/member.model';
import { RejectDialogComponent } from '../../dialogs/reject-dialog/reject-dialog.component';
import { NotificationService } from '../../../../../shared/services/notification.service';

@Component({
  selector: 'app-pending-approvals',
  standalone: true,
  imports: [
    TableModule,
    ButtonModule,
    TagModule,
    TabsModule,
    TooltipModule,
    ProgressSpinnerModule,
  ],
  templateUrl: './pending-approvals.component.html',
  styleUrls: ['./pending-approvals.component.scss'],
})
export class PendingApprovalsComponent implements OnInit {
  private readonly approvalsService = inject(TransferApprovalsService);
  private readonly notificationService = inject(NotificationService);
  private readonly dialogService = inject(DialogService);

  forApproval = signal<MemberTransfer[]>([]);
  myRequests = signal<MemberTransfer[]>([]);
  loading = signal(false);

  ngOnInit(): void {
    this.loadPendingTransfers();
  }

  loadPendingTransfers(): void {
    this.loading.set(true);

    this.approvalsService.getPendingForApproval().subscribe({
      next: (response) => {
        if (response.status === 'success') {
          this.forApproval.set(response.data);
        }
      },
      error: () => {},
    });

    this.approvalsService.getMyPendingRequests().subscribe({
      next: (response) => {
        if (response.status === 'success') {
          this.myRequests.set(response.data);
        }
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      },
    });
  }

  approveTransfer(transfer: MemberTransfer): void {
    this.approvalsService.approveTransfer(transfer.id).subscribe({
      next: (response) => {
        if (response.status === 'success') {
          this.notificationService.success(
            'Transferência aprovada com sucesso',
          );
          this.loadPendingTransfers();
        }
      },
      error: (err) => {
        const message = err.error?.message || 'Erro ao aprovar transferência';
        this.notificationService.error(message);
      },
    });
  }

  rejectTransfer(transfer: MemberTransfer): void {
    const ref = this.dialogService.open(RejectDialogComponent, {
      header: 'Rejeitar Transferência',
      width: '500px',
      data: { transfer },
    });
    if (!ref) return;

    ref.onClose.subscribe((reason: string | undefined) => {
      if (reason !== undefined) {
        this.approvalsService
          .rejectTransfer(transfer.id, { reason })
          .subscribe({
            next: (response) => {
              if (response.status === 'success') {
                this.notificationService.success('Transferência rejeitada');
                this.loadPendingTransfers();
              }
            },
            error: (err) => {
              const message =
                err.error?.message || 'Erro ao rejeitar transferência';
              this.notificationService.error(message);
            },
          });
      }
    });
  }

  cancelTransfer(transfer: MemberTransfer): void {
    if (confirm('Deseja realmente cancelar esta solicitação?')) {
      this.approvalsService.cancelTransfer(transfer.id).subscribe({
        next: (response) => {
          if (response.status === 'success') {
            this.notificationService.success(
              'Solicitação cancelada com sucesso',
            );
            this.loadPendingTransfers();
          }
        },
        error: (err) => {
          const message = err.error?.message || 'Erro ao cancelar solicitação';
          this.notificationService.error(message);
        },
      });
    }
  }

  getTransferDestination(transfer: MemberTransfer): string {
    return transfer.toCongregationName || 'Externa';
  }

  getTransferOrigin(transfer: MemberTransfer): string {
    return transfer.fromCongregationName || 'N/A';
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }
}
