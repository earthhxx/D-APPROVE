// src/app/api/D-approve/D-approve/route.ts
import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { getDApproveData } from "@/lib/modules/DApproveModule";

export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get("auth_token")?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const payload = jwt.verify(token, process.env.JWT_SECRET || "your_secret_key") as any;

    const body = await req.json();
    const data = await getDApproveData({ ...body, formaccess: body.formaccess || payload.formaccess || [] });


    return NextResponse.json(data);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
