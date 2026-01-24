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
  createdAt: string;
  updatedAt: string;
  children?: OrganizationUnit[];
}

export interface CreateOrganizationUnitRequest {
  type: OrganizationUnitType;
  name: string;
  code?: string;
  parentId?: string;
  isHeadquarters?: boolean;
  sectorLabel?: string;
  congregationLabel?: string;
}

export interface UpdateOrganizationUnitRequest {
  name?: string;
  code?: string;
  status?: OrganizationUnitStatus;
}
