package com.eclesys.api.domain.tenant;

import jakarta.persistence.*;
import java.util.UUID;

@Entity
@Table(name = "tenants")
public class Tenant {

  @Id
  private UUID id;

  public UUID getId() {
    return id;
  }

  public void setId(UUID id) {
    this.id = id;
  }
}
