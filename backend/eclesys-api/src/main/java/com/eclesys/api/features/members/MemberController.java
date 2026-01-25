package com.eclesys.api.features.members;

import com.eclesys.api.domain.member.MemberStatus;
import com.eclesys.api.features.members.dto.CreateMemberRequest;
import com.eclesys.api.features.members.dto.MemberHistoryResponse;
import com.eclesys.api.features.members.dto.MemberPositionHistoryResponse;
import com.eclesys.api.features.members.dto.MemberResponse;
import com.eclesys.api.features.members.dto.MemberTransferResponse;
import com.eclesys.api.features.members.dto.TransferMemberRequest;
import com.eclesys.api.features.members.dto.UpdateMemberRequest;
import com.eclesys.api.features.users.CurrentUserService;
import com.eclesys.api.shared.api.ApiResponse;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/members")
public class MemberController {

  private final MemberService service;
  private final CurrentUserService currentUserService;

  public MemberController(MemberService service, CurrentUserService currentUserService) {
    this.service = service;
    this.currentUserService = currentUserService;
  }

  @PostMapping
  public ResponseEntity<ApiResponse<MemberResponse>> create(
      @Valid @RequestBody CreateMemberRequest request
  ) {
    MemberResponse response = service.create(currentUserService.getTenantId(), request);
    return ResponseEntity
        .status(HttpStatus.CREATED)
        .body(ApiResponse.success(response));
  }

  @GetMapping
  public ResponseEntity<ApiResponse<Page<MemberResponse>>> listAll(
      @RequestParam(required = false) MemberStatus status,
      @RequestParam(required = false) String search,
      @RequestParam(required = false) List<UUID> organizationUnitIds,
      @RequestParam(required = false) UUID churchRoleId,
      @RequestParam(defaultValue = "0") int page,
      @RequestParam(defaultValue = "50") int size,
      @RequestParam(defaultValue = "fullName") String sortBy,
      @RequestParam(defaultValue = "asc") String sortDir
  ) {
    Sort sort = sortDir.equalsIgnoreCase("desc") 
        ? Sort.by(sortBy).descending() 
        : Sort.by(sortBy).ascending();
    Pageable pageable = PageRequest.of(page, size, sort);
    
    Page<MemberResponse> members = service.listAll(
        currentUserService.getTenantId(), 
        status, 
        search, 
        organizationUnitIds,
        churchRoleId,
        pageable
    );
    return ResponseEntity.ok(ApiResponse.success(members));
  }

  @GetMapping("/{id}")
  public ResponseEntity<ApiResponse<MemberResponse>> getById(
      @PathVariable UUID id
  ) {
    MemberResponse response = service.getById(currentUserService.getTenantId(), id);
    return ResponseEntity.ok(ApiResponse.success(response));
  }

  @PutMapping("/{id}")
  public ResponseEntity<ApiResponse<MemberResponse>> update(
      @PathVariable UUID id,
      @Valid @RequestBody UpdateMemberRequest request
  ) {
    MemberResponse response = service.update(
        currentUserService.getTenantId(), 
        id, 
        request, 
        currentUserService.getUserId()
    );
    return ResponseEntity.ok(ApiResponse.success(response));
  }

  @DeleteMapping("/{id}")
  public ResponseEntity<ApiResponse<Void>> delete(
      @PathVariable UUID id
  ) {
    service.delete(currentUserService.getTenantId(), id);
    return ResponseEntity.ok(ApiResponse.success(null));
  }

  // ==================== TRANSFERÊNCIAS ====================

  @PostMapping("/{id}/transfer")
  public ResponseEntity<ApiResponse<MemberTransferResponse>> transferMember(
      @PathVariable UUID id,
      @Valid @RequestBody TransferMemberRequest request
  ) {
    MemberTransferResponse response = service.transferMember(
        currentUserService.getTenantId(),
        id,
        request,
        currentUserService.getUserId()
    );
    return ResponseEntity.ok(ApiResponse.success(response));
  }

  @GetMapping("/{id}/transfers")
  public ResponseEntity<ApiResponse<List<MemberTransferResponse>>> getMemberTransferHistory(
      @PathVariable UUID id
  ) {
    List<MemberTransferResponse> response = service.getMemberTransferHistory(
        currentUserService.getTenantId(),
        id
    );
    return ResponseEntity.ok(ApiResponse.success(response));
  }

  @GetMapping("/{id}/positions")
  public ResponseEntity<ApiResponse<List<MemberPositionHistoryResponse>>> getMemberPositionHistory(
      @PathVariable UUID id
  ) {
    List<MemberPositionHistoryResponse> response = service.getMemberPositionHistory(
        currentUserService.getTenantId(),
        id
    );
    return ResponseEntity.ok(ApiResponse.success(response));
  }

  @GetMapping("/{id}/history")
  public ResponseEntity<ApiResponse<List<MemberHistoryResponse>>> getMemberHistory(
      @PathVariable UUID id
  ) {
    List<MemberHistoryResponse> response = service.getMemberHistory(
        currentUserService.getTenantId(),
        id
    );
    return ResponseEntity.ok(ApiResponse.success(response));
  }

  @GetMapping("/transfers")
  public ResponseEntity<ApiResponse<List<MemberTransferResponse>>> getAllTransfers() {
    List<MemberTransferResponse> response = service.getAllTransfers(currentUserService.getTenantId());
    return ResponseEntity.ok(ApiResponse.success(response));
  }
}
