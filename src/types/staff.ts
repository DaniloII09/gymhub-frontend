import type { Role } from "./auth";

export type StaffAccount = {
  id: string;
  fullName: string;
  email: string;
  role: Exclude<Role, "MEMBER">;
  isActive: boolean;
};

export type StaffCreatedResponse = {
  id: string;
  fullName: string;
  role: Exclude<Role, "MEMBER">;
  temporaryPassword: string;
};

export type StaffPage = {
  data: StaffAccount[];
  pageSize: number;
  page: number;
  total: number;
};
