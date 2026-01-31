package com.eclesys.api.features.communion.application;

import java.time.LocalDate;

public record CommunionBlankListPdf(LocalDate eventDate, byte[] content) {}
