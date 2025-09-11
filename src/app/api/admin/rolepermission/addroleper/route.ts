// /pages/api/rolepermission/addpermission.ts
import { NextRequest, NextResponse } from "next/server";
import { getDashboardConnection } from "../../../../../lib/db";

export async function POST(req: NextRequest) {
    try {
        const { RoleID, PermissionID } = await req.json();

        if (!RoleID || !PermissionID) {
            return NextResponse.json(
                { error: "กรุณากรอก RoleID และ PermissionID" },
                { status: 400 }
            );
        }

        const pool = await getDashboardConnection();

        // ตรวจสอบว่ามีอยู่แล้วหรือไม่
        const exists = await pool.request()
            .input("RoleID", RoleID)
            .input("PermissionID", PermissionID)
            .query(`
                SELECT 1 
                FROM [DASHBOARD].[dbo].[RolePermissions]
                WHERE RoleID = @RoleID AND PermissionID = @PermissionID
            `);

        if (exists.recordset.length > 0) {
            return NextResponse.json(
                { error: "Permission นี้ถูกกำหนดให้ Role นี้แล้ว" },
                { status: 409 }
            );
        }

        // เพิ่มข้อมูลใหม่
        await pool.request()
            .input("RoleID", RoleID)
            .input("PermissionID", PermissionID)
            .query(`
                INSERT INTO [DASHBOARD].[dbo].[RolePermissions] (RoleID, PermissionID)
                VALUES (@RoleID, @PermissionID)
            `);

        // ส่งข้อมูลทั้งหมดกลับ
        const result = await pool.request().query(`
            SELECT RoleID, PermissionID
            FROM [DASHBOARD].[dbo].[RolePermissions]
        `);

        return NextResponse.json(result.recordset);

    } catch (error) {
        console.error("Add permission error:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
