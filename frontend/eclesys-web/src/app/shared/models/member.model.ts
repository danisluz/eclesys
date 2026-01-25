export type MemberStatus = 'ACTIVE' | 'INACTIVE' | 'TRANSFERRED' | 'DECEASED';
export type Gender = 'M' | 'F';
export type MaritalStatus =
  | 'SINGLE'
  | 'MARRIED'
  | 'WIDOWED'
  | 'DIVORCED'
  | 'SEPARATED';

export type TransferStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
export type ApprovalLevel =
  | 'AUTO'
  | 'SECRETARY_CONGREGATION'
  | 'SECRETARY_SECTOR'
  | 'SECRETARY_CHURCH'
  | 'ADMIN';
export type OrganizationRole =
  | 'SECRETARY'
  | 'LEADER'
  | 'TREASURER'
  | 'ASSISTANT';

export interface Address {
  street: string | null;
  number: string | null;
  complement: string | null;
  neighborhood: string | null;
  city: string | null;
  state: string | null;
  zipCode: string | null;
}

export interface FamilyRelationships {
  spouseId: string | null;
  spouseName: string | null;
  fatherId: string | null;
  fatherName: string | null;
  motherId: string | null;
  motherName: string | null;
}

export interface Member {
  id: string;
  fullName: string;
  email: string | null;
  phone: string | null;
  document: string | null;
  birthDate: string | null;
  baptismDate: string | null;
  baptismChurch: string | null;
  baptismLocation: string | null;
  gender: Gender | null;
  maritalStatus: MaritalStatus | null;
  address: Address | null;
  status: MemberStatus;
  organizationUnitId: string | null;
  organizationUnitName: string | null;
  churchRoleId: string | null;
  churchRoleName: string | null;
  family: FamilyRelationships | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateMemberRequest {
  fullName: string;
  email?: string | null;
  phone?: string | null;
  document?: string | null;
  birthDate?: string | null;
  baptismDate?: string | null;
  baptismChurch: string | null;
  baptismLocation: string | null;
  gender?: Gender | null;
  maritalStatus?: MaritalStatus | null;
  address?: Address | null;
  organizationUnitId: string;
  churchRoleId?: string | null;
  spouseId?: string | null;
  fatherId?: string | null;
  motherId?: string | null;
}

export interface UpdateMemberRequest {
  fullName?: string;
  email?: string | null;
  phone?: string | null;
  document?: string | null;
  birthDate?: string | null;
  baptismDate?: string | null;
  baptismChurch?: string | null;
  baptismLocation?: string | null;
  gender?: Gender | null;
  maritalStatus?: MaritalStatus | null;
  address?: Address | null;
  status?: MemberStatus;
  organizationUnitId?: string;
  churchRoleId?: string | null;
  spouseId?: string | null;
  fatherId?: string | null;
  motherId?: string | null;
}

export interface TransferMemberRequest {
  toCongregationId?: string | null; // null = transferência externa
  reason: string;
  externalDestination?: string | null; // usado quando toCongregationId é null
}

export interface MemberTransfer {
  id: string;
  memberId: string;
  memberName: string;
  fromCongregationId: string | null;
  fromCongregationName: string | null;
  toCongregationId: string | null;
  toCongregationName: string | null;
  reason: string;
  transferredByUserName: string;
  createdAt: string;
  status: TransferStatus | null;
  requestedByUserName: string | null;
  approvedByUserName: string | null;
  approvedAt: string | null;
  rejectionReason: string | null;
}

export interface TenantTransferApprovalSettings {
  internalSameSectorApproval: ApprovalLevel;
  internalCrossSectorApproval: ApprovalLevel;
  externalApproval: ApprovalLevel;
  requireJustificationOnRejection: boolean;
  allowRequesterCancel: boolean;
}

export interface UpdateApprovalSettingsRequest {
  internalSameSectorApproval?: ApprovalLevel;
  internalCrossSectorApproval?: ApprovalLevel;
  externalApproval?: ApprovalLevel;
  requireJustificationOnRejection?: boolean;
  allowRequesterCancel?: boolean;
}

export interface RejectTransferRequest {
  reason: string;
}
