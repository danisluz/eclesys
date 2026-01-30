package com.eclesys.api.features.communion.application;

import com.eclesys.api.features.communion.domain.CommunionEvent;
import java.util.List;

public record CommunionEventDetails(
    CommunionEvent event,
    List<MemberAttendanceView> members
) {}
