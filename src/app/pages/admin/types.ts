// /components/admin/types.ts
export type Permission = {
    PermissionID: number;
    PermissionName: string;
    Description?: string;
};

export type Role = {
    RoleID: number;
    RoleName: string;
    Description?: string;
};

export type User = {
    id: number;
    User_Id: string;
    Name: string;
    Department: string;
    Pass: string;
    CreateDate: string;
    Age?: number | null;
    Sex?: string | null;
    StartDate?: string | null;
    Status?: string | null;
    Tel?: string | null;
    Image?: string | null;
    Process?: string;
};

export type UserRole = {
    UserID: number;
    RoleID: string;
};

export type RolePermission = {
    RoleID: string;
    PermissionID: string;
};
