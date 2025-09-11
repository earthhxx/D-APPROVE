import { NextRequest, NextResponse } from "next/server";
import sql from "mssql";
import bcrypt from "bcryptjs";
import { SignJWT } from "jose";
import { getDashboardConnection } from "../../../lib/db";

export type JwtPayload = {
  userId: number | string;
  username: string;
  fullName: string;
  roles: string[];
  permissions: string[];
  formaccess: string[];
  Dep: string[];
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json({ error: "กรุณากรอก username และ password" }, { status: 400 });
    }
    // console.log(username, password);
    const pool = await getDashboardConnection();

    const userResult = await pool.request()
      .input('username', sql.Int, username)
      .query(`
        SELECT [User_Id],[Name],[Pass]
        FROM tb_im_employee
        WHERE User_Id = @username
      `);

    if (userResult.recordset.length === 0) {
      return NextResponse.json({ error: "ไม่พบผู้ใช้ หรือรหัสผ่านไม่ถูกต้อง" }, { status: 401 });
    }

    const userrow = userResult.recordset[0];

    const isBcryptHash = (str: string) => typeof str === 'string' && str.startsWith('$2');
    let isValid = false;

    if (isBcryptHash(userrow.Pass)) {
      isValid = await bcrypt.compare(password, userrow.Pass);
    } else {
      isValid = password === userrow.Pass;
    }

    if (!isValid) {
      return NextResponse.json({ error: "ไม่พบผู้ใช้ หรือรหัสผ่านไม่ถูกต้อง" }, { status: 401 });
    }

    // roles
    const roleResult = await pool.request()
      .input('userId', sql.Int, userrow.User_Id)
      .query(`
        SELECT r.RoleName
        FROM UserRoles ur
        INNER JOIN Roles r ON ur.RoleID = r.RoleID
        WHERE ur.UserID = @userId
      `);
    const roles = roleResult.recordset.map(r => r.RoleName);

    // permissions
    const permResult = await pool.request()
      .input('userId', sql.Int, userrow.User_Id)
      .query(`
        SELECT DISTINCT p.PermissionName
        FROM UserRoles ur
        INNER JOIN RolePermissions rp ON ur.RoleID = rp.RoleID
        INNER JOIN Permissions p ON rp.PermissionID = p.PermissionID
        WHERE ur.UserID = @userId
      `);

    const formResult = await pool.request()
      .input('userId', sql.Int, userrow.User_Id)
      .query(`
        SELECT DISTINCT f.Formaccess
        FROM UserRoles ur
        INNER JOIN RoleForm rf ON ur.RoleID = rf.RoleID
        INNER JOIN Formaccess f ON rf.FormaccessID = f.FormaccessID
        WHERE ur.UserID = @userId
      `);

    const depResult = await pool.request()
      .input('userId', sql.Int, userrow.User_Id)
      .query(`
        SELECT DISTINCT d.DepartmentName
        FROM UserRoles ur
        INNER JOIN RolesDepartment rd ON ur.RoleID = rd.RoleID
        INNER JOIN Department d ON rd.DepartmentID = d.DepartmentID
        WHERE ur.UserID = @userId
    `);

    const permissions = permResult.recordset.map(p => p.PermissionName);
    const formaccess = formResult.recordset.map(f => f.Formaccess)
    const Dep = depResult.recordset.map(row => row.DepartmentName);

    // JWT
    const secret = new TextEncoder().encode(process.env.JWT_SECRET!);
    const token = await new SignJWT({
      userId: userrow.User_Id,
      username: userrow.Name,
      fullName: userrow.Name,
      roles,
      permissions,
      formaccess,
      Dep,
    })
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime("8h")
      .sign(secret);

    // สร้าง NextResponse แล้ว set cookie HttpOnly
    const res = NextResponse.json({ success: true, fullName: userrow.Name, User_Id: userrow.User_Id, roles, permissions });
    res.cookies.set("auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 8 * 60 * 60, // 8 ชั่วโมง
    });

    return res;

  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
