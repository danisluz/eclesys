import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { TransferApprovalsService } from '../../../../../shared/api/transfer-approvals.service';
import { MemberTransfer } from '../../../../../shared/models/member.model';
import { RejectDialogComponent } from '../../dialogs/reject-dialog/reject-dialog.component';
import { NotificationService } from '../../../../../shared/services/notification.service';

@Component({
  selector: 'app-pending-approvals',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatTabsModule,
    MatTableModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    MatDialogModule,
  ],
  templateUrl: './pending-approvals.component.html',
  styleUrls: ['./pending-approvals.component.scss'],
})
export class PendingApprovalsComponent implements OnInit {
  private readonly approvalsService = inject(TransferApprovalsService);
  private readonly notificationService = inject(NotificationService);
  private readonly dialog = inject(MatDialog);

  forApproval = signal<MemberTransfer[]>([]);
  myRequests = signal<MemberTransfer[]>([]);
  loading = signal(false);

  displayedColumnsForApproval: string[] = [
    'memberName',
    'fromTo',
    'reason',
    'requestedBy',
    'createdAt',
    'actions',
  ];

  displayedColumnsMyRequests: string[] = [
    'memberName',
    'fromTo',
    'reason',
    'createdAt',
    'actions',
  ];

  ngOnInit(): void {
    this.loadPendingTransfers();
  }

  loadPendingTransfers(): void {
    this.loading.set(true);

    // Carregar aprovações pendentes
    this.approvalsService.getPendingForApproval().subscribe({
      next: (response) => {
        console.log('Response getPendingForApproval:', response);
        if (response.status === 'success') {
          console.log('Dados forApproval:', response.data);
          this.forApproval.set(response.data);
          console.log('forApproval signal após set:', this.forApproval());
        }
      },
      error: (err) => {
        console.error('Erro ao carregar aprovações pendentes:', err);
      },
    });

    // Carregar minhas solicitações
    this.approvalsService.getMyPendingRequests().subscribe({
      next: (response) => {
        console.log('Response getMyPendingRequests:', response);
        if (response.status === 'success') {
          console.log('Dados myRequests:', response.data);
          this.myRequests.set(response.data);
          console.log('myRequests signal após set:', this.myRequests());
        }
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Erro ao carregar minhas solicitações:', err);
        this.loading.set(false);
      },
    });
  }

  approveTransfer(transfer: MemberTransfer): void {
    this.approvalsService.approveTransfer(transfer.id).subscribe({
      next: (response) => {
        if (response.status === 'success') {
          this.notificationService.success('Transferência aprovada com sucesso');
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
    const dialogRef = this.dialog.open(RejectDialogComponent, {
      width: '500px',
      data: { transfer },
    });

    dialogRef.afterClosed().subscribe((reason: string | undefined) => {
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
            this.notificationService.success('Solicitação cancelada com sucesso');
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
    if (transfer.toCongregationName) {
      return transfer.toCongregationName;
    }
    return 'Externa';
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
