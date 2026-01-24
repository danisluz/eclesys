export type MemberStatus = 'ACTIVE' | 'INACTIVE' | 'TRANSFERRED' | 'DECEASED';

export interface Member {
  id: string;
  fullName: string;
  email: string | null;
  phone: string | null;
  document: string | null;
  birthDate: string | null;
  baptismDate: string | null;
  address: Record<string, any> | null;
  status: MemberStatus;
  churchRoleId: string | null;
  churchRoleName: string | null;
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
  address?: Record<string, any> | null;
  churchRoleId?: string | null;
}

export interface UpdateMemberRequest {
  fullName?: string;
  email?: string | null;
  phone?: string | null;
  document?: string | null;
  birthDate?: string | null;
  baptismDate?: string | null;
  address?: Record<string, any> | null;
  status?: MemberStatus;
  churchRoleId?: string | null;
}
