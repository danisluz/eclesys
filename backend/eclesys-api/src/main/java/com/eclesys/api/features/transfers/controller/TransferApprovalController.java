package com.eclesys.api.features.transfers.controller;

import com.eclesys.api.features.members.entity.MemberTransfer;
import com.eclesys.api.features.tenants.entity.TenantTransferApprovalSettings;
import com.eclesys.api.features.members.service.MemberService;
import com.eclesys.api.features.members.dto.MemberTransferResponse;
import com.eclesys.api.features.transfers.dto.RejectTransferRequest;
import com.eclesys.api.features.transfers.dto.UpdateApprovalSettingsRequest;
import com.eclesys.api.features.users.service.CurrentUserService;
import com.eclesys.api.features.tenants.repository.TenantTransferApprovalSettingsRepository;
import com.eclesys.api.features.transfers.service.TransferApprovalService;
import com.eclesys.api.shared.api.ApiResponse;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/transfers")
public class TransferApprovalController {

  private final TransferApprovalService approvalService;
  private final TenantTransferApprovalSettingsRepository settingsRepository;
  private final MemberService memberService;
  private final CurrentUserService currentUserService;

  public TransferApprovalController(
      TransferApprovalService approvalService,
      TenantTransferApprovalSettingsRepository settingsRepository,
      MemberService memberService,
      CurrentUserService currentUserService
  ) {
    this.approvalService = approvalService;
    this.settingsRepository = settingsRepository;
    this.memberService = memberService;
    this.currentUserService = currentUserService;
  }

  @GetMapping("/pending/for-approval")
  public ResponseEntity<ApiResponse<List<MemberTransferResponse>>> getPendingForApproval() {
    UUID tenantId = currentUserService.getTenantId();
    UUID userId = currentUserService.getUserId();

    List<MemberTransfer> transfers = approvalService.getPendingTransfersForApproval(userId, tenantId);

    List<MemberTransferResponse> response = transfers.stream()
        .map(memberService::toTransferResponse)
        .collect(Collectors.toList());

    return ResponseEntity.ok(ApiResponse.success(response));
  }

  @GetMapping("/pending/my-requests")
  public ResponseEntity<ApiResponse<List<MemberTransferResponse>>> getMyPendingRequests() {
    UUID tenantId = currentUserService.getTenantId();
    UUID userId = currentUserService.getUserId();

    List<MemberTransfer> transfers = approvalService.getPendingTransfersByRequester(userId, tenantId);

    List<MemberTransferResponse> response = transfers.stream()
        .map(memberService::toTransferResponse)
        .collect(Collectors.toList());

    return ResponseEntity.ok(ApiResponse.success(response));
  }

  @PostMapping("/{transferId}/approve")
  public ResponseEntity<ApiResponse<MemberTransferResponse>> approveTransfer(
      @PathVariable UUID transferId
  ) {
    UUID userId = currentUserService.getUserId();
    MemberTransfer transfer = approvalService.approveTransfer(transferId, userId);
    MemberTransferResponse response = memberService.toTransferResponse(transfer);
    return ResponseEntity.ok(ApiResponse.success(response));
  }

  @PostMapping("/{transferId}/reject")
  public ResponseEntity<ApiResponse<MemberTransferResponse>> rejectTransfer(
      @PathVariable UUID transferId,
      @RequestBody RejectTransferRequest request
  ) {
    UUID userId = currentUserService.getUserId();
    MemberTransfer transfer = approvalService.rejectTransfer(transferId, userId, request.reason());
    MemberTransferResponse response = memberService.toTransferResponse(transfer);
    return ResponseEntity.ok(ApiResponse.success(response));
  }

  @PostMapping("/{transferId}/cancel")
  public ResponseEntity<ApiResponse<MemberTransferResponse>> cancelTransfer(
      @PathVariable UUID transferId
  ) {
    UUID userId = currentUserService.getUserId();
    MemberTransfer transfer = approvalService.cancelTransfer(transferId, userId);
    MemberTransferResponse response = memberService.toTransferResponse(transfer);
    return ResponseEntity.ok(ApiResponse.success(response));
  }

  @GetMapping("/approval-settings")
  public ResponseEntity<ApiResponse<Map<String, Object>>> getApprovalSettings() {
    UUID tenantId = currentUserService.getTenantId();

    TenantTransferApprovalSettings settings = settingsRepository.findByTenantId(tenantId)
        .orElseThrow(() -> new EntityNotFoundException("Approval settings not found"));

    Map<String, Object> data = new HashMap<>();
    data.put("internalSameSectorApproval", settings.getInternalSameSectorApproval().name());
    data.put("internalCrossSectorApproval", settings.getInternalCrossSectorApproval().name());
    data.put("externalApproval", settings.getExternalApproval().name());
    data.put("requireJustificationOnRejection", settings.isRequireJustificationOnRejection());
    data.put("allowRequesterCancel", settings.isAllowRequesterCancel());

    return ResponseEntity.ok(ApiResponse.success(data));
  }

  @PutMapping("/approval-settings")
  public ResponseEntity<ApiResponse<Map<String, Object>>> updateApprovalSettings(
      @RequestBody UpdateApprovalSettingsRequest request
  ) {
    UUID tenantId = currentUserService.getTenantId();

    // TODO: Check if user is tenant admin using CurrentUserService.getRole()

    TenantTransferApprovalSettings settings = settingsRepository.findByTenantId(tenantId)
        .orElseThrow(() -> new EntityNotFoundException("Approval settings not found"));

    if (request.internalSameSectorApproval() != null) {
      settings.setInternalSameSectorApproval(request.internalSameSectorApproval());
    }
    if (request.internalCrossSectorApproval() != null) {
      settings.setInternalCrossSectorApproval(request.internalCrossSectorApproval());
    }
    if (request.externalApproval() != null) {
      settings.setExternalApproval(request.externalApproval());
    }
    if (request.requireJustificationOnRejection() != null) {
      settings.setRequireJustificationOnRejection(request.requireJustificationOnRejection());
    }
    if (request.allowRequesterCancel() != null) {
      settings.setAllowRequesterCancel(request.allowRequesterCancel());
    }

    TenantTransferApprovalSettings saved = settingsRepository.save(settings);

    Map<String, Object> data = new HashMap<>();
    data.put("internalSameSectorApproval", saved.getInternalSameSectorApproval().name());
    data.put("internalCrossSectorApproval", saved.getInternalCrossSectorApproval().name());
    data.put("externalApproval", saved.getExternalApproval().name());
    data.put("requireJustificationOnRejection", saved.isRequireJustificationOnRejection());
    data.put("allowRequesterCancel", saved.isAllowRequesterCancel());

    return ResponseEntity.ok(ApiResponse.success(data));
  }
}
