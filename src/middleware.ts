import { NextRequest, NextResponse } from "next/server";
import { jwtVerify, JWTPayload } from "jose";

export type JwtPayload = {
  userId: number | string;
  username: string;
  fullName: string;
  roles: string[];
  permissions?: string[];
  iat?: number;
  exp?: number;
};

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // protect เฉพาะ /api/admin/*
  if (pathname.startsWith("/api/admin")) {
    const token = req.cookies.get("auth_token")?.value;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
      const secret = new TextEncoder().encode(process.env.JWT_SECRET!);
      const { payload } = (await jwtVerify(token, secret)) as { payload: JWTPayload & JwtPayload };

      if (!payload.roles?.includes("admin")) {
        return NextResponse.json({ error: "Forbidden: admin only" }, { status: 403 });
      }

      return NextResponse.next();
    } catch {
      return NextResponse.json({ error: "Invalid or expired token" }, { status: 403 });
    }
  }

  if (pathname.startsWith("/api/D-approve")) {
    const token = req.cookies.get("auth_token")?.value;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
      const secret = new TextEncoder().encode(process.env.JWT_SECRET!);
      const { payload } = (await jwtVerify(token, secret)) as { payload: JWTPayload & JwtPayload };

      if (!payload.permissions?.includes("D_Approve")) {
        return NextResponse.json({ error: "Forbidden: admin only" }, { status: 403 });
      }

      return NextResponse.next();
    } catch {
      return NextResponse.json({ error: "Invalid or expired token" }, { status: 403 });
    }
  }


  return NextResponse.next();
}

export const config = {
  matcher: ["/:path*"],
};
