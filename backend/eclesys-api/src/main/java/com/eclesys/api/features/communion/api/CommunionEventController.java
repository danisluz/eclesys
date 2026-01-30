package com.eclesys.api.features.communion.api;

import com.eclesys.api.features.communion.api.dto.AttendanceBatchRequest;
import com.eclesys.api.features.communion.api.dto.AttendanceBatchResponse;
import com.eclesys.api.features.communion.api.dto.AttendanceItemRequest;
import com.eclesys.api.features.communion.api.dto.AttendanceRecordResponse;
import com.eclesys.api.features.communion.api.dto.CommunionBlankListResponse;
import com.eclesys.api.features.communion.api.dto.CommunionEventDetailResponse;
import com.eclesys.api.features.communion.api.dto.CommunionEventResponse;
import com.eclesys.api.features.communion.api.dto.CommunionMemberAttendanceResponse;
import com.eclesys.api.features.communion.api.dto.CommunionMemberSummaryResponse;
import com.eclesys.api.features.communion.api.dto.CreateCommunionEventRequest;
import com.eclesys.api.features.communion.api.dto.MarkAttendanceByRegistrationRequest;
import com.eclesys.api.features.communion.application.AttendanceRecordResult;
import com.eclesys.api.features.communion.application.AttendanceUpdateItem;
import com.eclesys.api.features.communion.application.AttendanceUpdateResult;
import com.eclesys.api.features.communion.application.CommunionBlankList;
import com.eclesys.api.features.communion.application.CommunionEventDetails;
import com.eclesys.api.features.communion.application.CommunionEventSummary;
import com.eclesys.api.features.communion.application.MemberAttendanceView;
import com.eclesys.api.features.communion.application.MemberSummaryView;
import com.eclesys.api.features.communion.application.usecase.CloseCommunionEventUseCase;
import com.eclesys.api.features.communion.application.usecase.CreateCommunionEventUseCase;
import com.eclesys.api.features.communion.application.usecase.GetCommunionBlankListUseCase;
import com.eclesys.api.features.communion.application.usecase.GetCommunionEventUseCase;
import com.eclesys.api.features.communion.application.usecase.ListCommunionEventsUseCase;
import com.eclesys.api.features.communion.application.usecase.MarkCommunionAttendanceByRegistrationUseCase;
import com.eclesys.api.features.communion.application.usecase.OpenCommunionEventUseCase;
import com.eclesys.api.features.communion.application.usecase.UpdateCommunionAttendanceBatchUseCase;
import com.eclesys.api.features.communion.domain.AttendanceSource;
import com.eclesys.api.features.communion.domain.CommunionEvent;
import com.eclesys.api.features.communion.domain.CommunionEventStatus;
import com.eclesys.api.features.users.service.CurrentUserService;
import com.eclesys.api.shared.api.ApiResponse;
import jakarta.validation.Valid;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/communions")
public class CommunionEventController {

  private final CurrentUserService currentUserService;
  private final CreateCommunionEventUseCase createEventUseCase;
  private final OpenCommunionEventUseCase openEventUseCase;
  private final CloseCommunionEventUseCase closeEventUseCase;
  private final ListCommunionEventsUseCase listEventsUseCase;
  private final GetCommunionEventUseCase getEventUseCase;
  private final UpdateCommunionAttendanceBatchUseCase updateAttendanceUseCase;
  private final MarkCommunionAttendanceByRegistrationUseCase markAttendanceUseCase;
  private final GetCommunionBlankListUseCase blankListUseCase;

  public CommunionEventController(
      CurrentUserService currentUserService,
      CreateCommunionEventUseCase createEventUseCase,
      OpenCommunionEventUseCase openEventUseCase,
      CloseCommunionEventUseCase closeEventUseCase,
      ListCommunionEventsUseCase listEventsUseCase,
      GetCommunionEventUseCase getEventUseCase,
      UpdateCommunionAttendanceBatchUseCase updateAttendanceUseCase,
      MarkCommunionAttendanceByRegistrationUseCase markAttendanceUseCase,
      GetCommunionBlankListUseCase blankListUseCase
  ) {
    this.currentUserService = currentUserService;
    this.createEventUseCase = createEventUseCase;
    this.openEventUseCase = openEventUseCase;
    this.closeEventUseCase = closeEventUseCase;
    this.listEventsUseCase = listEventsUseCase;
    this.getEventUseCase = getEventUseCase;
    this.updateAttendanceUseCase = updateAttendanceUseCase;
    this.markAttendanceUseCase = markAttendanceUseCase;
    this.blankListUseCase = blankListUseCase;
  }

  @PostMapping("/events")
  public ResponseEntity<ApiResponse<CommunionEventResponse>> createEvent(
      @Valid @RequestBody CreateCommunionEventRequest request
  ) {
    CommunionEvent event = createEventUseCase.execute(
        currentUserService.getTenantId(),
        currentUserService.getUserId(),
        currentUserService.getRole(),
        request.congregationId(),
        request.eventDate()
    );

    return ResponseEntity.status(HttpStatus.CREATED)
        .body(ApiResponse.success(toEventResponse(event)));
  }

  @PostMapping("/events/{eventId}/open")
  public ResponseEntity<ApiResponse<CommunionEventResponse>> openEvent(
      @PathVariable UUID eventId
  ) {
    CommunionEvent event = openEventUseCase.execute(
        currentUserService.getTenantId(),
        currentUserService.getUserId(),
        currentUserService.getRole(),
        eventId
    );

    return ResponseEntity.ok(ApiResponse.success(toEventResponse(event)));
  }

