import type { Metadata } from "next";
import Sidebar from "./components/Sidebar";
import { Geist, Geist_Mono , Kanit } from "next/font/google";
import { cookies } from "next/headers"; // สำหรับ SSR cookie
import { jwtVerify } from "jose";
import "./globals.css";
import { AuthProvider } from "./context/AuthContext";
import { c } from "node_modules/framer-motion/dist/types.d-Cjd591yU";

export interface User { userId: string; fullName: string; roles: string[]; permissions: string[]; }

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const kanit = Kanit({
  variable: "--font-kanit",
  subsets: ["latin"],
  weight: ["200", "300", "400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: "IM D-APPROVE",
  description: "PDF Approval System",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // --- SSR: อ่าน cookie ---
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;

  let initialUser: User | null = null;
  if (token) {
    try {
      const secret = new TextEncoder().encode(process.env.JWT_SECRET!);
      const { payload } = await jwtVerify(token, secret);

      initialUser = {
        userId: payload.userId as string,
        fullName: payload.fullName as string,
        roles: Array.isArray(payload.roles)
          ? payload.roles
          : [payload.roles as string],
        permissions: Array.isArray(payload.permissions)
          ? payload.permissions
          : [payload.permissions as string],
      };
    } catch {
      initialUser = null;
    }
  }

  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${kanit.variable} font-sans bg-gray-100`}
      >
        <AuthProvider initialUser={initialUser}>
          <div className="flex flex-col min-h-screen w-screen">
            <Sidebar />
            <main className="flex-1 flex flex-col overflow-hidden">
              {children}
            </main>
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
