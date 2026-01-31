package com.eclesys.api.features.communion.application.port;

import java.util.Optional;
import java.util.UUID;

public interface ChurchLogoPort {
  Optional<byte[]> loadLogo(UUID tenantId);
}
