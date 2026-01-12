package com.eclesys.api.features.users;

import com.eclesys.api.domain.user.UserRole;
import com.eclesys.api.features.users.dto.CreateUserRequest;
import com.eclesys.api.features.users.dto.UpdateUserPasswordRequest;
import com.eclesys.api.features.users.dto.UpdateUserRequest;
import jakarta.validation.Valid;
import java.util.Map;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users")
public class UserController {

  private final UserService userService;
  private final CurrentUserService currentUserService;

  public UserController(UserService userService, CurrentUserService currentUserService) {
    this.userService = userService;
    this.currentUserService = currentUserService;
  }

  @PostMapping
  @ResponseStatus(HttpStatus.CREATED)
  @PreAuthorize("hasRole('ADMIN')")
  public Map<String, Object> create(@Valid @RequestBody CreateUserRequest request) {
    UUID tenantId = currentUserService.getTenantId();
    return Map.of("status", "success", "data", userService.createUser(tenantId, request));
  }

  @GetMapping
  @PreAuthorize("hasRole('ADMIN')")
  public Map<String, Object> list(
      @RequestParam(defaultValue = "0") int page,
      @RequestParam(defaultValue = "10") int size,
      @RequestParam(required = false) String search
  ) {
    UUID tenantId = currentUserService.getTenantId();
    PageRequest pageable = PageRequest.of(page, size);
    Page<com.eclesys.api.features.users.dto.UserResponse> usersPage =
        userService.listUsers(tenantId, pageable, search);

    return Map.of(
        "status", "success",
        "data", Map.of(
            "items", usersPage.getContent(),
            "page", usersPage.getNumber(),
            "size", usersPage.getSize(),
            "totalItems", usersPage.getTotalElements(),
            "totalPages", usersPage.getTotalPages()
        )
    );
  }

  @GetMapping("/{userId}")
  @PreAuthorize("hasRole('ADMIN')")
  public Map<String, Object> get(@PathVariable UUID userId) {
    UUID tenantId = currentUserService.getTenantId();
    return Map.of("status", "success", "data", userService.getUserById(tenantId, userId));
  }

  @PatchMapping("/{userId}")
  @PreAuthorize("hasRole('ADMIN')")
  public Map<String, Object> update(@PathVariable UUID userId, @RequestBody UpdateUserRequest request) {
    UUID tenantId = currentUserService.getTenantId();
    UUID actorUserId = currentUserService.getUserId();
    UserRole actorRole = currentUserService.getRole();

    return Map.of("status", "success", "data",
        userService.updateUser(tenantId, userId, request, actorUserId, actorRole)
    );
  }

  @PatchMapping("/{userId}/password")
  @PreAuthorize("hasRole('ADMIN')")
  public Map<String, Object> updatePassword(
      @PathVariable UUID userId,
      @Valid @RequestBody UpdateUserPasswordRequest request
  ) {
    UUID tenantId = currentUserService.getTenantId();
    UUID actorUserId = currentUserService.getUserId();
    UserRole actorRole = currentUserService.getRole();

    userService.updatePassword(tenantId, userId, request, actorUserId, actorRole);

    return Map.of("status", "success", "data", Map.of("message", "Senha atualizada com sucesso"));
  }

}
