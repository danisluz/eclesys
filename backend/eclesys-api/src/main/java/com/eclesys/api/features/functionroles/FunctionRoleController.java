package com.eclesys.api.features.functionroles;

import com.eclesys.api.features.functionroles.dto.CreateFunctionRoleRequest;
import com.eclesys.api.features.functionroles.dto.FunctionRoleResponse;
import com.eclesys.api.features.functionroles.dto.UpdateFunctionRoleRequest;
import com.eclesys.api.features.users.CurrentUserService;
import com.eclesys.api.shared.api.ApiResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/function-roles")
public class FunctionRoleController {

  private final FunctionRoleService service;
  private final CurrentUserService currentUserService;

  public FunctionRoleController(FunctionRoleService service, CurrentUserService currentUserService) {
    this.service = service;
    this.currentUserService = currentUserService;
  }

  @PostMapping
  public ResponseEntity<ApiResponse<FunctionRoleResponse>> create(
      @Valid @RequestBody CreateFunctionRoleRequest request
  ) {
    FunctionRoleResponse response = service.create(currentUserService.getTenantId(), request);
    return ResponseEntity
        .status(HttpStatus.CREATED)
        .body(ApiResponse.success(response));
  }

  @GetMapping
  public ResponseEntity<ApiResponse<List<FunctionRoleResponse>>> listAll(
      @RequestParam(required = false) Boolean activeOnly
  ) {
    List<FunctionRoleResponse> roles = service.listAll(currentUserService.getTenantId(), activeOnly);
    return ResponseEntity.ok(ApiResponse.success(roles));
  }

  @GetMapping("/{id}")
  public ResponseEntity<ApiResponse<FunctionRoleResponse>> getById(
      @PathVariable UUID id
  ) {
    FunctionRoleResponse response = service.getById(currentUserService.getTenantId(), id);
    return ResponseEntity.ok(ApiResponse.success(response));
  }

  @PutMapping("/{id}")
  public ResponseEntity<ApiResponse<FunctionRoleResponse>> update(
      @PathVariable UUID id,
      @Valid @RequestBody UpdateFunctionRoleRequest request
  ) {
    FunctionRoleResponse response = service.update(currentUserService.getTenantId(), id, request);
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
