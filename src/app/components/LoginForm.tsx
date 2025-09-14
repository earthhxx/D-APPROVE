"use client";
import { useState } from "react";
import { User } from "./Sidebar";
import { useAuth } from "../context/AuthContext";

type Props = {
  onLoginSuccess: (loggedUser: User) => void;
};

export default function LoginForm({ onLoginSuccess }: Props) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const { login } = useAuth(); // ใช้ context แทน props


  const clearForm = () => {
    setUsername("");
    setPassword("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const res = await fetch("http://localhost:5284/api/main/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
        credentials: "include"
      });
      if (!res.ok) {
        const errorText = await res.text(); // ถ้า JSON fail → อ่านเป็น text
        alert(errorText);
        console.log(errorText)
        return;
      }
      const data = await res.json();



      if (res.ok) {
        clearForm();
        //next api
        // onLoginSuccess({
        //   userId: data.User_Id,
        //   fullName: data.fullName,
        //   roles: data.roles,
        //   permissions: data.permissions,
        // });

        console.log(data)

        //.net api
        login({
          userId: data.user_Id.toString(),    // User_Id มีจริง U ตัวเล็กไอสัส
          fullName: data.fullName,            // ใช้ fullName ตัวเล็ก
          roles: Array.isArray(data.roles) ? data.roles : (data.roles || "").split(","),
          permissions: Array.isArray(data.permissions) ? data.permissions : (data.permissions || "").split(",")
        });





      } else {
        alert(data.error || "Login ล้มเหลว ❌");
        clearForm();
      }
    } catch (error) {
      alert("เกิดข้อผิดพลาดในการเชื่อมต่อ");
      console.error(error);
    }
  };

  return (
    <form className="flex flex-col z-50 w-full max-w-[350px] mt-4" onSubmit={handleSubmit}>
      {/* Username */}
      <label className="text-[16px] font-sans font-light text-start mb-1 text-gray-800">Username</label>
      <input
        className="rounded-md px-3 py-2 mb-3 bg-white/80 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-200 placeholder-gray-500 text-gray-900 text-sm"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        placeholder="รหัสพนักงาน เช่น 1234"
        required
      />

      {/* Password */}
      <label className="text-[16px] font-sans font-light text-start mb-1 text-gray-800">Password</label>
      <input
        className="rounded-md px-3 py-2 mb-3 bg-white/80 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-200 placeholder-gray-500 text-gray-900 text-sm"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
        required
      />

      {/* Submit Button */}
      <button
        type="submit"
        className="bg-white hover:bg-blue-900 hover:text-white text-black rounded-3xl px-5 py-2 w-full shadow-md transition font-medium text-sm mt-2"
      >
        Login
      </button>
    </form>
  );
}
