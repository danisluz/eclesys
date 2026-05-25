import { Component, inject, signal, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { TabsModule } from 'primeng/tabs';
import { TagModule } from 'primeng/tag';
import { DividerModule } from 'primeng/divider';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { TableModule } from 'primeng/table';
import { Member, MemberTransfer } from '../../../../../shared/models/member.model';
import { MembersService } from '../../../../../shared/api/members.service';
import { OrganizationsService } from '../../../../../shared/api/organizations.service';
import { OrganizationUnit } from '../../../../../shared/api/organization-unit.model';

@Component({
  selector: 'app-member-view-dialog',
  standalone: true,
  imports: [ButtonModule, TabsModule, TagModule, DividerModule, ProgressSpinnerModule, TableModule],
  templateUrl: './member-view-dialog.component.html',
  styleUrls: ['./member-view-dialog.component.scss'],
})
export class MemberViewDialogComponent implements OnInit {
  private readonly service = inject(MembersService);
  private readonly organizationsService = inject(OrganizationsService);

  @Input() member!: Member;
  @Output() editRequested = new EventEmitter<Member>();
  @Output() transferRequested = new EventEmitter<Member>();

  transfers = signal<MemberTransfer[]>([]);
  loadingTransfers = signal(true);
  rootChurch = signal<OrganizationUnit | null>(null);

  ngOnInit() {
    this.loadRootChurch();
    this.loadTransferHistory();
  }

  loadRootChurch() {
    this.organizationsService.listAll().subscribe({
      next: (response) => {
        const rootChurch = response.data.find((org) => org.type === 'CHURCH');
        if (rootChurch) this.rootChurch.set(rootChurch);
      },
    });
  }

  loadTransferHistory() {
    this.loadingTransfers.set(true);
    this.service.getMemberTransferHistory(this.member.id).subscribe({
      next: (response) => {
        this.transfers.set(response.data);
        this.loadingTransfers.set(false);
      },
      error: () => { this.loadingTransfers.set(false); },
    });
  }

  formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('pt-BR');
  }

  formatDateTime(dateStr: string): string {
    return new Date(dateStr).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  }

  formatGender(gender: string): string { return gender === 'M' ? 'Masculino' : 'Feminino'; }

  formatMaritalStatus(status: string): string {
    const labels: Record<string, string> = { SINGLE: 'Solteiro(a)', MARRIED: 'Casado(a)', WIDOWED: 'Viúvo(a)', DIVORCED: 'Divorciado(a)', SEPARATED: 'Separado(a)' };
    return labels[status] || status;
  }

  formatRegistrationNumber(value: number | null | undefined): string {
    if (!value) return '—';
    return value.toString().padStart(6, '0');
  }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      ACTIVE: 'Ativo', INACTIVE: 'Inativo', TRANSFERRED: 'Transferido', DECEASED: 'Falecido',
      PENDING: 'Pendente', APPROVED: 'Aprovada', REJECTED: 'Rejeitada', CANCELLED: 'Cancelada',
    };
    return labels[status] || status;
  }

  getStatusSeverity(status: string): 'success' | 'info' | 'warn' | 'danger' | 'secondary' {
    const map: Record<string, 'success' | 'info' | 'warn' | 'danger' | 'secondary'> = {
      ACTIVE: 'success', APPROVED: 'success',
      PENDING: 'warn',
      INACTIVE: 'secondary', CANCELLED: 'secondary',
      TRANSFERRED: 'info',
      DECEASED: 'danger', REJECTED: 'danger',
    };
    return map[status] || 'info';
  }

  getCongregationLabel(): string { return this.rootChurch()?.congregationLabel ?? 'Congregação'; }
}
