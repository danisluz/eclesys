package com.eclesys.api.features.communion.api.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import java.util.List;

public record AttendanceBatchRequest(
    @NotEmpty @Valid List<AttendanceItemRequest> items
) {}
