package com.eclesys.api.service;

import com.eclesys.api.domain.member.Member;
import com.eclesys.api.domain.member.MemberStatus;
import com.eclesys.api.domain.member.MemberTransfer;
import com.eclesys.api.domain.member.MemberTransferRepository;
import com.eclesys.api.domain.member.TransferStatus;
import com.eclesys.api.domain.organization.OrganizationUnit;
import com.eclesys.api.domain.organization.OrganizationUnitType;
import com.eclesys.api.domain.tenant.ApprovalLevel;
import com.eclesys.api.domain.tenant.TenantTransferApprovalSettings;
import com.eclesys.api.domain.user.OrganizationRole;
import com.eclesys.api.domain.user.UserEntity;
import com.eclesys.api.domain.user.UserOrganizationRole;
import com.eclesys.api.domain.user.UserRepository;
import com.eclesys.api.domain.user.UserRole;
import com.eclesys.api.repository.TenantTransferApprovalSettingsRepository;
import com.eclesys.api.repository.UserOrganizationRoleRepository;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
public class TransferApprovalService {

  private final MemberTransferRepository transferRepository;
  private final TenantTransferApprovalSettingsRepository settingsRepository;
  private final UserOrganizationRoleRepository userRoleRepository;
  private final UserRepository userRepository;

  public TransferApprovalService(
      MemberTransferRepository transferRepository,
      TenantTransferApprovalSettingsRepository settingsRepository,
      UserOrganizationRoleRepository userRoleRepository,
      UserRepository userRepository
  ) {
    this.transferRepository = transferRepository;
    this.settingsRepository = settingsRepository;
    this.userRoleRepository = userRoleRepository;
    this.userRepository = userRepository;
  }

  /**
   * Determines the required approval level for a transfer based on transfer type and tenant settings
   */
  public ApprovalLevel determineRequiredApprovalLevel(MemberTransfer transfer) {
    TenantTransferApprovalSettings settings = settingsRepository
        .findByTenantId(transfer.getTenant().getId())
        .orElseThrow(() -> new EntityNotFoundException("Tenant approval settings not found"));

    // External transfer
    if (transfer.getToCongregation() == null) {
      return settings.getExternalApproval();
    }

    // Internal transfer - check if same sector or cross-sector
    OrganizationUnit fromSector = findParentSector(transfer.getFromCongregation());
    OrganizationUnit toSector = findParentSector(transfer.getToCongregation());

    if (fromSector != null && fromSector.getId().equals(toSector.getId())) {
      // Same sector
      return settings.getInternalSameSectorApproval();
    } else {
      // Cross sector
      return settings.getInternalCrossSectorApproval();
    }
  }

  /**
   * Finds the parent sector of a congregation
   */
  private OrganizationUnit findParentSector(OrganizationUnit congregation) {
    OrganizationUnit current = congregation.getParent();
    while (current != null) {
      if (current.getType() == OrganizationUnitType.SECTOR) {
        return current;
      }
      current = current.getParent();
    }
    return null;
  }

  /**
   * Finds the parent church of an organizational unit
   */
  private OrganizationUnit findParentChurch(OrganizationUnit unit) {
    OrganizationUnit current = unit;
    while (current != null) {
      if (current.getType() == OrganizationUnitType.CHURCH) {
        return current;
      }
      current = current.getParent();
    }
    return null;
  }

