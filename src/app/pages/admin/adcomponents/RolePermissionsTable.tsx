import { useState, useEffect, useRef } from "react";
import { RolePermission } from "../types";
import { Permission } from "../types";
import { Role } from "../types";

export default function RolesPermissionList() {
  const [items, setItems] = useState<RolePermission[]>([]);
  const [rolesItems, setRolesItems] = useState<Role[]>([]);
  const [permissionitems, setPermissionitems] = useState<Permission[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchTerm2, setSearchTerm2] = useState("");
  const [form, setForm] = useState({ RoleID: "", PermissionID: "" });
  const confirmRef = useRef<HTMLDivElement>(null);


  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Confirm add/delete
  const [confirm, setConfirm] = useState<{ visible: boolean; type: "add" | "delete" | null; RoleID?: number | string; PermissionID?: string | number }>({
    visible: false,
    type: null,
  });

  const [choice, setChoice] = useState<"Yes" | "No">("No");

  const fetchRolesPer = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/rolepermission/role-permissions", {
        method: "GET",
        credentials: "include", // ✅ สำคัญ
      });
      if (!res.ok) throw new Error("Failed to fetch role permissions");
      const data = await res.json();
      setItems(data.data ?? []);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError(String(err)); // fallback สำหรับค่าอื่น ๆ
      }
    } finally {
      setLoading(false);
    }
  };

  // --- Fetch on mount ---
  useEffect(() => {
    const fetchUserRoles = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/admin/rolepermission/role-permissions", {
          method: "GET",
          credentials: "include", // ✅ สำคัญ
        });
        if (!res.ok) throw new Error("Failed to fetch role permissions");
        const data = await res.json();
        setItems(data.data ?? []);
      } catch (err: unknown) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError(String(err)); // fallback สำหรับค่าอื่น ๆ
        }
      } finally {
        setLoading(false);
      }
    };
    fetchUserRoles();
  }, []);


  // --- Permissions ---
  useEffect(() => {
    const fetchPermissions = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/admin/permissiontable/permissions", {
          method: "GET",
          credentials: "include", // ✅ ส่ง cookie ไปแทน
        });
        if (!res.ok) throw new Error("Failed to fetch permissions");
        const data = await res.json();
        setPermissionitems(data.data ?? []);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        setLoading(false);
      }
    };
    fetchPermissions();
  }, []);

  // --- Roles ---
  useEffect(() => {
    const fetchRoles = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/admin/roletable/roles", {
          method: "GET",
          credentials: "include", // ✅ ส่ง cookie
        });
        if (!res.ok) throw new Error("Failed to fetch roles");
        const data = await res.json();
        setRolesItems(data.data ?? []);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        setLoading(false);
      }
    };
    fetchRoles();
  }, []);

  // --- ADD ---
  // --- trigger add confirm ---
  const triggerAddConfirm = () => {
    if (!form.RoleID.trim() || !form.PermissionID.trim()) {
      alert("กรุณากรอก RoleID และ PermissionID");
      return;
    }
    setConfirm({ visible: true, type: "add" });
  };


  // --- ADD ---
  const confirmAddRolePermssions = async () => {
    const res = await fetch("/api/admin/rolepermission/addroleper", {
      method: "POST",
      credentials: "include", // ✅ ส่ง cookie
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ RoleID: form.RoleID, PermissionID: form.PermissionID }),
    });

    if (!res.ok) { alert("Failed to add role"); return; }
    const updatedRoles: RolePermission[] = await res.json();
    setItems(updatedRoles);
    setForm({ RoleID: "", PermissionID: "" });
    setConfirm({ visible: false, type: "add" });
  };


  // --- DELETE ---
  const delPer = (RoleID: string | number, PermissionID: string | number) => {
    setConfirm({ visible: true, type: "delete", RoleID, PermissionID });
  };


  // --- DELETE ---
  const confirmDelete = async (RoleID: string | number, PermissionID: string | number) => {
    const res = await fetch("/api/admin/rolepermission/delroleper", {
      method: "POST",
      credentials: "include", // ✅ ส่ง cookie
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ RoleID, PermissionID }),
    });

    if (res.ok)
      setItems(prev => prev.filter(r => !(r.RoleID === RoleID && r.PermissionID === PermissionID)));
    else alert("Failed to delete Role Permissions");

    setConfirm({ visible: false, type: "delete" });
  };

  // --- keyboard ---
  const handleKey = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (!confirm.visible) return;

    let currentChoice = choice;

    if (e.key === "ArrowUp" || e.key === "ArrowDown") {
      e.preventDefault();
      currentChoice = choice === "Yes" ? "No" : "Yes";
      setChoice(currentChoice);
    }

    if (e.key === "Enter") {
      e.preventDefault();
      if (currentChoice === "Yes") {
        if (confirm.type === "add") confirmAddRolePermssions();
        if (confirm.type === "delete" && confirm.RoleID !== undefined && confirm.PermissionID !== undefined) confirmDelete(confirm.RoleID, confirm.PermissionID);
      } else {
        // กรณีเลือก No
        setConfirm({ visible: false, type: confirm.type });
        setForm({ RoleID: "", PermissionID: "" });
      }
      // **reset choice** กลับค่า default หลังกด Enter
      setChoice("No");
    }

    if (e.key === "Escape") {
      setConfirm({ visible: false, type: confirm.type });
      setChoice("No"); // reset choice ด้วย
    }
  };

  useEffect(() => {
    if (confirm.visible && confirmRef.current) {
      confirmRef.current.focus();
    } else {
      // กลับ focus ไปที่ body หรือ input อื่น
      document.body.focus();
    }
  }, [confirm.visible]);

  return (
    <div className="flex flex-col justify-start items-start w-full mx-auto space-y-6 font-mono text-white bg-black p-4">


      <h2 className="text-2xl font-bold">Roles Permissions</h2>

      {loading && <div>Loading Roles Permissions...</div>}
      {error && <div className="text-red-500">{error}</div>}

      {!loading && !error && (
        <>
          {/* List */}
          <div className="mb-6 max-h-[75vh] overflow-auto custom-scrollbar border border-white ">
            <table className="w-full border-collapse font-mono text-sm">
              <thead>
                <tr className="bg-black text-white">
                  <th className="border border-gray-500 px-3 py-1 w-[5%] text-left">RoleID</th>
                  <th className="border border-gray-500 px-3 py-1 w-[5%] text-left">Permissions</th>
                  <th className="border border-gray-500 px-3 py-1 w-[0.1%] text-left">Action</th>
                </tr>
              </thead>
              <tbody>
                {items
                  .filter(u =>
                    String(u.RoleID).toLowerCase().includes(searchTerm.toLowerCase()) &&
                    String(u.PermissionID).toLowerCase().includes(searchTerm2.toLowerCase()))
                  .map((u, index) => (
                    <tr key={`${u.RoleID} - ${index}`} className="hover:bg-white/10">
                      <td className="border border-gray-500 px-3 py-1">{u.RoleID}</td>
                      <td className="border border-gray-500 px-3 py-1">{u.PermissionID}</td>
                      <td className="flex justify-center border border-gray-500 px-3 py-1">
                        <button
                          onClick={() => delPer(u.RoleID, u.PermissionID)}
                          className="px-2 py-1 bg-white text-black hover:bg-red-800"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* CMD Style Floating Form */}
      <div className="fixed flex flex-col right-0 bottom-0 w-[40%] h-screen border border-white bg-black text-white p-4 rounded-lg shadow-lg space-y-4">
        {/* Search bar */}
        <div className="mb-4 z-40 top-4 right-0 w-full p-2 bg-black border border-white rounded flex flex-col sm:flex-row gap-2">
          <div className="flex items-center w-[25%]">FIND ROLES :</div>
          <input
            type="text"
            placeholder="Search Roles ID"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="flex-1 p-2 bg-black border border-white text-white rounded"
          />
        </div>

        {/* Search bar */}
        <div className="mb-4 z-40 top-4 right-0 w-full p-2 bg-black border border-white rounded flex flex-col sm:flex-row gap-2">
          <div className="flex items-center w-[25%]">FIND PERMISSIONS :</div>
          <input
            type="text"
            placeholder="Search Permission ID"
            value={searchTerm2}
            onChange={e => setSearchTerm2(e.target.value)}
            className="flex-1 p-2 bg-black border border-white text-white rounded"
          />
        </div>
        {/* Roles Table */}
        {!loading && (
          <div className="flex flex-col flex-1 min-h-0">
            <h3 className="text-sm font-bold mb-2">Roles</h3>
            <div className="flex-1 overflow-auto border custom-scrollbar border-gray-700 rounded-lg">
              <table className="w-full border-collapse font-mono text-sm">
                <thead className="sticky top-0 bg-black">
                  <tr>
                    <th className="border border-gray-500 px-3 py-1 w-[5%] text-left">ID</th>
                    <th className="border border-gray-500 px-3 py-1 w-[20%] text-left">Role Name</th>
                    <th className="border border-gray-500 px-3 py-1 text-left">Description</th>
                  </tr>
                </thead>
                <tbody>
                  {rolesItems.map(p => (
                    <tr key={p.RoleID} className="hover:bg-white/10">
                      <td className="border border-gray-500 px-3 py-1">{p.RoleID}</td>
                      <td className="border border-gray-500 px-3 py-1">{p.RoleName}</td>
                      <td className="border border-gray-500 px-3 py-1">{p.Description || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Permissions Table */}
        {!loading && (
          <div className="flex flex-col flex-1 min-h-0">
            <h3 className="text-sm font-bold mb-2">Permissions</h3>
            <div className="flex-1 overflow-auto custom-scrollbar border border-gray-700 rounded-lg">
              <table className="w-full border-collapse font-mono text-sm">
                <thead className="sticky top-0 bg-black">
                  <tr>
                    <th className="border border-gray-500 px-3 py-1 w-[5%] text-left">ID</th>
                    <th className="border border-gray-500 px-3 py-1 w-[20%] text-left">Permission Name</th>
                    <th className="border border-gray-500 px-3 py-1 text-left">Description</th>
                  </tr>
                </thead>
                <tbody>
                  {permissionitems.map(p => (
                    <tr key={p.PermissionID} className="hover:bg-white/10">
                      <td className="border border-gray-500 px-3 py-1">{p.PermissionID}</td>
                      <td className="border border-gray-500 px-3 py-1">{p.PermissionName}</td>
                      <td className="border border-gray-500 px-3 py-1">{p.Description || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Add New Section */}
        <div>
          <div className="text-sm font-bold mb-2">Add New Role Permission</div>
          <input
            className="w-full p-2 mb-2 bg-black text-white border border-white rounded outline-none"
            placeholder="RoleID"
            value={form.RoleID}
            onChange={e => setForm({ ...form, RoleID: e.target.value })}
          />
          <input
            className="w-full p-2 mb-3 bg-black text-white border border-white rounded outline-none"
            placeholder="PermissionID"
            value={form.PermissionID}
            onChange={e => setForm({ ...form, PermissionID: e.target.value })}
            onKeyDown={e => { if (e.key === "Enter") triggerAddConfirm(); }}
          />
          <button
            className="w-full py-2 bg-white text-black font-bold rounded hover:bg-gray-300"
            onClick={triggerAddConfirm}
          >
            [ Enter ]
          </button>
        </div>

      </div>


      {/* Confirm card */}
      {confirm.visible && (
        <div ref={confirmRef}
          tabIndex={0} // ต้องมี tabIndex เพื่อให้ div รับ focus
          onKeyDown={handleKey} className="fixed inset-0 flex items-center justify-center bg-black/70 z-50">
          <div className="bg-black text-white border border-white rounded-lg p-5 w-80">
            <div className="mb-3">
              {confirm.type === "add"
                ? `Add new RolesPermission "${form.RoleID}"?`
                : "Are you sure you want to delete?"}
            </div>
            <div className="flex flex-col gap-2">
              <div
                className={`px-3 py-1 border cursor-pointer ${choice === "Yes" ? "bg-white text-black" : ""}`}
                onMouseEnter={() => setChoice("Yes")} // ← highlight เวลา hover
                onClick={() => {
                  if (confirm.type === "add") confirmAddRolePermssions();
                  if (confirm.type === "delete" && confirm.RoleID !== undefined && confirm.PermissionID !== undefined) confirmDelete(confirm.RoleID, confirm.PermissionID);
                  setChoice("No");
                }}
              >
                Yes
              </div>
              <div
                className={`px-3 py-1 border cursor-pointer ${choice === "No" ? "bg-white text-black" : ""}`}
                onMouseEnter={() => setChoice("No")} // ← highlight เวลา hover
                onClick={() => { setConfirm({ visible: false, type: confirm.type }); setChoice("No"); }}
              >
                No
              </div>
            </div>
            <div className="mt-3 text-xs text-gray-400">
              Use ↑ ↓ to select, Enter to confirm or click
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
