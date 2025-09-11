// app/page.tsx
"use client";
import { useEffect } from "react";
import { useAuth } from "./context/AuthContext";
import type { User } from "./components/Sidebar";
import { motion } from "framer-motion";
import Image from "next/image";
import LoginForm from "../app/components/LoginForm";
import "../app/styles/Boxes.scss";

interface HomePageProps {
  initialUser?: User;
}

export default function HomePage({ initialUser }: HomePageProps) {
  const { user, login, setOpen } = useAuth();

  useEffect(() => {
    if (initialUser && !user) {
      login(initialUser);
    }
  }, [initialUser, login, user]);

  const displayUser = user || initialUser;

  return (
    <div className="relative flex justify-center items-center w-full min-h-screen bg-gradient-to-r from-blue-400 via-sky-400 to-sky-200">
      {/* กล่องลอย */}
      {/* <div className="absolute inset-0 pointer-events-none">
        <div className="boxs">
          <div className="box one"></div>
          <div className="box two"></div>
          <div className="box three"></div>
          <div className="box four"></div>
        </div>
      </div> */}

      {/* Light rays, pointer-events-none to avoid blocking clicks */}
      <div className="light-ray-container pointer-events-none z-50">
        <div className="light-ray ray1" />
        <div className="light-ray ray2" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="relative z-50 bg-white/70 backdrop-blur-[10px] rounded-2xl shadow-lg w-[30%] text-center border border-gray-200 gap-8 p-8 px-4 flex flex-col md:flex-row justify-center items-center "
      >
        {/* Version */}
        <div className="absolute top-4 right-4 text-sm text-black">
          v1.0.0
        </div>

        {/* Left: Logo */}
        <div className="flex flex-col items-center justify-center w-[30%] ms-6">
          <div className="flex-shrink-0 w-40 h-40 md:w-44 md:h-44 mb-6">
            <div className="relative w-full h-full rounded-full bg-white opacity-80 shadow-2xl animate-spin-coin-reverse flex justify-center items-center">
              <Image src="/images/LOGO3.png" alt="Watermark" width={120} height={120} style={{ objectFit: "contain", backfaceVisibility: "hidden" }} priority />
            </div>
          </div>
        </div>
        {/* Right: Content */}
        <div className="flex flex-col items-center justify-center w-[60%] px-4">
          {displayUser && (
            <>
              <h1 className="text-4xl font-sans font-thin text-black">
                Welcome
              </h1>
              <h2 className="text-2xl font-bold text-black/80">
                {displayUser.fullName}
              </h2>

              {/* Open Sidebar Button */}
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setOpen(true)}
                className="mt-2 px-6 py-3 rounded-3xl bg-blue-900 text-white hover:bg-blue-400 shadow-md transition font-medium"
              >
                Open Menu
              </motion.button>
            </>
          )}

          {!displayUser && (
            <>
              <div className="w-full me-3">
                <LoginForm onLoginSuccess={(loggedUser) => login(loggedUser)} />
                <p className="mt-2 text-sm text-black/70 ">
                  กรุณาเข้าสู่ระบบเพื่อเข้าถึงเมนูของคุณ
                </p>
              </div>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}
