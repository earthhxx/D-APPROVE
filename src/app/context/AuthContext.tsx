// app/context/AuthContext.tsx
"use client";

import React, { createContext, useState, useContext, ReactNode } from "react";
import { User } from "../components/Sidebar";
import { useRouter } from "next/navigation";

interface AuthContextType {
  user: User | null;
  login: (user: User) => void;
  logout: () => void
  open: boolean;
  setOpen: (value: boolean) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);


export const AuthProvider = ({
  children,
  initialUser,
}: {
  children: ReactNode;
  initialUser?: User | null;
}) => {
  const [user, setUser] = useState<User | null>(initialUser || null);
  const [open, setOpen] = useState(false);

  const router = useRouter();

  const login = (newUser: User) => {
    console.log(newUser)
    setUser(newUser);
    // cookie ต้องถูกเซ็ตแล้วจาก API Login
  };

  const logout = async () => {
    await fetch("/api/Logout", { method: "POST" });
    setUser(null);
    router.push('/')
  };

  return (
    <AuthContext.Provider value={{ user, login, open, setOpen, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};
