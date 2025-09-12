"use client";

import { useEffect, useMemo, useState } from "react";

type User = {
  userId: number;
  fullName: string;
  roles: string[];
  permissions: string[];
};

export default function FilterUser() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchUserID, setSearchUserID] = useState("");
  const [searchName, setSearchName] = useState("");
  const [searchRole, setSearchRole] = useState("");
  const [searchPermission, setSearchPermission] = useState("");

  useEffect(() => {
    const ac = new AbortController();

    const fetchUsers = async () => {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch("/api/admin/checkuser", {
          method: "GET",
          credentials: "include",
          headers: { Accept: "application/json" },
          signal: ac.signal,
        });

        if (res.status === 401 || res.status === 403) {
          throw new Error("Unauthorized. Your session may be invalid.");
        }
        if (!res.ok) {
          throw new Error(`Failed to fetch users (${res.status})`);
        }

        const data: User[] = await res.json();
        setUsers(Array.isArray(data) ? data : []);
      } catch (err: unknown) {
        if ((err as any)?.name === "AbortError") return;
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
    return () => ac.abort();
  }, []);

  // Helper: escape ตัวอักษรพิเศษใน regex
  const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  const highlightText = (text: string, search: string) => {
    if (!search) return text;
    const regex = new RegExp(`(${escapeRegExp(search)})`, "gi");
    const parts = text.split(regex);
    return parts.map((part, i) =>
      regex.test(part) ? (
        <span key={i} className="bg-yellow-400 text-black font-bold">{part}</span>
      ) : (
        <span key={i}>{part}</span>
      )
    );
  };

  // Filtered users
  const filteredUsers = useMemo(() => {
    const qId = searchUserID.trim();
    const qName = searchName.trim().toLowerCase();
    const qRole = searchRole.trim().toLowerCase();
    const qPerm = searchPermission.trim().toLowerCase();

    return users.filter((u) => {
      const roles = u.roles ?? [];
      const perms = u.permissions ?? [];
      const matchesUserID = qId ? String(u.userId).includes(qId) : true;
      const matchesName = qName ? u.fullName.toLowerCase().includes(qName) : true;
      const matchesRole = qRole ? roles.some((r) => r.toLowerCase().includes(qRole)) : true;
      const matchesPermission = qPerm ? perms.some((p) => p.toLowerCase().includes(qPerm)) : true;
      return matchesUserID && matchesName && matchesRole && matchesPermission;
    });
  }, [users, searchUserID, searchName, searchRole, searchPermission]);

  return (
    <div className="bg-black min-h-screen text-white font-mono p-4">
      <h1 className="text-2xl font-bold mb-4">Admin - Check Users Access</h1>

      {/* Search bar */}
      <div className="sticky top-0 bg-black z-20 p-2 mb-4 border-b border-white flex flex-wrap gap-2">
        <input
          type="text"
          placeholder="Search User ID"
          value={searchUserID}
          onChange={(e) => setSearchUserID(e.target.value)}
          className="p-2 rounded border border-white bg-black text-white placeholder-gray-400"
        />
        <input
          type="text"
          placeholder="Search Name"
          value={searchName}
          onChange={(e) => setSearchName(e.target.value)}
          className="p-2 rounded border border-white bg-black text-white placeholder-gray-400"
        />
        <input
          type="text"
          placeholder="Search Role"
          value={searchRole}
          onChange={(e) => setSearchRole(e.target.value)}
          className="p-2 rounded border border-white bg-black text-white placeholder-gray-400"
        />
        <input
          type="text"
          placeholder="Search Permission"
          value={searchPermission}
          onChange={(e) => setSearchPermission(e.target.value)}
          className="p-2 rounded border border-white bg-black text-white placeholder-gray-400"
        />
      </div>

      {/* Status messages */}
      {loading && <div className="p-4 text-white">Loading users...</div>}
      {error && <div className="p-4 text-red-500">Error: {error}</div>}

      {/* Users table */}
      {!loading && !error && (
        <div className="overflow-x-auto max-h-[65vh] border border-white">
          <table className="min-w-full border-collapse">
            <thead className="sticky top-0 bg-gray-900 z-10">
              <tr>
                <th className="p-2 border border-white text-left">User ID</th>
                <th className="p-2 border border-white text-left">Full Name</th>
                <th className="p-2 border border-white text-left">Roles</th>
                <th className="p-2 border border-white text-left">Permissions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((u) => (
                <tr key={u.userId} className="hover:bg-gray-700">
                  <td className="p-2 border border-white">
                    {highlightText(String(u.userId), searchUserID)}
                  </td>
                  <td className="p-2 border border-white">
                    {highlightText(u.fullName, searchName)}
                  </td>
                  <td className="p-2 border border-white">
                    {highlightText((u.roles ?? []).join(", "), searchRole)}
                  </td>
                  <td className="p-2 border border-white">
                    {highlightText((u.permissions ?? []).join(", "), searchPermission)}
                  </td>
                </tr>
              ))}
              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-2 border border-white text-center text-gray-400">
                    No users found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