  /**
   * Checks if a user can approve a specific transfer
   */
  public boolean canUserApprove(UUID userId, MemberTransfer transfer) {
    ApprovalLevel requiredLevel = determineRequiredApprovalLevel(transfer);
    
    System.out.println("=== CAN USER APPROVE DEBUG ===");
    System.out.println("User ID: " + userId);
    System.out.println("Transfer ID: " + transfer.getId());
    System.out.println("Required Level: " + requiredLevel);
    System.out.println("Requested By: " + (transfer.getRequestedBy() != null ? transfer.getRequestedBy().getId() : "null"));

    // Cannot approve own requests
    if (transfer.getRequestedBy() != null && transfer.getRequestedBy().getId().equals(userId)) {
      System.out.println("❌ BLOCKED: User cannot approve own request");
      return false;
    }

    // Check if user is ADMIN or SECRETARIA first - both can approve anything
    UserEntity user = userRepository.findById(userId)
        .orElseThrow(() -> new EntityNotFoundException("User not found"));
    
    if (user.getRole() == UserRole.ADMIN) {
      System.out.println("✅ APPROVED: User is ADMIN (can approve any level)");
      return true;
    }
    
    if (user.getRole() == UserRole.SECRETARIA) {
      System.out.println("✅ APPROVED: User is SECRETARIA (can approve any level)");
      return true;
    }

    switch (requiredLevel) {
      case AUTO:
        System.out.println("❌ BLOCKED: AUTO approval doesn't need manual approval");
        return false; // AUTO approvals don't need manual approval

      case SECRETARY_CONGREGATION:
        // TODO: Refatorar para buscar o ID da FunctionRole "Secretária" dinamicamente
        // User must be secretary of the destination congregation
        System.out.println("⚠️ WARNING: SECRETARY role validation temporarily disabled - requires FunctionRole refactor");
        return true; // Temporário: permitir até refatorar

      case SECRETARY_SECTOR:
        // TODO: Refatorar para buscar o ID da FunctionRole "Secretária" dinamicamente
        // User must be secretary of the destination sector
        System.out.println("⚠️ WARNING: SECRETARY role validation temporarily disabled - requires FunctionRole refactor");
        return true; // Temporário: permitir até refatorar

      case SECRETARY_CHURCH:
        // TODO: Refatorar para buscar o ID da FunctionRole "Secretária" dinamicamente
        // User must be secretary of the church
        System.out.println("⚠️ WARNING: SECRETARY role validation temporarily disabled - requires FunctionRole refactor");
        return true; // Temporário: permitir até refatorar

      case ADMIN:
        // Already checked above, but for completeness
        System.out.println("❌ BLOCKED: Requires ADMIN but user is not admin");
        return false;

      default:
        System.out.println("❌ BLOCKED: Unknown approval level");
        return false;
    }
  }

  /**
   * Checks if a user has a specific role in an organizational unit
   * TODO: Refatorar para usar FunctionRole ao invés de enum
   */
  private boolean hasRoleInUnit(UUID userId, UUID unitId, UUID functionRoleId) {
    return userRoleRepository
        .findByUserIdAndOrganizationUnitIdAndFunctionRoleId(userId, unitId, functionRoleId)
        .isPresent();
  }

  /**
   * Approves a transfer and executes it
   */
  @Transactional
  public MemberTransfer approveTransfer(UUID transferId, UUID approvingUserId) {
    MemberTransfer transfer = transferRepository.findById(transferId)
        .orElseThrow(() -> new EntityNotFoundException("Transfer not found"));

    if (transfer.getStatus() != TransferStatus.PENDING) {
      throw new IllegalStateException("Only pending transfers can be approved");
    }

    if (!canUserApprove(approvingUserId, transfer)) {
      throw new SecurityException("User does not have permission to approve this transfer");
    }

    UserEntity approver = userRepository.findById(approvingUserId)
        .orElseThrow(() -> new EntityNotFoundException("User not found"));

    transfer.setStatus(TransferStatus.APPROVED);
    transfer.setApprovedBy(approver);
    transfer.setApprovedAt(LocalDateTime.now());

    // Execute the transfer by updating member's congregation and status
    Member member = transfer.getMember();
    
    if (transfer.getToCongregation() != null) {
      // Internal transfer - moving to a congregation
      member.setOrganizationUnit(transfer.getToCongregation());
      member.setStatus(MemberStatus.ACTIVE); // Member is now active in new congregation
    } else {
      // External transfer - leaving the church
      member.setOrganizationUnit(null);
      member.setStatus(MemberStatus.TRANSFERRED); // Member has left
    }

    return transferRepository.save(transfer);
  }

