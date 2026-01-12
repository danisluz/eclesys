package com.eclesys.api.features.users.dto;

import com.eclesys.api.domain.user.UserRole;

public record UpdateUserRequest(
    String name,
    UserRole role,
    Boolean isActive
) {}
