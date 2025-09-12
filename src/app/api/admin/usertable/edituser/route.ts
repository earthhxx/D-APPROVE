// /pages/api/usertable/edituser.ts
import { NextRequest, NextResponse } from "next/server";
import { getDashboardConnection } from "../../../../../lib/db";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { User_Id, Name, Department, Pass } = body;

        if (!User_Id || !Name) {
            return NextResponse.json({ error: "กรอกข้อมูลไม่ครบ" }, { status: 400 });
        }

        const pool = await getDashboardConnection();

        // UPDATE โดยใช้ User_Id เป็น primary key และไม่แก้ User_Id
        await pool.request()
            .input("User_Id", User_Id)
            .input("Name", Name)
            .input("Department", Department)
            .input("Pass", Pass)
            .query(`
                UPDATE [mydb].[dbo].[tb_im_employee]
                SET Name=@Name, Department=@Department, Pass=@Pass
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
