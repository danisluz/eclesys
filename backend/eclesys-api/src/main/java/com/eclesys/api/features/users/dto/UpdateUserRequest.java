package com.eclesys.api.features.users.dto;

import com.eclesys.api.features.users.entity.UserRole;

public record UpdateUserRequest(
    String name,
    UserRole role,
    Boolean isActive
) {}
