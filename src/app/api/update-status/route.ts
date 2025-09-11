// app/api/update-status/route.ts
import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { GetupdateStatus } from "@/lib/modules/GetupdateStatus";
//fix
export async function POST(req: NextRequest) {
    try {
        // 1️⃣ ตรวจสอบ token
        const token = req.cookies.get("auth_token")?.value;
        if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const payload = jwt.verify(token, process.env.JWT_SECRET || "your_secret_key") as any;

        // 2️⃣ อ่าน body จาก client
        const body = await req.json();
        const formaccess = body.formaccess ?? payload.formaccess ?? [];
        const FormDep = body.FormDep ?? payload.Dep ?? {};

        // 3️⃣ เรียกฟังก์ชัน GetupdateStatus
        const data = await GetupdateStatus(formaccess, FormDep);

        // 4️⃣ ส่งผลลัพธ์กลับ
        return NextResponse.json(data);
    } catch (err) {
        console.error(err);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
