export enum OrganizationUnitType {
  CHURCH = 'CHURCH',
  SECTOR = 'SECTOR',
  CONGREGATION = 'CONGREGATION',
}

export enum OrganizationUnitStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

export interface OrganizationUnit {
  id: string;
  type: OrganizationUnitType;
  name: string;
  code?: string;
  parentId?: string;
  parentName?: string;
  status: OrganizationUnitStatus;
  isHeadquarters: boolean;
  sectorLabel?: string;
  congregationLabel?: string;
  contactEmail?: string;
  contactPhone?: string;
  website?: string;
  address?: string;
  createdAt: string;
  updatedAt: string;
  children?: OrganizationUnit[];
  // Atribuições administrativas (ainda não implementado no backend)
  leaderName?: string; // Nome do líder principal
  assignmentsCount?: number; // Quantidade de cargos preenchidos
}

export interface CreateOrganizationUnitRequest {
  type: OrganizationUnitType;
  name: string;
  code?: string;
  parentId?: string;
  isHeadquarters?: boolean;
  sectorLabel?: string;
  congregationLabel?: string;
  contactEmail?: string;
  contactPhone?: string;
  website?: string;
  address?: string;
}

export interface UpdateOrganizationUnitRequest {
  name?: string;
  code?: string;
  status?: OrganizationUnitStatus;
  contactEmail?: string;
  contactPhone?: string;
  website?: string;
  address?: string;
}
