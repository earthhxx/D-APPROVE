// /pages/api/userroletable/deluserrole.ts
import { NextRequest, NextResponse } from "next/server";
import { getDashboardConnection } from "../../../../../lib/db";

export async function POST(req: NextRequest) {
    try {
        const { UserID, RoleID } = await req.json();

        if (!UserID || !RoleID) {
            return NextResponse.json(
                { error: "กรุณากรอก UserID และ RoleID" },
                { status: 400 }
            );
        }

        const pool = await getDashboardConnection();

        // ลบข้อมูล
        await pool.request()
            .input("UserID", UserID)
            .input("RoleID", RoleID)
            .query(`
                DELETE FROM [DASHBOARD].[dbo].[UserRoles]
                WHERE UserID = @UserID AND RoleID = @RoleID
            `);

        // ส่งกลับรายการ UserRoles ทั้งหมด
        const result = await pool.request().query(`
            SELECT UserID, RoleID FROM [DASHBOARD].[dbo].[UserRoles]
        `);

        return NextResponse.json(result.recordset);

    } catch (error) {
        console.error("Delete user-role error:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
