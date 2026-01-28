package com.eclesys.api.features.users.dto;

import com.eclesys.api.features.users.entity.UserRole;
import java.util.UUID;

public record UserResponse(
    UUID id,
    String name,
    String email,
    UserRole role,
    boolean isActive
) {}
