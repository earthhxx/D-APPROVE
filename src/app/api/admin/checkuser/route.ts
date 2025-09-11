// /pages/api/checkuser.ts
import { NextResponse } from "next/server";
import { getDashboardConnection } from "../../../../lib/db";
import sql from "mssql";

export async function GET() {

  try {
    const pool = await getDashboardConnection();

    // ดึง user ทั้งหมด
    const usersResult = await pool.request().query(`
      SELECT [User_Id], [Name]
      FROM tb_im_employee
    `);

    const users = usersResult.recordset;

    // สำหรับแต่ละ user ดึง roles และ permissions
    const detailedUsers = await Promise.all(users.map(async (user) => {
      // roles
      const roleResult = await pool.request()
        .input("userId", sql.Int, user.User_Id)
        .query(`
          SELECT r.RoleName
          FROM UserRoles ur
          INNER JOIN Roles r ON ur.RoleID = r.RoleID
          WHERE ur.UserID = @userId
        `);
      const roles = roleResult.recordset.map(r => r.RoleName);

      // permissions
      const permResult = await pool.request()
        .input("userId", sql.Int, user.User_Id)
        .query(`
          SELECT DISTINCT p.PermissionName
          FROM UserRoles ur
          INNER JOIN RolePermissions rp ON ur.RoleID = rp.RoleID
          INNER JOIN Permissions p ON rp.PermissionID = p.PermissionID
          WHERE ur.UserID = @userId
        `);
      const permissions = permResult.recordset.map(p => p.PermissionName);

      return {
        userId: user.User_Id,
        fullName: user.Name,
        roles,
        permissions,
      };
    }));

    return NextResponse.json(detailedUsers);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
