import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiClientService } from './api-client.service';
import { ApiResponse } from '../../core/auth/models';
import {
  MemberTransfer,
  TenantTransferApprovalSettings,
  UpdateApprovalSettingsRequest,
  RejectTransferRequest,
} from '../models/member.model';

@Injectable({
  providedIn: 'root',
})
export class TransferApprovalsService {
  private api = inject(ApiClientService);

  // ==================== LISTAGEM ====================

  /**
   * Lista transferências pendentes que o usuário pode aprovar
   */
  getPendingForApproval(): Observable<ApiResponse<MemberTransfer[]>> {
    return this.api.get<ApiResponse<MemberTransfer[]>>(
      '/transfers/pending/for-approval',
    );
  }

  /**
   * Lista solicitações próprias pendentes
   */
  getMyPendingRequests(): Observable<ApiResponse<MemberTransfer[]>> {
    return this.api.get<ApiResponse<MemberTransfer[]>>(
      '/transfers/pending/my-requests',
    );
  }

  // ==================== AÇÕES ====================

  /**
   * Aprova uma transferência
   */
  approveTransfer(transferId: string): Observable<ApiResponse<MemberTransfer>> {
    return this.api.post<ApiResponse<MemberTransfer>>(
      `/transfers/${transferId}/approve`,
      {},
    );
  }

  /**
   * Rejeita uma transferência
   */
  rejectTransfer(
    transferId: string,
    request: RejectTransferRequest,
  ): Observable<ApiResponse<MemberTransfer>> {
    return this.api.post<ApiResponse<MemberTransfer>>(
      `/transfers/${transferId}/reject`,
      request,
    );
  }

  /**
   * Cancela uma solicitação própria
   */
  cancelTransfer(transferId: string): Observable<ApiResponse<MemberTransfer>> {
    return this.api.post<ApiResponse<MemberTransfer>>(
      `/transfers/${transferId}/cancel`,
      {},
    );
  }

  // ==================== CONFIGURAÇÕES ====================

  /**
   * Obtém configurações de aprovação do tenant
   */
  getApprovalSettings(): Observable<
    ApiResponse<TenantTransferApprovalSettings>
  > {
    return this.api.get<ApiResponse<TenantTransferApprovalSettings>>(
      '/transfers/approval-settings',
    );
  }

  /**
   * Atualiza configurações de aprovação do tenant (admin only)
   */
  updateApprovalSettings(
    request: UpdateApprovalSettingsRequest,
  ): Observable<ApiResponse<TenantTransferApprovalSettings>> {
    return this.api.put<ApiResponse<TenantTransferApprovalSettings>>(
      '/transfers/approval-settings',
      request,
    );
  }
}
