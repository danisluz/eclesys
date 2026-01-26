package com.eclesys.api.features.organizations;

import com.eclesys.api.features.organizations.dto.*;
import com.eclesys.api.shared.api.ApiResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/organizations")
public class OrganizationUnitController {

  private final OrganizationUnitService service;
  private final OrganizationRoleService roleService;

  public OrganizationUnitController(
      OrganizationUnitService service,
      OrganizationRoleService roleService
  ) {
    this.service = service;
    this.roleService = roleService;
  }

  @PostMapping
  public ResponseEntity<ApiResponse<OrganizationUnitResponse>> create(
      @Valid @RequestBody CreateOrganizationUnitRequest request,
      Authentication authentication
  ) {
    UUID tenantId = getTenantId(authentication);
    OrganizationUnitResponse response = service.create(tenantId, request);
    return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(response));
  }

  @GetMapping
  public ResponseEntity<ApiResponse<List<OrganizationUnitResponse>>> listAll(
      Authentication authentication
  ) {
    System.out.println("[OrganizationUnitController] listAll called");
    System.out.println("[OrganizationUnitController] Authentication: " + authentication);
    System.out.println("[OrganizationUnitController] Principal: " + authentication.getPrincipal());
    
    UUID tenantId = getTenantId(authentication);
    System.out.println("[OrganizationUnitController] TenantId: " + tenantId);
    
    List<OrganizationUnitResponse> response = service.listAll(tenantId);
    return ResponseEntity.ok(ApiResponse.success(response));
  }

  @GetMapping("/{id}")
  public ResponseEntity<ApiResponse<OrganizationUnitResponse>> getById(
      @PathVariable UUID id,
      Authentication authentication
  ) {
    UUID tenantId = getTenantId(authentication);
    OrganizationUnitResponse response = service.getById(tenantId, id);
    return ResponseEntity.ok(ApiResponse.success(response));
  }

  @PutMapping("/{id}")
  public ResponseEntity<ApiResponse<OrganizationUnitResponse>> update(
      @PathVariable UUID id,
      @Valid @RequestBody UpdateOrganizationUnitRequest request,
      Authentication authentication
  ) {
    UUID tenantId = getTenantId(authentication);
    OrganizationUnitResponse response = service.update(tenantId, id, request);
    return ResponseEntity.ok(ApiResponse.success(response));
  }

  @DeleteMapping("/{id}")
  public ResponseEntity<ApiResponse<Void>> delete(
      @PathVariable UUID id,
      Authentication authentication
  ) {
    UUID tenantId = getTenantId(authentication);
    service.delete(tenantId, id);
    return ResponseEntity.ok(ApiResponse.success(null));
  }

  // ===== ENDPOINTS DE CARGOS ADMINISTRATIVOS =====

  @PostMapping("/{organizationUnitId}/roles")
  public ResponseEntity<ApiResponse<RoleAssignmentResponse>> assignRole(
      @PathVariable UUID organizationUnitId,
      @Valid @RequestBody AssignRoleRequest request,
      Authentication authentication
  ) {
    System.out.println("[assignRole] organizationUnitId: " + organizationUnitId);
    System.out.println("[assignRole] request: " + request);
    System.out.println("[assignRole] authentication: " + authentication);
    System.out.println("[assignRole] principal: " + authentication.getPrincipal());
    
    UUID tenantId = getTenantId(authentication);
    System.out.println("[assignRole] tenantId: " + tenantId);
    
    UUID requestingUserId = getUserId(authentication);
    System.out.println("[assignRole] requestingUserId: " + requestingUserId);
    
    RoleAssignmentResponse response = roleService.assignRole(tenantId, requestingUserId, organizationUnitId, request);
    return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(response));
  }

  @DeleteMapping("/{organizationUnitId}/roles/{userId}/{functionRoleId}")
  public ResponseEntity<ApiResponse<Void>> removeRole(
      @PathVariable UUID organizationUnitId,
      @PathVariable UUID userId,
      @PathVariable UUID functionRoleId,
      Authentication authentication
  ) {
    UUID tenantId = getTenantId(authentication);
    UUID requestingUserId = getUserId(authentication);
    roleService.removeRole(tenantId, requestingUserId, organizationUnitId, userId, functionRoleId);
    return ResponseEntity.ok(ApiResponse.success(null));
  }

  @GetMapping("/{organizationUnitId}/roles")
  public ResponseEntity<ApiResponse<List<RoleAssignmentResponse>>> listRoles(
      @PathVariable UUID organizationUnitId,
      Authentication authentication
  ) {
    UUID tenantId = getTenantId(authentication);
    List<RoleAssignmentResponse> response = roleService.listRolesByOrganizationUnit(tenantId, organizationUnitId);
    return ResponseEntity.ok(ApiResponse.success(response));
  }

  // ===== MÉTODOS AUXILIARES =====

  @SuppressWarnings("unchecked")
  private UUID getTenantId(Authentication authentication) {
    Map<String, Object> claims = (Map<String, Object>) authentication.getPrincipal();
    System.out.println("[getTenantId] claims: " + claims);
    String tenantIdStr = String.valueOf(claims.get("tenantId"));
    System.out.println("[getTenantId] tenantIdStr: " + tenantIdStr);
    return UUID.fromString(tenantIdStr);
  }

  @SuppressWarnings("unchecked")
  private UUID getUserId(Authentication authentication) {
    Map<String, Object> claims = (Map<String, Object>) authentication.getPrincipal();
    System.out.println("[getUserId] claims: " + claims);
    String userIdStr = String.valueOf(claims.get("userId"));
    System.out.println("[getUserId] userIdStr: " + userIdStr);
    return UUID.fromString(userIdStr);
  }
}