  /**
   * Rejects a transfer
   */
  @Transactional
  public MemberTransfer rejectTransfer(UUID transferId, UUID rejectingUserId, String reason) {
    MemberTransfer transfer = transferRepository.findById(transferId)
        .orElseThrow(() -> new EntityNotFoundException("Transfer not found"));

    if (transfer.getStatus() != TransferStatus.PENDING) {
      throw new IllegalStateException("Only pending transfers can be rejected");
    }

    if (!canUserApprove(rejectingUserId, transfer)) {
      throw new SecurityException("User does not have permission to reject this transfer");
    }

    TenantTransferApprovalSettings settings = settingsRepository
        .findByTenantId(transfer.getTenant().getId())
        .orElseThrow(() -> new EntityNotFoundException("Tenant approval settings not found"));

    if (settings.isRequireJustificationOnRejection() && (reason == null || reason.trim().isEmpty())) {
      throw new IllegalArgumentException("Justification is required for rejection");
    }

    UserEntity rejecter = userRepository.findById(rejectingUserId)
        .orElseThrow(() -> new EntityNotFoundException("User not found"));

    transfer.setStatus(TransferStatus.REJECTED);
    transfer.setApprovedBy(rejecter);
    transfer.setApprovedAt(LocalDateTime.now());
    transfer.setRejectionReason(reason);

    return transferRepository.save(transfer);
  }

  /**
   * Cancels a pending transfer (if allowed by tenant settings)
   */
  @Transactional
  public MemberTransfer cancelTransfer(UUID transferId, UUID cancellingUserId) {
    MemberTransfer transfer = transferRepository.findById(transferId)
        .orElseThrow(() -> new EntityNotFoundException("Transfer not found"));

    if (transfer.getStatus() != TransferStatus.PENDING) {
      throw new IllegalStateException("Only pending transfers can be cancelled");
    }

    TenantTransferApprovalSettings settings = settingsRepository
        .findByTenantId(transfer.getTenant().getId())
        .orElseThrow(() -> new EntityNotFoundException("Tenant approval settings not found"));

    if (!settings.isAllowRequesterCancel()) {
      throw new SecurityException("Requester cancellation is not allowed by tenant settings");
    }

    // Only the requester can cancel their own request
    if (!transfer.getRequestedBy().getId().equals(cancellingUserId)) {
      throw new SecurityException("Only the requester can cancel this transfer");
    }

    transfer.setStatus(TransferStatus.CANCELLED);

    return transferRepository.save(transfer);
  }

  /**
   * Lists all pending transfers that a user can approve
   */
  public List<MemberTransfer> getPendingTransfersForApproval(UUID userId, UUID tenantId) {
    System.out.println("=== GET PENDING TRANSFERS FOR APPROVAL ===");
    System.out.println("User ID: " + userId);
    System.out.println("Tenant ID: " + tenantId);
    
    List<MemberTransfer> allPending = transferRepository.findByTenantIdAndStatus(tenantId, TransferStatus.PENDING);
    System.out.println("Total pending transfers: " + allPending.size());
    
    for (MemberTransfer transfer : allPending) {
      System.out.println("\n--- Checking transfer: " + transfer.getId());
      boolean canApprove = canUserApprove(userId, transfer);
      System.out.println("Can approve: " + canApprove);
    }
    
    List<MemberTransfer> result = allPending.stream()
        .filter(transfer -> canUserApprove(userId, transfer))
        .toList();
        
    System.out.println("\nFiltered result count: " + result.size());
    return result;
  }

  /**
   * Lists all pending transfers requested by a user
   */
  public List<MemberTransfer> getPendingTransfersByRequester(UUID requesterId, UUID tenantId) {
    return transferRepository.findByTenantIdAndRequestedByIdAndStatus(tenantId, requesterId, TransferStatus.PENDING);
  }
}
