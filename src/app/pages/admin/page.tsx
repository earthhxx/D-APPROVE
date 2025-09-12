"use client";

import { useState, useRef, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import PermissionsTable from "./adcomponents/PermissionsTable";
import RolesTable from "./adcomponents/RolesTable";
import UsersTable from "./adcomponents/UsersTable";
import UserRolesTable from "./adcomponents/UserRolesTable";
import RolePermissionsTable from "./adcomponents/RolePermissionsTable";
import Filteruser from "./adcomponents/filteruser";

type ComponentType =
  | "Permissions"
  | "Roles"
  | "Users"
  | "UserRoles"
  | "RolePermissions"
  | "Filteruser";

export default function AdminAccessPage() {
  const { user } = useAuth();
  const roles = user?.roles ?? [];
  const isAdmin = roles.includes("Admin"); // ถ้าหน้านี้ "เฉพาะแอดมินเข้าได้" ให้กลับเงื่อนไขด้านล่าง

  // NOTE: ถ้าหน้านี้ "ไม่ให้แอดมินเข้า" ใช้แบบนี้ (ตามโค้ดเดิม)
  if (!user) {
    return <div className="p-4 text-white">Loading user info...</div>;
  }

  // ถ้าไม่ใช่ admin → บล็อก
  if (!isAdmin) {
    return <div className="flex justify-center items-center w-full h-full p-4 text-red-500 ">NO ACCESS</div>;
  }
  // --- เรียก Hooks ทุกตัวที่ top level ---
  const [selected, setSelected] = useState<ComponentType>("Permissions");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const options: ComponentType[] = [
    "Permissions",
    "Roles",
    "Users",
    "UserRoles",
    "RolePermissions",
    "Filteruser",
  ];

  // keyboard navigation
  const handleKey = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (!dropdownOpen) return;
    if (e.key === "ArrowDown") {
      setHighlightedIndex((prev) => (prev + 1) % options.length);
      e.preventDefault();
    }
    if (e.key === "ArrowUp") {
      setHighlightedIndex((prev) => (prev - 1 + options.length) % options.length);
      e.preventDefault();
    }
    if (e.key === "Enter") {
      setSelected(options[highlightedIndex]);
      setDropdownOpen(false);
    }
    if (e.key === "Escape") {
      setDropdownOpen(false);
    }
  };

  useEffect(() => {
    if (dropdownOpen && dropdownRef.current) {
      dropdownRef.current.focus();
    }
  }, [dropdownOpen]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);



  return (
    <div className="font-mono text-white bg-black pt-20">
      <div className="flex flex-row items-center gap-3 mb-4 ">
        <span className="font-bold ps-4">Select Function :</span>
        <div ref={dropdownRef} tabIndex={0} onKeyDown={handleKey} className="relative">
          <div
            className="bg-black text-white border border-white px-2 py-1 cursor-pointer"
            onClick={() => setDropdownOpen((prev) => !prev)}
          >
            {selected}
          </div>
          {dropdownOpen && (
            <div className="absolute top-full left-0 w-60 bg-black border border-white mt-1 z-50">
              {options.map((opt, index) => (
                <div
                  key={opt}
                  className={`px-2 py-1 cursor-pointer ${index === highlightedIndex ? "bg-white text-black" : "text-white"
                    }`}
                  onMouseEnter={() => setHighlightedIndex(index)}
                  onMouseDown={() => {
                    setSelected(opt);
                    setDropdownOpen(false);
                  }}
                >
                  {opt}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="min-h-[60vh] max-h-[60vh]">
        {selected === "Permissions" && <PermissionsTable />}
        {selected === "Roles" && <RolesTable />}
        {selected === "Users" && <UsersTable />}
        {selected === "UserRoles" && <UserRolesTable />}
        {selected === "RolePermissions" && <RolePermissionsTable />}
        {selected === "Filteruser" && <Filteruser />}
      </div>
    </div>
  );
}
