package com.eclesys.api.features.tenants.controller;

import com.eclesys.api.features.tenants.dto.TenantLogoResponse;
import com.eclesys.api.features.tenants.service.TenantLogoService;
import com.eclesys.api.features.users.entity.UserRole;
import com.eclesys.api.features.users.service.CurrentUserService;
import com.eclesys.api.shared.api.ApiResponse;
import com.eclesys.api.shared.api.ForbiddenException;
import java.nio.file.Path;
import java.util.concurrent.TimeUnit;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.CacheControl;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
public class TenantLogoController {

  private final TenantLogoService tenantLogoService;
  private final CurrentUserService currentUserService;

  public TenantLogoController(
      TenantLogoService tenantLogoService,
      CurrentUserService currentUserService
  ) {
    this.tenantLogoService = tenantLogoService;
    this.currentUserService = currentUserService;
  }

  @PostMapping(value = "/api/tenants/logo", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
  public ResponseEntity<ApiResponse<TenantLogoResponse>> uploadLogo(
      @RequestParam("file") MultipartFile file
  ) {
    if (currentUserService.getRole() != UserRole.ADMIN) {
      throw new ForbiddenException("forbidden");
    }

    String logoUrl = tenantLogoService.uploadLogo(currentUserService.getTenantId(), file);
    return ResponseEntity.ok(ApiResponse.success(new TenantLogoResponse(logoUrl)));
  }

  @DeleteMapping("/api/tenants/logo")
  public ResponseEntity<ApiResponse<TenantLogoResponse>> removeLogo() {
    if (currentUserService.getRole() != UserRole.ADMIN) {
      throw new ForbiddenException("forbidden");
    }

    tenantLogoService.removeLogo(currentUserService.getTenantId());
    return ResponseEntity.ok(ApiResponse.success(new TenantLogoResponse(null)));
  }

  @GetMapping("/api/public/tenants/{tenantCode}/logo")
  public ResponseEntity<Resource> getLogo(@PathVariable String tenantCode) {
    Path logoPath = tenantLogoService.loadLogoPath(tenantCode);
    Resource resource = new FileSystemResource(logoPath);

    return ResponseEntity.ok()
        .contentType(MediaType.IMAGE_PNG)
        .cacheControl(CacheControl.maxAge(30, TimeUnit.DAYS).cachePublic())
        .body(resource);
  }
}
