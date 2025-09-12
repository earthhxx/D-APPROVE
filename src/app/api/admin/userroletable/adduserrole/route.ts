// /pages/api/userroletable/adduserrole.ts
import { NextRequest, NextResponse } from "next/server";
import { getDashboardConnection } from "../../../../../lib/db";

export async function POST(req: NextRequest) {
  try {
    const { UserID, RoleID } = await req.json();

    if (!UserID || !RoleID) {
      return NextResponse.json({ error: "กรุณากรอก UserID และ RoleID" }, { status: 400 });
    }

    const pool = await getDashboardConnection();

    await pool.request()
      .input("UserID", UserID)
      .input("RoleID", RoleID)
      .query(`
        INSERT INTO [mydb].[dbo].[UserRoles] (UserID, RoleID)
        VALUES (@UserID, @RoleID)
      `);

    const result = await pool.request().query(`
      SELECT UserID, RoleID FROM [dbo].[UserRoles]
    `);

    return NextResponse.json(result.recordset);

  } catch (error) {
    console.error("Add user role error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
