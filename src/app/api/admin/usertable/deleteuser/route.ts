// /pages/api/usertable/deleteuser.ts
import { NextRequest, NextResponse } from "next/server";
import { getDashboardConnection } from "../../../../../lib/db";

export async function POST(req: NextRequest) {
    try {
        const { User_Id } = await req.json();

        if (!User_Id) {
            return NextResponse.json({ error: "Missing user id" }, { status: 400 });
        }

        const pool = await getDashboardConnection();

        // DELETE โดยใช้ User_Id เป็น primary key
        await pool.request()
            .input("User_Id", User_Id)
            .query(`
                DELETE FROM [mydb].[dbo].[tb_im_employee]
                WHERE User_Id=@User_Id
            `);

        // SELECT ข้อมูลทั้งหมดส่งกลับ
        const result = await pool.request().query(`
            SELECT [id],[User_Id],[Pass],[Name],[Age],[Sex],[Tel],[Department],[Process],[Image],[StartDate],[Status],[CreateDate]
            FROM [dbo].[tb_im_employee]
        `);

        return NextResponse.json(result.recordset);

    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
