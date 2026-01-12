package com.eclesys.api.features.users.dto;

import com.eclesys.api.domain.user.UserRole;
import java.util.UUID;

public record UserResponse(
    UUID id,
    String name,
    String email,
    UserRole role,
    boolean isActive
) {}
