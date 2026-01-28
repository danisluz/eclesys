import { Component, Inject, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { Member, MemberTransfer } from '../../../../../shared/models/member.model';
import { MembersService } from '../../../../../shared/api/members.service';
import { OrganizationsService } from '../../../../../shared/api/organizations.service';
import { OrganizationUnit } from '../../../../../shared/api/organization-unit.model';

@Component({
  selector: 'app-member-view-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatTabsModule,
    MatChipsModule,
    MatDividerModule,
    MatProgressSpinnerModule,
    MatTableModule,
  ],
  templateUrl: './member-view-dialog.component.html',
  styleUrls: ['./member-view-dialog.component.scss'],

})
export class MemberViewDialogComponent implements OnInit {
  private service = inject(MembersService);
  private organizationsService = inject(OrganizationsService);

  transfers = signal<MemberTransfer[]>([]);
  loadingTransfers = signal(true);
  rootChurch = signal<OrganizationUnit | null>(null);

  displayedColumns = ['date', 'from', 'to', 'reason', 'status', 'processedBy'];

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: { member: Member },
    private dialogRef: MatDialogRef<MemberViewDialogComponent>,
  ) {
    console.log(
      '🏗️ MemberViewDialogComponent construído com membro:',
      data.member,
    );
  }

  ngOnInit() {
    console.log('🚀 ngOnInit executado, carregando histórico...');
    this.loadRootChurch();
    this.loadTransferHistory();
  }

  loadRootChurch() {
    this.organizationsService.listAll().subscribe({
      next: (response) => {
        const rootChurch = response.data.find((org) => org.type === 'CHURCH');
        if (rootChurch) {
          this.rootChurch.set(rootChurch);
        }
      },
      error: (err) => {
        console.error('❌ Erro ao carregar organizações:', err);
      },
    });
  }

  loadTransferHistory() {
    this.loadingTransfers.set(true);
    console.log('🔍 Carregando histórico para membro:', this.data.member.id);
    this.service.getMemberTransferHistory(this.data.member.id).subscribe({
      next: (response) => {
        console.log('✅ Histórico recebido:', response);
        console.log('📊 Total de transferências:', response.data?.length);
        console.log('📋 Transferências:', response.data);
        this.transfers.set(response.data);
        console.log('✔️ Signal atualizado, valor atual:', this.transfers());
        this.loadingTransfers.set(false);
      },
      error: (err) => {
        console.error('❌ Erro ao carregar histórico:', err);
        this.loadingTransfers.set(false);
      },
    });
  }

  formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString('pt-BR');
  }

  formatDateTime(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  formatGender(gender: string): string {
    return gender === 'M' ? 'Masculino' : 'Feminino';
  }

  formatMaritalStatus(status: string): string {
    const labels: Record<string, string> = {
      SINGLE: 'Solteiro(a)',
      MARRIED: 'Casado(a)',
      WIDOWED: 'Viúvo(a)',
      DIVORCED: 'Divorciado(a)',
      SEPARATED: 'Separado(a)',
    };
    return labels[status] || status;
  }

  formatRegistrationNumber(value: number | null | undefined): string {
    if (!value) {
      return '—';
    }
    return value.toString().padStart(6, '0');
  }

  getStatusLabel(status: string): string {
    // Labels para status de membro
    const memberStatusLabels: Record<string, string> = {
      ACTIVE: 'Ativo',
      INACTIVE: 'Inativo',
      TRANSFERRED: 'Transferido',
      DECEASED: 'Falecido',
    };

    // Labels para status de transferência
    const transferStatusLabels: Record<string, string> = {
      PENDING: 'Pendente',
      APPROVED: 'Aprovada',
      REJECTED: 'Rejeitada',
      CANCELLED: 'Cancelada',
    };

    return transferStatusLabels[status] || memberStatusLabels[status] || status;
  }
  getCongregationLabel(): string {
    return this.rootChurch()?.congregationLabel ?? 'Congregação';
  }
}
