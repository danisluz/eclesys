package com.eclesys.api.features.communion.domain;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

import org.junit.jupiter.api.Test;

class CommunionEventTest {

  @Test
  void shouldOpenEventFromDraft() {
    CommunionEvent event = new CommunionEvent();
    event.setStatus(CommunionEventStatus.DRAFT);

    event.open();

    assertEquals(CommunionEventStatus.OPEN, event.getStatus());
  }

  @Test
  void shouldNotOpenEventWhenNotDraft() {
    CommunionEvent event = new CommunionEvent();
    event.setStatus(CommunionEventStatus.CLOSED);

    assertThrows(IllegalStateException.class, event::open);
  }

  @Test
  void shouldCloseEventFromOpen() {
    CommunionEvent event = new CommunionEvent();
    event.setStatus(CommunionEventStatus.OPEN);

    event.close();

    assertEquals(CommunionEventStatus.CLOSED, event.getStatus());
  }

  @Test
  void shouldNotCloseEventWhenNotOpen() {
    CommunionEvent event = new CommunionEvent();
    event.setStatus(CommunionEventStatus.DRAFT);

    assertThrows(IllegalStateException.class, event::close);
  }
}
