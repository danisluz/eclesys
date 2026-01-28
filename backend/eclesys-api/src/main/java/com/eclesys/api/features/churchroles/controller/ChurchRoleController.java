package com.eclesys.api.features.churchroles.controller;

import com.eclesys.api.features.churchroles.dto.ChurchRoleResponse;
import com.eclesys.api.features.churchroles.dto.CreateChurchRoleRequest;
import com.eclesys.api.features.churchroles.dto.UpdateChurchRoleRequest;
import com.eclesys.api.features.churchroles.service.ChurchRoleService;
import com.eclesys.api.shared.api.ApiResponse;
import com.eclesys.api.features.users.service.CurrentUserService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/church-roles")
public class ChurchRoleController {

  private final ChurchRoleService service;
  private final CurrentUserService currentUserService;

  public ChurchRoleController(ChurchRoleService service, CurrentUserService currentUserService) {
    this.service = service;
    this.currentUserService = currentUserService;
  }

  @PostMapping
  public ResponseEntity<ApiResponse<ChurchRoleResponse>> create(
      @Valid @RequestBody CreateChurchRoleRequest request
  ) {
    ChurchRoleResponse response = service.create(currentUserService.getTenantId(), request);
    return ResponseEntity
        .status(HttpStatus.CREATED)
        .body(ApiResponse.success(response));
  }

  @GetMapping
  public ResponseEntity<ApiResponse<List<ChurchRoleResponse>>> listAll(
      @RequestParam(required = false) Boolean activeOnly
  ) {
    List<ChurchRoleResponse> roles = service.listAll(currentUserService.getTenantId(), activeOnly);
    return ResponseEntity.ok(ApiResponse.success(roles));
  }

  @GetMapping("/{id}")
  public ResponseEntity<ApiResponse<ChurchRoleResponse>> getById(
      @PathVariable UUID id
  ) {
    ChurchRoleResponse response = service.getById(currentUserService.getTenantId(), id);
    return ResponseEntity.ok(ApiResponse.success(response));
  }

  @PutMapping("/{id}")
  public ResponseEntity<ApiResponse<ChurchRoleResponse>> update(
      @PathVariable UUID id,
      @Valid @RequestBody UpdateChurchRoleRequest request
  ) {
    ChurchRoleResponse response = service.update(currentUserService.getTenantId(), id, request);
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
