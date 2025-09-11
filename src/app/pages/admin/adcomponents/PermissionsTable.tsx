"use client";
import { useState, useEffect, useRef } from "react";
import { Permission } from "../types";

export default function PermissionsList() {
    const [items, setItems] = useState<Permission[]>([]);
    const [form, setForm] = useState({ PermissionName: "", Description: "" });
    const confirmRef = useRef<HTMLDivElement>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [searchTerm2, setSearchTerm2] = useState("");
    const [searchTerm3, setSearchTerm3] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Confirm add/delete
    const [confirm, setConfirm] = useState<{ visible: boolean; type: "add" | "delete" | null; id?: number | string }>({
        visible: false,
        type: null,
    });

    const [choice, setChoice] = useState<"Yes" | "No">("No");

    // --- Fetch on mount ---
    useEffect(() => {
        const fetchPermissions = async () => {
            setLoading(true);
            setError(null);
            try {
                const res = await fetch("/api/admin/permissiontable/permissions", {
                    method: "GET",
                    credentials: "include", // ✅ สำคัญ
                });
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
        fetchPermissions();
    }, []);

    // --- ADD ---
    const triggerAddConfirm = () => {
        if (!form.PermissionName.trim()) return;
        setConfirm({ visible: true, type: "add" });
    };

    const confirmAddPermission = async () => {
        try {
            const res = await fetch("/api/admin/permissiontable/addPermissions", {
                method: "POST",
                credentials: "include", // <<<<<<<< สำคัญ
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(form),
            });

            if (!res.ok) {
                throw new Error(`Failed: ${res.status}`);
            }

            // API ควรส่งกลับเป็น list updated
            const updatedPermissions: Permission[] = await res.json();
            setItems(updatedPermissions);

            // reset form
            setForm({ PermissionName: "", Description: "" });
            setConfirm({ visible: false, type: "add" });
        } catch (err: any) {
            setError(err.message);
        }
    };

    // --- DELETE ---
    const delPer = (id: number | string) => {
        setConfirm({ visible: true, type: "delete", id });
    };

    const confirmDelete = async (id: number | string) => {
        try {
            const res = await fetch("/api/admin/permissiontable/delPermissions", {
                method: "POST",
                credentials: "include", // <<<<<<<< สำคัญ
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ PermissionID: id }),
            });

            if (!res.ok) {
                throw new Error("Failed to delete permission");
            }

            setItems(prev => prev.filter(p => p.PermissionID !== id));
            setConfirm({ visible: false, type: "delete" });
        } catch (err: any) {
            setError(err.message);
        }
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
                if (confirm.type === "add") confirmAddPermission();
                if (confirm.type === "delete" && confirm.id !== undefined) confirmDelete(confirm.id);
            } else {
                setConfirm({ visible: false, type: confirm.type });
                setForm({ PermissionName: "", Description: "" });
            }
            setChoice("No");
        }

        if (e.key === "Escape") {
            setConfirm({ visible: false, type: confirm.type });
            setChoice("No");
        }
    };

    useEffect(() => {
        if (confirm.visible && confirmRef.current) {
            confirmRef.current.focus();
        } else {
            document.body.focus();
        }
    }, [confirm.visible]);

    return (
        <div className="flex flex-col justify-start items-start w-full space-y-6 font-mono text-white bg-black p-4">
            <h2 className="text-2xl font-bold">Permissions</h2>

            {loading && <div>Loading permissions...</div>}
            {error && <div className="text-red-500">{error}</div>}

            {!loading && !error && (
                <>
                    {/* List */}
                    <div className="mb-6 max-h-[75vh] overflow-auto custom-scrollbar border border-white ">
                        <table className="w-full border-collapse text-sm">
                            <thead>
                                <tr className="bg-black text-white">
                                    <th className="border border-gray-500 px-3 py-1 w-[5%] text-left">ID</th>
                                    <th className="border border-gray-500 px-3 py-1 w-[20%] text-left">Permission Name</th>
                                    <th className="border border-gray-500 px-3 py-1 text-left">Description</th>
                                    <th className="border border-gray-500 px-3 py-1 w-[5%] text-left">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {items
                                    .filter(u =>
                                        String(u.PermissionID).toLowerCase().includes(searchTerm.toLowerCase()) &&
                                        String(u.PermissionName).toLowerCase().includes(searchTerm2.toLowerCase()) &&
                                        String(u.Description).toLowerCase().includes(searchTerm3.toLowerCase())
                                    )
                                    .map(p => (
                                        <tr key={p.PermissionID} className="hover:bg-white/10">
                                            <td className="border border-gray-500 px-3 py-1">{p.PermissionID}</td>
                                            <td className="border border-gray-500 px-3 py-1">{p.PermissionName}</td>
                                            <td className="border border-gray-500 px-3 py-1">{p.Description || "-"}</td>
                                            <td className="flex justify-center border border-gray-500 px-3 py-1">
                                                <button
                                                    onClick={() => delPer(p.PermissionID)}
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
            <div className="fixed flex flex-col right-0 bottom-0 w-[40%] border border-white bg-black text-white p-4 rounded-lg shadow-lg">
                {/* Search bar */}
                <div className="mb-4 z-40 top-4 right-0 w-full p-2 bg-black border border-white rounded flex flex-col sm:flex-row gap-2">
                    <div className="flex items-center w-[25%]">Permission ID :</div>
                    <input
                        type="text"
                        placeholder="Search by ID"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="flex-1 p-2 bg-black border border-white text-white rounded"
                    />
                </div>

                {/* Search bar */}
                <div className="mb-4 z-40 top-4 right-0 w-full p-2 bg-black border border-white rounded flex flex-col sm:flex-row gap-2">
                    <div className="flex items-center w-[25%]">Permission Name :</div>
                    <input
                        type="text"
                        placeholder="Search by Permission Name"
                        value={searchTerm2}
                        onChange={e => setSearchTerm2(e.target.value)}
                        className="flex-1 p-2 bg-black border border-white text-white rounded"
                    />
                </div>

                {/* Search bar */}
                <div className="mb-4 z-40 top-4 right-0 w-full p-2 bg-black border border-white rounded flex flex-col sm:flex-row gap-2">
                    <div className="flex items-center w-[25%]">FIND Desciption :</div>
                    <input
                        type="text"
                        placeholder="Search by Desciption"
                        value={searchTerm3}
                        onChange={e => setSearchTerm3(e.target.value)}
                        className="flex-1 p-2 bg-black border border-white text-white rounded"
                    />
                </div>

                <div className="text-sm font-bold mb-2">Add New Permission</div>
                <input
                    className="w-full p-2 mb-2 bg-black text-white border border-white outline-none"
                    placeholder="Permission Name"
                    value={form.PermissionName}
                    onChange={e => setForm({ ...form, PermissionName: e.target.value })}
                />
                <input
                    className="w-full p-2 mb-3 bg-black text-white border border-white outline-none"
                    placeholder="Description"
                    value={form.Description}
                    onChange={e => setForm({ ...form, Description: e.target.value })}
                    onKeyDown={e => { if (e.key === "Enter") triggerAddConfirm(); }}
                />
                <button className="w-full py-2 bg-white text-black hover:bg-gray-300" onClick={triggerAddConfirm}>
                    [ Enter ]
                </button>
            </div>

            {/* Confirm card */}
            {confirm.visible && (
                <div ref={confirmRef}
                    tabIndex={0}
                    onKeyDown={handleKey}
                    className="relative"
                >
                    <div className="fixed inset-0 flex items-center justify-center bg-black/70 z-50">
                        <div className="bg-black text-white border border-white rounded-lg p-5 w-80">
                            <div className="mb-3">
                                {confirm.type === "add"
                                    ? `Add new permission "${form.PermissionName}"?`
                                    : "Are you sure you want to delete?"}
                            </div>
                            <div className="flex flex-col gap-2">
                                <div
                                    className={`px-3 py-1 border cursor-pointer ${choice === "Yes" ? "bg-white text-black" : ""}`}
                                    onMouseEnter={() => setChoice("Yes")}
                                    onClick={() => {
                                        if (confirm.type === "add") confirmAddPermission();
                                        if (confirm.type === "delete" && confirm.id !== undefined) confirmDelete(confirm.id);
                                        setChoice("No");
                                    }}
                                >
                                    Yes
                                </div>
                                <div
                                    className={`px-3 py-1 border cursor-pointer ${choice === "No" ? "bg-white text-black" : ""}`}
                                    onMouseEnter={() => setChoice("No")}
                                    onClick={() => {
                                        setChoice("No");
                                        setConfirm({ visible: false, type: confirm.type });
                                    }}
                                >
                                    No
                                </div>
                            </div>
                            <div className="mt-3 text-xs text-gray-400">
                                Use ↑ ↓ to select, Enter to confirm or click
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
