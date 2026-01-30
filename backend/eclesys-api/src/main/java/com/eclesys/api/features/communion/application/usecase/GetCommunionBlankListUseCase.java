package com.eclesys.api.features.communion.application.usecase;

import com.eclesys.api.features.communion.application.CommunionAccessService;
import com.eclesys.api.features.communion.application.CommunionBlankList;
import com.eclesys.api.features.communion.application.MemberSummaryView;
import com.eclesys.api.features.communion.application.port.CommunionEventRepository;
import com.eclesys.api.features.communion.application.port.MemberQueryPort;
import com.eclesys.api.features.communion.application.port.MemberSummary;
import com.eclesys.api.features.communion.domain.CommunionEvent;
import com.eclesys.api.features.users.entity.UserRole;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Service;

@Service
public class GetCommunionBlankListUseCase {

  private final CommunionEventRepository eventRepository;
  private final MemberQueryPort memberQueryPort;
  private final CommunionAccessService accessService;

  public GetCommunionBlankListUseCase(
      CommunionEventRepository eventRepository,
      MemberQueryPort memberQueryPort,
      CommunionAccessService accessService
  ) {
    this.eventRepository = eventRepository;
    this.memberQueryPort = memberQueryPort;
    this.accessService = accessService;
  }

  public CommunionBlankList execute(UUID tenantId, UUID userId, UserRole userRole, UUID eventId) {
    CommunionEvent event = eventRepository.findByIdAndTenantId(tenantId, eventId)
        .orElseThrow(() -> new IllegalArgumentException("Evento de Santa Ceia não encontrado"));

    accessService.assertCanViewOrRecord(tenantId, userId, userRole, event.getCongregationId());

    List<MemberSummary> members = memberQueryPort.listMembersByCongregation(tenantId, event.getCongregationId());

    List<MemberSummaryView> list = members.stream()
        .map(member -> new MemberSummaryView(member.id(), member.fullName(), member.registrationNumber()))
        .toList();

    return new CommunionBlankList(event, list);
  }
}
