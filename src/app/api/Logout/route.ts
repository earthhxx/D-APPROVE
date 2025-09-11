import { NextResponse } from "next/server";

export async function POST() {
  const response = NextResponse.json({ success: true });

  // ลบ cookie ที่ชื่อ auth_token
  response.cookies.set("auth_token", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: new Date(0), // หมดอายุทันที
  });

  return response;
}
