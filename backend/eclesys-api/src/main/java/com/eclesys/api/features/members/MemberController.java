package com.eclesys.api.features.members;

import com.eclesys.api.domain.member.MemberStatus;
import com.eclesys.api.features.members.dto.CreateMemberRequest;
import com.eclesys.api.features.members.dto.MemberResponse;
import com.eclesys.api.features.members.dto.UpdateMemberRequest;
import com.eclesys.api.features.users.CurrentUserService;
import com.eclesys.api.shared.api.ApiResponse;
import jakarta.validation.Valid;
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
  public ResponseEntity<ApiResponse<List<MemberResponse>>> listAll(
      @RequestParam(required = false) MemberStatus status,
      @RequestParam(required = false) String search
  ) {
    List<MemberResponse> members = service.listAll(currentUserService.getTenantId(), status, search);
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
    MemberResponse response = service.update(currentUserService.getTenantId(), id, request);
    return ResponseEntity.ok(ApiResponse.success(response));
  }

  @DeleteMapping("/{id}")
  public ResponseEntity<ApiResponse<Void>> delete(
      @PathVariable UUID id
  ) {
    service.delete(currentUserService.getTenantId(), id);
    return ResponseEntity.ok(ApiResponse.success(null));
  }
}
