import { NextRequest, NextResponse } from "next/server";
import { getDashboardConnection } from "../../../../../lib/db";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { User_Id, Name, Department, Pass } = body;

        if (!User_Id || !Name) {
            return NextResponse.json({ error: "กรอก User_Id และ Name ก่อน" }, { status: 400 });
        }

        const pool = await getDashboardConnection();

        // INSERT
        await pool.request()
            .input("User_Id", User_Id)
            .input("Name", Name)
            .input("Department", Department)
            .input("Pass", Pass)
            .query(`
                INSERT INTO [dbo].[tb_im_employee] (User_Id, Name, Department, Pass, CreateDate)
                VALUES (@User_Id, @Name, @Department, @Pass, GETDATE())
            `);

        // RETURN ทั้งหมด
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
