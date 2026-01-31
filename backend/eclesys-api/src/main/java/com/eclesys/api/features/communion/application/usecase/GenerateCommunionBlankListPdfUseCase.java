package com.eclesys.api.features.communion.application.usecase;

import com.eclesys.api.features.communion.application.CommunionBlankList;
import com.eclesys.api.features.communion.application.CommunionBlankListPdf;
import com.eclesys.api.features.communion.application.CommunionBlankListPdfData;
import com.eclesys.api.features.communion.application.CommunionBlankListPdfData.CommunionMemberPdfRow;
import com.eclesys.api.features.communion.application.port.CommunionBlankListPdfGenerator;
import com.eclesys.api.features.communion.application.port.ChurchLogoPort;
import com.eclesys.api.features.communion.application.port.OrganizationHierarchy;
import com.eclesys.api.features.communion.application.port.OrganizationHierarchyPort;
import com.eclesys.api.features.users.entity.UserRole;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Service;

@Service
public class GenerateCommunionBlankListPdfUseCase {

  private final GetCommunionBlankListUseCase blankListUseCase;
  private final OrganizationHierarchyPort organizationHierarchyPort;
  private final CommunionBlankListPdfGenerator pdfGenerator;
  private final ChurchLogoPort churchLogoPort;

  public GenerateCommunionBlankListPdfUseCase(
      GetCommunionBlankListUseCase blankListUseCase,
      OrganizationHierarchyPort organizationHierarchyPort,
      CommunionBlankListPdfGenerator pdfGenerator,
      ChurchLogoPort churchLogoPort
  ) {
    this.blankListUseCase = blankListUseCase;
    this.organizationHierarchyPort = organizationHierarchyPort;
    this.pdfGenerator = pdfGenerator;
    this.churchLogoPort = churchLogoPort;
  }

  public CommunionBlankListPdf execute(UUID tenantId, UUID userId, UserRole role, UUID eventId) {
    CommunionBlankList blankList = blankListUseCase.execute(tenantId, userId, role, eventId);
    OrganizationHierarchy hierarchy = organizationHierarchyPort.getHierarchyByCongregation(
        tenantId,
        blankList.event().getCongregationId()
    );

    String sectorLabel = hierarchy.church().sectorLabel();
    String congregationLabel = hierarchy.church().congregationLabel();
    byte[] logoBytes = churchLogoPort.loadLogo(tenantId).orElse(null);

    List<CommunionMemberPdfRow> members = blankList.members().stream()
        .map(member -> new CommunionMemberPdfRow(member.registrationNumber(), member.fullName()))
        .toList();

    CommunionBlankListPdfData data = new CommunionBlankListPdfData(
        blankList.event().getEventDate(),
        hierarchy.church().name(),
        logoBytes,
        sectorLabel,
        congregationLabel,
        hierarchy.sector().name(),
        hierarchy.congregation().name(),
        hierarchy.church().contactEmail(),
        hierarchy.church().contactPhone(),
        hierarchy.church().website(),
        hierarchy.church().address(),
        members
    );

    byte[] content = pdfGenerator.generate(data);
    return new CommunionBlankListPdf(blankList.event().getEventDate(), content);
  }
}
