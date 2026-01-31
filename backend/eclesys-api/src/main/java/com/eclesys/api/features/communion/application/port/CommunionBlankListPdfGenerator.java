package com.eclesys.api.features.communion.application.port;

import com.eclesys.api.features.communion.application.CommunionBlankListPdfData;

public interface CommunionBlankListPdfGenerator {
  byte[] generate(CommunionBlankListPdfData data);
}
