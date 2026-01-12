package com.eclesys.api.domain.user;

import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserRepository extends JpaRepository<UserEntity, UUID> {

  Optional<UserEntity> findByTenantIdAndEmail(UUID tenantId, String email);

  boolean existsByTenantIdAndEmail(UUID tenantId, String email);

  Optional<UserEntity> findByTenantIdAndId(UUID tenantId, UUID id);

  Page<UserEntity> findAllByTenantId(UUID tenantId, Pageable pageable);

  Page<UserEntity> findAllByTenantIdAndNameContainingIgnoreCaseOrTenantIdAndEmailContainingIgnoreCase(
      UUID tenantIdForName,
      String name,
      UUID tenantIdForEmail,
      String email,
      Pageable pageable
  );
}
