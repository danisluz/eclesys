export type CommunionEventStatus = 'DRAFT' | 'OPEN' | 'CLOSED';

export interface CommunionEvent {
  id: string;
  congregationId: string;
  eventDate: string;
  status: CommunionEventStatus;
  totalMembers?: number;
  presentCount?: number;
  attendancePercent?: number;
}

export interface CommunionEventListItem extends CommunionEvent {
  congregationName: string;
}

export interface CommunionMemberAttendance {
  memberId: string;
  fullName: string;
  registrationNumber: string;
  present: boolean;
  note?: string | null;
}

export interface CommunionMemberSummary {
  memberId: string;
  fullName: string;
  registrationNumber: string;
}

export interface CommunionEventDetailResponse {
  event: CommunionEvent;
  members: CommunionMemberAttendance[];
}

export interface CommunionBlankListResponse {
  event: CommunionEvent;
  members: CommunionMemberSummary[];
}

export interface CreateCommunionEventRequest {
  congregationId: string;
  eventDate: string;
}

export interface AttendanceUpdateItem {
  memberId: string;
  present: boolean;
  note?: string | null;
}

export interface AttendanceBatchResponse {
  updatedCount: number;
}

export interface AttendanceRecordResponse {
  eventId: string;
  memberId: string;
  present: boolean;
  note?: string | null;
}

export interface CommunionEventsFilters {
  congregationId?: string | null;
  from?: string | null;
  to?: string | null;
  status?: CommunionEventStatus | null;
}

export interface ApiSuccess<T> {
  status: 'success';
  data: T;
}
