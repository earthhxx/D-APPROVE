import { NextRequest, NextResponse } from "next/server";
import { getDashboardConnection } from "../../../../../lib/db";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { PermissionID } = body;

    const pool = await getDashboardConnection();
    const delResult = await pool.request()
      .input("PermissionID", PermissionID)
      .query(`
        DELETE FROM [mydb].[dbo].[Permissions]
        WHERE PermissionID = @PermissionID
      `);

    if (delResult.rowsAffected[0] === 0) {
      return NextResponse.json({ error: "Permission not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
