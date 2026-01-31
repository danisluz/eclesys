package com.eclesys.api.features.communion.application.port;

import java.util.UUID;

public record ChurchInfo(
    UUID id,
    String name,
    String sectorLabel,
    String congregationLabel,
    String contactEmail,
    String contactPhone,
    String website,
    String address
) {}
