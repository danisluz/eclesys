package com.eclesys.api.features.communion.application;

import java.time.LocalDate;
import java.util.List;

public record CommunionBlankListPdfData(
    LocalDate eventDate,
    String churchName,
    byte[] churchLogo,
    String sectorLabel,
    String congregationLabel,
    String sectorName,
    String congregationName,
    String contactEmail,
    String contactPhone,
    String website,
    String address,
    List<CommunionMemberPdfRow> members
) {
  public record CommunionMemberPdfRow(String registrationNumber, String fullName) {}
}
