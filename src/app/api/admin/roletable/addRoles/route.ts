import { NextRequest, NextResponse } from "next/server";
import { getDashboardConnection } from "../../../../../lib/db";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const pool = await getDashboardConnection();

    // Insert
    await pool.request()
      .input("RoleName", body.RoleName)
      .input("Description", body.Description)
      .query(`
        INSERT INTO [DASHBOARD].[dbo].[Roles] (RoleName, Description)
        VALUES (@RoleName, @Description);
      `);

    // Fetch all sorted
    const allRoles = await pool.request().query(`
      SELECT RoleID, RoleName, Description
      FROM [DASHBOARD].[dbo].[Roles]
      ORDER BY RoleID DESC
    `);

    return NextResponse.json(allRoles.recordset);

  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
