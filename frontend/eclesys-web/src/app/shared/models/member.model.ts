export type MemberStatus = 'ACTIVE' | 'INACTIVE' | 'TRANSFERRED' | 'DECEASED';
export type Gender = 'M' | 'F';
export type MaritalStatus =
  | 'SINGLE'
  | 'MARRIED'
  | 'WIDOWED'
  | 'DIVORCED'
  | 'SEPARATED';

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
