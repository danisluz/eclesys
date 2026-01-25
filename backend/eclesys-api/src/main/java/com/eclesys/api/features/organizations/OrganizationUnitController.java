package com.eclesys.api.features.organizations;

import com.eclesys.api.features.organizations.dto.CreateOrganizationUnitRequest;
import com.eclesys.api.features.organizations.dto.OrganizationUnitResponse;
import com.eclesys.api.features.organizations.dto.UpdateOrganizationUnitRequest;
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

  public OrganizationUnitController(OrganizationUnitService service) {
    this.service = service;
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

  @SuppressWarnings("unchecked")
  private UUID getTenantId(Authentication authentication) {
    Map<String, Object> claims = (Map<String, Object>) authentication.getPrincipal();
    return UUID.fromString(String.valueOf(claims.get("tenantId")));
  }
}