  @PostMapping("/events/{eventId}/close")
  public ResponseEntity<ApiResponse<CommunionEventResponse>> closeEvent(
      @PathVariable UUID eventId
  ) {
    CommunionEvent event = closeEventUseCase.execute(
        currentUserService.getTenantId(),
        currentUserService.getUserId(),
        currentUserService.getRole(),
        eventId
    );

    return ResponseEntity.ok(ApiResponse.success(toEventResponse(event)));
  }

  @GetMapping("/events")
  public ResponseEntity<ApiResponse<List<CommunionEventResponse>>> listEvents(
      @RequestParam(required = false) UUID congregationId,
      @RequestParam(required = false) LocalDate from,
      @RequestParam(required = false) LocalDate to,
      @RequestParam(required = false) CommunionEventStatus status
  ) {
    List<CommunionEventSummary> events = listEventsUseCase.execute(
        currentUserService.getTenantId(),
        currentUserService.getUserId(),
        currentUserService.getRole(),
        congregationId,
        from,
        to,
        status
    );

    List<CommunionEventResponse> response = events.stream()
        .map(summary -> toEventResponse(
            summary.event(),
            summary.totalMembers(),
            summary.presentCount(),
            summary.attendancePercent()
        ))
        .toList();

    return ResponseEntity.ok(ApiResponse.success(response));
  }

  @GetMapping("/events/{eventId}")
  public ResponseEntity<ApiResponse<CommunionEventDetailResponse>> getEvent(
      @PathVariable UUID eventId
  ) {
    CommunionEventDetails details = getEventUseCase.execute(
        currentUserService.getTenantId(),
        currentUserService.getUserId(),
        currentUserService.getRole(),
        eventId
    );

    List<CommunionMemberAttendanceResponse> members = details.members().stream()
        .map(this::toMemberAttendanceResponse)
        .toList();

    CommunionEventDetailResponse response = new CommunionEventDetailResponse(
        toEventResponse(details.event()),
        members
    );

    return ResponseEntity.ok(ApiResponse.success(response));
  }

  @PatchMapping("/events/{eventId}/attendance")
  public ResponseEntity<ApiResponse<AttendanceBatchResponse>> updateAttendance(
      @PathVariable UUID eventId,
      @Valid @RequestBody AttendanceBatchRequest request
  ) {
    List<AttendanceUpdateItem> items = request.items().stream()
        .map(this::toAttendanceUpdateItem)
        .toList();

    AttendanceUpdateResult result = updateAttendanceUseCase.execute(
        currentUserService.getTenantId(),
        currentUserService.getUserId(),
        currentUserService.getRole(),
        eventId,
        items,
        AttendanceSource.ONLINE
    );

    return ResponseEntity.ok(ApiResponse.success(new AttendanceBatchResponse(result.updatedCount())));
  }

  @PostMapping("/events/{eventId}/attendance/by-registration")
  public ResponseEntity<ApiResponse<AttendanceRecordResponse>> markAttendanceByRegistration(
      @PathVariable UUID eventId,
      @Valid @RequestBody MarkAttendanceByRegistrationRequest request
  ) {
    AttendanceRecordResult result = markAttendanceUseCase.execute(
        currentUserService.getTenantId(),
        currentUserService.getUserId(),
        currentUserService.getRole(),
        eventId,
        request.registrationNumber()
    );

    return ResponseEntity.ok(ApiResponse.success(
        new AttendanceRecordResponse(result.eventId(), result.memberId(), result.present())
    ));
  }

  @GetMapping("/events/{eventId}/blank-list")
  public ResponseEntity<ApiResponse<CommunionBlankListResponse>> getBlankList(
      @PathVariable UUID eventId
  ) {
    CommunionBlankList blankList = blankListUseCase.execute(
        currentUserService.getTenantId(),
        currentUserService.getUserId(),
        currentUserService.getRole(),
        eventId
    );

    List<CommunionMemberSummaryResponse> members = blankList.members().stream()
        .map(this::toMemberSummaryResponse)
        .toList();

    CommunionBlankListResponse response = new CommunionBlankListResponse(
        toEventResponse(blankList.event()),
        members
    );

    return ResponseEntity.ok(ApiResponse.success(response));
  }

  private CommunionEventResponse toEventResponse(CommunionEvent event) {
    return toEventResponse(event, null, null, null);
  }

  private CommunionEventResponse toEventResponse(
      CommunionEvent event,
      Integer totalMembers,
      Integer presentCount,
      Integer attendancePercent
  ) {
    return new CommunionEventResponse(
        event.getId(),
        event.getCongregationId(),
        event.getEventDate(),
        event.getStatus(),
        totalMembers,
        presentCount,
        attendancePercent
    );
  }

  private CommunionMemberAttendanceResponse toMemberAttendanceResponse(MemberAttendanceView member) {
    return new CommunionMemberAttendanceResponse(
        member.memberId(),
        member.fullName(),
        member.registrationNumber(),
        member.present()
    );
  }

  private CommunionMemberSummaryResponse toMemberSummaryResponse(MemberSummaryView member) {
    return new CommunionMemberSummaryResponse(
        member.memberId(),
        member.fullName(),
        member.registrationNumber()
    );
  }

  private AttendanceUpdateItem toAttendanceUpdateItem(AttendanceItemRequest request) {
    return new AttendanceUpdateItem(request.memberId(), request.present());
  }
}
