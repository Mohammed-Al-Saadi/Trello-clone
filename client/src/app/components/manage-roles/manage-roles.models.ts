export interface ManageMember {
  user_id: number;
  full_name: string;
  email: string;
  role_name: string;
  role_id?: number;
}

export interface ManageEntity {
  id: number;
  name: string;
  members: ManageMember[];
  role_name: string;
}
