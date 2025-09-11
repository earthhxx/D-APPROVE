export interface UserPayload {
    userId?: number | string;
    username?: string;
    fullName?: string;
    roles?: string[];
    permissions?: string[];
    formaccess?: string[];
    Dep?: string[];
}
export interface ApproveData {
    totalAll: number;
    totals: Record<string, number>; // เพิ่มตรงนี้
    data: { id: number; name: string; source: string; Dep: string; }[];
    error?: string;   // เพิ่ม option นี้
}