package com.eclesys.api.features.users;

import com.eclesys.api.domain.user.UserRole;
import com.eclesys.api.features.users.dto.CreateUserRequest;
import com.eclesys.api.features.users.dto.UpdateUserPasswordRequest;
import com.eclesys.api.features.users.dto.UpdateUserRequest;
import com.eclesys.api.features.users.dto.UserResponse;
import com.eclesys.api.shared.api.ForbiddenException;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.eclesys.api.domain.user.UserEntity;
import com.eclesys.api.domain.user.UserRepository;


@Service
public class UserService {

  private final UserRepository userRepository;
  private final PasswordEncoder passwordEncoder;

  public UserService(UserRepository userRepository, PasswordEncoder passwordEncoder) {
    this.userRepository = userRepository;
    this.passwordEncoder = passwordEncoder;
  }

  @Transactional
  public UserResponse createUser(UUID tenantId, CreateUserRequest request) {
    if (userRepository.existsByTenantIdAndEmail(tenantId, request.email())) {
      throw new IllegalArgumentException("E-mail já cadastrado para esta igreja");
    }

    UserEntity  user = new UserEntity ();
    user.setTenantId(tenantId);
    user.setName(request.name());
    user.setEmail(request.email());
    user.setPasswordHash(passwordEncoder.encode(request.password()));
    user.setRole(request.role());
    user.setActive(true);

    return map(userRepository.save(user));
  }

  @Transactional(readOnly = true)
  public Page<UserResponse> listUsers(UUID tenantId, Pageable pageable, String search) {
    Page<UserEntity > page;
    if (search == null || search.isBlank()) {
      page = userRepository.findAllByTenantId(tenantId, pageable);
    } else {
      page = userRepository
          .findAllByTenantIdAndNameContainingIgnoreCaseOrTenantIdAndEmailContainingIgnoreCase(
              tenantId, search, tenantId, search, pageable
          );
    }
    return page.map(this::map);
  }

  @Transactional(readOnly = true)
  public UserResponse getUserById(UUID tenantId, UUID userId) {
    UserEntity  user = userRepository.findByTenantIdAndId(tenantId, userId)
        .orElseThrow(() -> new IllegalArgumentException("Usuário não encontrado"));
    return map(user);
  }

  @Transactional
  public UserResponse updateUser(
      UUID tenantId,
      UUID userId,
      UpdateUserRequest request,
      UUID actorUserId,
      UserRole actorRole
  ) {
    UserEntity user = userRepository.findByTenantIdAndId(tenantId, userId)
        .orElseThrow(() -> new IllegalArgumentException("Usuário não encontrado"));

    if (actorRole != UserRole.ADMIN && user.getRole() == UserRole.ADMIN) {
      throw new ForbiddenException("cannot_change_admin");
    }

    if (actorRole != UserRole.ADMIN && !user.getId().equals(actorUserId)) {
      throw new ForbiddenException("forbidden");
    }

    if (request.name() != null) user.setName(request.name());
    if (request.role() != null) user.setRole(request.role());
    if (request.isActive() != null) user.setActive(request.isActive());

    return map(userRepository.save(user));
  }

  @Transactional
  public void updatePassword(
      UUID tenantId,
      UUID userId,
      UpdateUserPasswordRequest request,
      UUID actorUserId,
      UserRole actorRole
  ) {
    UserEntity user = userRepository.findByTenantIdAndId(tenantId, userId)
        .orElseThrow(() -> new IllegalArgumentException("Usuário não encontrado"));

    if (actorRole != UserRole.ADMIN && user.getRole() == UserRole.ADMIN) {
      throw new ForbiddenException("cannot_change_admin");
    }

    if (actorRole != UserRole.ADMIN && !user.getId().equals(actorUserId)) {
      throw new ForbiddenException("forbidden");
    }

    user.setPasswordHash(passwordEncoder.encode(request.newPassword()));
    userRepository.save(user);
  }

  private UserResponse map(UserEntity user) {
    return new UserResponse(
        user.getId(),
        user.getName(),
        user.getEmail(),
        user.getRole(),
        user.isActive()
    );
  }


}
