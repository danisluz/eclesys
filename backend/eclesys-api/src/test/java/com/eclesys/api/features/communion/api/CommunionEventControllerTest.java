package com.eclesys.api.features.communion.api;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;

import com.eclesys.api.features.communion.application.usecase.CreateCommunionEventUseCase;
import com.eclesys.api.features.communion.application.usecase.OpenCommunionEventUseCase;
import com.eclesys.api.features.communion.application.usecase.CloseCommunionEventUseCase;
import com.eclesys.api.features.communion.application.usecase.ListCommunionEventsUseCase;
import com.eclesys.api.features.communion.application.usecase.GetCommunionEventUseCase;
import com.eclesys.api.features.communion.application.usecase.UpdateCommunionAttendanceBatchUseCase;
import com.eclesys.api.features.communion.application.usecase.MarkCommunionAttendanceByRegistrationUseCase;
import com.eclesys.api.features.communion.application.usecase.GetCommunionBlankListUseCase;
import com.eclesys.api.features.communion.domain.CommunionEvent;
import com.eclesys.api.features.communion.domain.CommunionEventStatus;
import com.eclesys.api.features.auth.service.JwtTokenService;
import com.eclesys.api.features.users.entity.UserRole;
import com.eclesys.api.features.users.service.CurrentUserService;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.LocalDate;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

@WebMvcTest(CommunionEventController.class)
class CommunionEventControllerTest {

  @Autowired
  private MockMvc mockMvc;

  @Autowired
  private ObjectMapper objectMapper;

  @MockBean
  private CurrentUserService currentUserService;

  @MockBean
  private JwtTokenService jwtTokenService;

  @MockBean
  private CreateCommunionEventUseCase createCommunionEventUseCase;

  @MockBean
  private OpenCommunionEventUseCase openCommunionEventUseCase;

  @MockBean
  private CloseCommunionEventUseCase closeCommunionEventUseCase;

  @MockBean
  private ListCommunionEventsUseCase listCommunionEventsUseCase;

  @MockBean
  private GetCommunionEventUseCase getCommunionEventUseCase;

  @MockBean
  private UpdateCommunionAttendanceBatchUseCase updateCommunionAttendanceBatchUseCase;

  @MockBean
  private MarkCommunionAttendanceByRegistrationUseCase markCommunionAttendanceByRegistrationUseCase;

  @MockBean
  private GetCommunionBlankListUseCase getCommunionBlankListUseCase;

  @Test
  @WithMockUser(roles = "ADMIN")
  void shouldCreateCommunionEvent() throws Exception {
    UUID tenantId = UUID.randomUUID();
    UUID userId = UUID.randomUUID();
    UUID congregationId = UUID.randomUUID();
    UUID eventId = UUID.randomUUID();

    CommunionEvent event = new CommunionEvent();
    event.setId(eventId);
    event.setTenantId(tenantId);
    event.setCongregationId(congregationId);
    event.setEventDate(LocalDate.of(2026, 3, 1));
    event.setStatus(CommunionEventStatus.DRAFT);
    event.setCreatedByUserId(userId);

    when(currentUserService.getTenantId()).thenReturn(tenantId);
    when(currentUserService.getUserId()).thenReturn(userId);
    when(currentUserService.getRole()).thenReturn(UserRole.ADMIN);
    when(createCommunionEventUseCase.execute(eq(tenantId), eq(userId), eq(UserRole.ADMIN), eq(congregationId), any()))
        .thenReturn(event);

    String payload = objectMapper.writeValueAsString(new CreateEventPayload(congregationId, "2026-03-01"));

    mockMvc.perform(post("/api/communions/events")
            .with(csrf())
            .contentType(MediaType.APPLICATION_JSON)
            .content(payload))
        .andExpect(status().isCreated())
        .andExpect(jsonPath("$.status").value("success"))
        .andExpect(jsonPath("$.data.id").value(eventId.toString()))
        .andExpect(jsonPath("$.data.congregationId").value(congregationId.toString()))
        .andExpect(jsonPath("$.data.eventDate").value("2026-03-01"))
        .andExpect(jsonPath("$.data.status").value("DRAFT"));
  }

  private record CreateEventPayload(UUID congregationId, String eventDate) {}
}
