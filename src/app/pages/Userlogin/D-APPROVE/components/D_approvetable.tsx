"use client";

import React, { useState } from "react";
import SupervisorPopup from "./BT_SupervisorPage";
import Manager from "./BT_ManagerPage";


interface ApproveData {
    totalAll: number;
    totals: Record<string, number>; // เพิ่มตรงนี้
    data: { id: number; FormThai: string; Dep: string; name: string; source: string; date?: string; DateRequest?: string; DateCheck: string; NameRequest: string; DateApprove?: string }[];
    error?: string;
}

interface FormOption {
    check: Record<string, string[]>;
    approve: Record<string, string[]>;
    all: Record<string, string[]>;
}

interface UserPayload {
    userId?: number | string;
    username?: string;
    fullName?: string;
    roles?: string[];
    permissions?: string[];
    formaccess?: string[];
    Dep?: string[];
}

interface AmountData {
    ApproveNull: number, CheckNull: number, somethingNull: number
}



interface DApproveTableProps {
    user: UserPayload;
    initialData: ApproveData;
    AmountData: AmountData; // เปลี่ยนตรงนี้
    formOption?: FormOption;
    formkey: FormOptionKey;
    formaccess: string[];
    tabFormMap: {};
}

interface FormOption {
    check: Record<string, string[]>;
    approve: Record<string, string[]>;
    all: Record<string, string[]>;
}

type FormOptionKey = keyof FormOption; // "check" | "approve" | "all"

interface SelectedDoc {
    id: number;
    source: string;
    Dep: string;

}

const tabToKeyMap: Record<Tab, FormOptionKey> = {
    Check_TAB: "check",
    Approve_TAB: "approve",
    All_TAB: "all",
};

type Tab = "Check_TAB" | "Approve_TAB" | "All_TAB";

export default function DApproveTable({ user, initialData, AmountData, formOption, formkey, formaccess, tabFormMap }: DApproveTableProps) {
    // form options จาก formOption[key] เช่น formOption.all
    const [selectedForm, setSelectedForm] = useState<string>(""); // Form ที่เลือก
    const [selectedDep, setSelectedDep] = useState<string>(""); // Dep ที่เลือก

    const [startDate, setStartDate] = useState<string>("");
    const [endDate, setEndDate] = useState<string>("");

    const [formOptions, setFormOptions] = useState<string[]>(() =>
        formOption?.[formkey] ? Object.keys(formOption[formkey]) : []
    );
    const [depOptions, setDepOptions] = useState<string[]>(() => formOption?.[formkey] ? Array.from(new Set(Object.values(formOption[formkey]).flat())) : []);

    const [search, setSearch] = useState("");
    const [offset, setOffset] = useState(0);
    const [limit] = useState(13);

    const [loading, setLoading] = useState(false);
    const [approveData, setApproveData] = useState<ApproveData>(initialData);
    console.log("csr", AmountData)
    const [dataAmount, setDataAmount] = useState<AmountData>(AmountData);
    console.log("dataamo", dataAmount)
    const availableTabs = (["Check_TAB", "Approve_TAB", "All_TAB"] as Tab[]).filter(t =>
        user.permissions?.includes(t)
    );
    // console.log('ava', availableTabs);
    const [tab, setTab] = useState<Tab>(availableTabs[0] || "Check_TAB"); // เลือก tab แรกที่ user มีสิทธิ์

    const [showPDF, setShowPDF] = useState(false);
    const [pdfUrl, setPdfUrl] = useState("");
    const [showSupervisorPopup, setShowSupervisorPopup] = useState(false);
    const [showManagerPopup, setShowManagerPopup] = useState(false);

    const [selectID, setSelectID] = useState<string | number>("");
    const [selectTable, setSelectTable] = useState("");
    const [selectDep, setselectDep] = useState("");


    const [selected, setSelected] = useState<SelectedDoc[]>([]);
    const allDocs = approveData.data.map((doc) => ({ id: doc.id, source: doc.source }));

    const canApproveSupervisor = selected.length > 0 && selected.every(s =>
        user?.permissions?.includes(`Check_${s.source}_${s.Dep}`)
    );

    const canApproveManager = selected.length > 0 && selected.every(s =>
        user?.permissions?.includes(`Approve_${s.source}_${s.Dep}`)
    );


    const toggleSelectAll = () => {
        if (selected.length === allDocs.length) {
            setSelected([]);
        } else {
            setSelected(approveData.data.map(doc => ({ id: doc.id, source: doc.source, Dep: doc.Dep })));
        }
    };

    const handleGroupApprove = async (status: "check" | "approve" | "reject", card: "Supervisor" | "Manager") => {
        try {
            await fetch("/api/save-status-report", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    records: selected,
                    status,
                    fullname: user.fullName,
                    card,
                }),
            });

            alert(`บันทึก ${status} สำเร็จ`);
            setSelected([]);
            refreshAmount();
            fetchData(offset, search, tab);
        } catch (err) {
            console.error(err);
            alert("เกิดข้อผิดพลาด");
        }
    };

    const fetchData = async (
        newOffset = 0,
        query = "",
        newTab: Tab = tab,
        form = selectedForm,
        dep = selectedDep,
        start = startDate,
        end = endDate
    ) => {
        setLoading(true);

        try {
            const key = tabToKeyMap[newTab];

            const forms = form
                ? [form]
                : key === "all"
                    ? user.formaccess ?? []
                    : formOption?.[key]
                        ? Object.keys(formOption[key])
                        : [];

            const FormDeps: Record<string, string[]> = {};
            forms.forEach(f => {
                const deps = dep
                    ? [dep]
                    : key === "all"
                        ? user.Dep ?? []
                        : formOption?.[key]?.[f] || [];
                FormDeps[f] = deps;
            });

            const res = await fetch("/api/D-approve", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    offset: newOffset,
                    limit,
                    search: query,
                    statusType: newTab,
                    formaccess: forms,
                    FormDep: FormDeps,
                    startDate: start || null,
                    endDate: end || null,
                }),
                credentials: "include",
            });

            if (res.ok) {
                const data = await res.json();
                setApproveData({
                    totalAll: data.totalAll ?? 0,
                    totals: data.totals ?? {},
                    data: data.data ?? [],
                });
                setOffset(newOffset);
                refreshAmount();
            }
        } catch (err) {
            console.error(err);
            setApproveData({ totalAll: 0, totals: {}, data: [] });
        } finally {
            setLoading(false);
        }
    };


    // ✅ ถ้าอยาก refresh หลัง mount หรือหลัง approve/reject
    // DApproveTable.tsx
    const refreshAmount = async () => {
        try {
            // console.log("🟢 refreshAmount called with:");
            // console.log("formaccess:", formaccess);
            // console.log("FormDep:", FormDep); // ต้องเป็น object { form: [dep] }

            const payload = {
                formaccess,
                FormDep: tabFormMap,   // ✅ ต้องส่งเป็น FormDep
            };

            console.log('payload', payload)

            const res = await fetch("/api/update-status", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                const statusData = await res.json(); // ✅ TabFormAmount
                const AmountData: AmountData = {
                    CheckNull: statusData.check?.CheckNull || 0,
                    ApproveNull: statusData.approve?.ApproveNull || 0,
                    somethingNull: statusData.all?.somethingNull || 0,
                };
                setDataAmount(AmountData);
            }
        } catch (err) {
            console.error(err);
        }
    };



    const openPDF = (id: string | number, source: string, Dep: string) => {
        setPdfUrl(`/api/generate-filled-pdf?id=${id}&table=${source}`);
        setShowPDF(true);
        setSelectID(id);
        setSelectTable(source);
        setselectDep(Dep);
    };


    const handleApproval = async (id: string | number, source: string, status: "check" | "approve" | "reject", card: "Supervisor" | "Manager") => {
        try {
            const res = await fetch("/api/save-status-report", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    id: id,
                    source: source,
                    status: status,
                    fullname: user.fullName,
                    card: card,
                }),
            });
            if (!res.ok) throw new Error("บันทึกข้อมูลล้มเหลว");

            alert(`บันทึกข้อมูลสำเร็จ (${source}: ${status})`);
        } catch (err: any) {
            alert(err.message);
        }
        setShowSupervisorPopup(false);
        setShowManagerPopup(false);
        setShowPDF(false);
        setSelectID('');
        setSelectTable('');
        //search
        setSearch('');
        setOffset(0);
        setselectDep('');
        setSelectedForm(""); // รีเซ็ต selected form ทุกครั้งที่เปลี่ยน tab
        setStartDate('');
        setEndDate('');
        refreshAmount();
        setSelected([]);
        fetchData(offset, search, tab);
    };

    const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        fetchData(0, search, tab);
    };

    const [tabKeyMap] = useState<Record<Tab, string>>({
        Check_TAB: `check`,
        Approve_TAB: `approve`,
        All_TAB: `all`,
    });

    // ใช้ handleTabChange แค่เรียก fetchData ตาม tab ใหม่
    const handleTabChange = (newTab: Tab) => {
        setTab(newTab);

        // อัปเดต formOptions ตาม tab
        const key = tabKeyMap[newTab] as keyof FormOption; // tabKeyMap = { Check_TAB: "check", Approve_TAB: "approve", All_TAB: "all" }
        if (key === 'all') {
            setFormOptions(user.formaccess ?? []);
            setDepOptions(user.Dep ?? []);
        }
        else {
            setFormOptions(formOption?.[key] ? Object.keys(formOption[key]) : []);
            // อัปเดต depOptions ให้รวมทุก dep ของ tab ใหม่
            setDepOptions(formOption?.[key] ? Array.from(new Set(Object.values(formOption[key]).flat())) : []);
        }



        // รีเซ็ต state
        setSelectedForm("");
        setSelectedDep("");
        setSearch("");
        setStartDate("");
        setEndDate("");
        setSelectID('');
        setSelectTable('');
        setOffset(0);
        setSelected([]);

        // fetchData โดยใช้ค่า default แทน state
        fetchData(
            0,                     // offset
            "",                    // search
            newTab,                // tab
            "",                     // selectedForm
            "",                     // selectedDep
            "",                     // startDate
            ""                      // endDate
        );
    };



    const [tabLabels] = useState<Record<Tab, string>>({
        Check_TAB: `เอกสารรอตรวจสอบ`,
        Approve_TAB: `เอกสารรออนุมัติ`,
        All_TAB: `เอกสารทั้งหมด`,
    });


    const canGoNext = offset + limit < approveData.totalAll;
    const canGoPrev = offset > 0;

    return (
        <div className="flex flex-1 flex-col min-h-full w-full bg-white shadow-lg p-6 overflow-auto">
            <div className="relative">
                <div className="absolute top-4 right-2 text-sm text-gray-500">
                    <img src="/images/LOGO2.png" alt="Logo" className="w-auto h-20 mb-1 mx-auto" />
                </div>
            </div>

            <h2 className="flex justify-center items-center text-6xl font-light mb-5 text-blue-900 mt-4 font-kanit ">
                ระบบอนุมัติอิเล็กทรอนิกส์
            </h2>

            {/* Tabs */}
            <div className="flex mb-5 border-b border-blue-900 text-blue-900 ">
                {(Object.keys(tabLabels) as Tab[]).map((t) => (
                    <button
                        key={t}
                        onClick={() => handleTabChange(t)}
                        className={`relative flex items-center px-5 py-2 font-medium transition-colors duration-200
        ${user.permissions?.includes(t) ? "" : "hidden"}
        ${tab === t
                                ? "border-blue-600 bg-blue-900 text-white rounded-t-2xl"
                                : "bg-blue-100 rounded-t-2xl border-blue-900 border-t-1 border-r-1 border-l-1"
                            }
      `}
                    >
                        {tabLabels[t]}

                        {t === "Check_TAB" && dataAmount.CheckNull > 0 && (
                            <div className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-yellow-500 text-xs font-bold text-white shadow-md">
                                {dataAmount.CheckNull}
                            </div>
                        )}
                        {t === "Approve_TAB" && dataAmount.ApproveNull > 0 && (
                            <div className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-yellow-500 text-xs font-bold text-white shadow-md">
                                {dataAmount.ApproveNull}
                            </div>
                        )}
                        {t === "All_TAB" && dataAmount.somethingNull > 0 && (
                            <div className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-yellow-500 text-xs font-bold text-white shadow-md">
                                {dataAmount.somethingNull}
                            </div>
                        )}
                    </button>
                ))}
            </div>


            <div
                className={user.permissions?.includes(tab) ? "" : "hidden"}
            >
                {/* Search & Filters */}
                <div className="flex flex-row justify-evenly items-center mb-4 mt-2 flex-wrap gap-3 ">
                    <form onSubmit={handleSearch} className="flex items-center justify-center gap-2 text-black w-fit bg-white px-4 py-2 rounded-2xl border flex-wrap">

                        {/* Search Input */}
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="ค้นหาชื่อเอกสาร..."
                            className="border border-gray-300 rounded-md px-4 py-2 flex-1 focus:outline-none focus:ring-2 focus:ring-blue-400 placeholder-gray-400 text-black"
                        />

                        {/* Form Select */}
                        <select
                            value={selectedForm}
                            onChange={(e) => { setSelectedForm(e.target.value); setSelectedDep(""); }}
                            className="border border-gray-300 rounded-md px-3 py-2"
                        >
                            <option value="">หมายเลขเอกสาร</option>
                            {formOptions.map((f) => <option key={f} value={f}>{f}</option>)}
                        </select>

                        {/* Department Select */}
                        <select
                            value={selectedDep}
                            onChange={(e) => setSelectedDep(e.target.value)}
                            className="border border-gray-300 rounded-md px-3 py-2"
                            disabled={!selectedForm}
                        >
                            <option value="">แผนก</option>
                            {depOptions.map((d) => <option key={d} value={d}>{d}</option>)}
                        </select>

                        <span className="mx-1">วันที่</span>
                        {/* Date Range */}
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="border border-gray-300 rounded-md px-3 py-2"
                        />
                        <span className="mx-1">ถึง</span>
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="border border-gray-300 rounded-md px-3 py-2"
                        />

                        {/* Submit */}
                        <button
                            type="submit"
                            className="bg-blue-500 text-white px-5 py-2 rounded-md hover:bg-blue-600 transition-colors"
                        >
                            ค้นหา
                        </button>
                    </form>
                </div>

                {/* <div className="flex gap-2 overflow-y-auto py-2 justify-end pe-4 s w-full s">
                        {Object.entries(approveDฟata.totals).map(([source, count]) => (
                            <divs
                                key={source}
                                className="flex flex-row items-center justify-between min-w-[90px] px-3 py-2 border rounded-lg bg-white shadow-sm hover:shadow-md transition-shadow"
                            >
                                <span className="text-gray-500 text-xs font-semibold uppercase tracking-wide">{source}</span>
                                <span className="text-blue-600 font-bold text-sm ml-2">{count}</span>
                            </div>
                        ))}
                    </div> */}


                <div className="p-2 flex gap-2 flex-wrap">
                    {canApproveSupervisor && tab === "Check_TAB" && (
                        <>
                            <button
                                onClick={() => handleGroupApprove("check", "Supervisor")}
                                className="px-3 py-1 rounded text-white bg-green-500 hover:bg-green-600 transition-colors"
                            >

                                Check Supervisor ({selected.length})
                            </button>
                            <button
                                onClick={() => handleGroupApprove("reject", "Supervisor")}
                                className="px-3 py-1 rounded text-white bg-red-500 hover:bg-red-600 transition-colors"
                            >
                                Reject Supervisor ({selected.length})
                            </button>
                        </>
                    )}

                    {canApproveManager && tab === "Approve_TAB" && (
                        <>
                            <button
                                onClick={() => handleGroupApprove("approve", "Manager")}
                                className="px-3 py-1 rounded text-white bg-green-500 hover:bg-green-600 transition-colors"
                            >
                                Approve Manager ({selected.length})
                            </button>
                            <button
                                onClick={() => handleGroupApprove("reject", "Manager")}
                                className="px-3 py-1 rounded text-white bg-red-500 hover:bg-red-600 transition-colors"
                            >
                                Reject Manager ({selected.length})
                            </button>
                        </>
                    )}
                </div>

                {/* Table */}
                <div className="custom-scrollbar rounded-lg shadow-sm border border-gray-200 overflow-y-auto h-[64vh] overflow-hidden bg-white">
                    <table className="min-w-full table-fixed bg-white text-black">
                        <thead className="bg-blue-100 sticky top-0 z-10">
                            <tr>
                                {(tab === "Check_TAB" || tab === "Approve_TAB") && (
                                    <th className="px-2 py-2 text-center w-[5%]">
                                        <input
                                            type="checkbox"
                                            onChange={toggleSelectAll}
                                            checked={selected.length > 0 && approveData.data.every((doc) =>
                                                selected.some((s) => s.id === doc.id && s.source === doc.source)
                                            )}
                                        />
                                    </th>
                                )}
                                <th className="px-4 py-2 text-left w-[5%]">No</th>
                                <th className="px-4 py-2 text-left w-[25%]">ชื่อเอกสาร</th>
                                <th className="px-4 py-2 text-left w-[15%]">หมายเลขเอกสาร</th>
                                <th className="px-4 py-2 text-left w-[15%]">แผนก</th>
                                <th className="px-4 py-2 text-left w-[15%]">วันที่ร้องขอ</th>
                                <th className="px-4 py-2 text-left w-[15%]">ชื่อผู้ยื่นขอ</th>
                                {tab === "Approve_TAB" && <th className="px-4 py-2 text-center w-[15%]">วันที่เช็ค</th>}
                                {tab === "All_TAB" && <th className="px-4 py-2 text-center w-[15%]">วันที่อนุมัติ</th>}

                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={8} className="text-center py-6">Loading...</td>
                                </tr>
                            ) : approveData.data.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="text-center py-6">No data found</td>
                                </tr>
                            ) : (
                                approveData.data.map((doc, index) => (
                                    <tr
                                        onClick={() => openPDF(doc.id, doc.source, doc.Dep)}
                                        key={`${doc.source}_${doc.id}_${index}`}
                                        className={`transition-all duration-300 ease-in-out hover:shadow-lg hover:-translate-y-1 hover:bg-amber-100
                ${selected.some((s) => s.id === doc.id && s.source === doc.source) ? "bg-amber-200/50" : ""}
              `}
                                    >
                                        {(tab === "Check_TAB" || tab === "Approve_TAB") && (
                                            <td
                                                onClick={(e) => e.stopPropagation()} // กันไม่ให้ trigger row onClick
                                                className="px-2 py-2 text-center border-t border-gray-200">
                                                <input
                                                    type="checkbox"
                                                    checked={selected.some(s => s.id === doc.id && s.source === doc.source && s.Dep === doc.Dep)}
                                                    onChange={(e) => {
                                                        if (e.target.checked) {
                                                            setSelected((prev) => [...prev, { id: doc.id, source: doc.source, Dep: doc.Dep }]);
                                                        } else {
                                                            setSelected((prev) =>
                                                                prev.filter((s) => !(s.id === doc.id && s.source === doc.source && s.Dep === doc.Dep))
                                                            );
                                                        }
                                                    }}
                                                />
                                            </td>
                                        )}
                                        <td className="px-4 py-2 ps-5 text-left border-t border-gray-200 ">{offset + 1 + index}</td>
                                        <td className="px-4 py-2 text-left border-t border-gray-200 ">{doc.FormThai}</td>
                                        <td className="px-4 py-2 text-left border-t border-gray-200 ">{doc.source}</td>
                                        <td className="px-4 py-2 text-left border-t border-gray-200 ">{doc.Dep}</td>
                                        <td className="px-4 py-2 text-left border-t border-gray-200 ">{doc.DateRequest ? new Date(doc.DateRequest).toLocaleDateString() : "-"}</td>
                                        <td className="px-4 py-2 text-left border-t border-gray-200 ">{doc.NameRequest}</td>
                                        {tab === "Approve_TAB" && <td className="px-4 py-2 text-left border-t border-gray-200 w-[15%]">{doc.DateCheck ? new Date(doc.DateCheck).toLocaleDateString() : "-"}</td>}
                                        {tab === "All_TAB" && <td className="px-4 py-2 text-center border-t border-gray-200 w-[15%]">{doc.DateApprove ? new Date(doc.DateApprove).toLocaleDateString() : "-"}</td>}
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>


                {/* Pagination */}
                <div className="mt-5 flex justify-between items-center">
                    <button
                        onClick={() => fetchData(Math.max(offset - limit, 0), search, tab)}
                        disabled={!canGoPrev || loading}
                        className={`px-4 py-2 rounded-md ${offset === 0 || loading ? "bg-gray-200 text-gray-400 cursor-not-allowed" : "bg-blue-500 text-white hover:bg-blue-600 transition-colors"}`}
                    >
                        Previous
                    </button>
                    <button
                        onClick={() => fetchData(offset + limit, search, tab)}
                        disabled={!canGoNext || loading}
                        className={`px-4 py-2 rounded-md ${offset + limit >= approveData.totalAll || loading ? "bg-gray-200 text-gray-400 cursor-not-allowed" : "bg-blue-500 text-white hover:bg-blue-600 transition-colors"}`}
                    >
                        Next
                    </button>
                </div>

                {
                    showPDF && (
                        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-50 p-4">
                            <div className="relative w-full max-w-[95vw] h-[95vh] bg-white rounded-xl shadow-lg flex flex-col">
                                <div className="absolute right-0 p-4 ">
                                    {/* <h2 className="text-lg font-semibold text-gray-800">PDF Viewer</h2> */}
                                    <button
                                        className="text-white bg-red-600 hover:bg-red-700 rounded-full w-10 h-10 flex items-center justify-center text-2xl"
                                        onClick={() => setShowPDF(false)}
                                    >
                                        ✕
                                    </button>
                                </div>

                                <iframe src={pdfUrl} className="w-full h-full border-none flex-1 " title="PDF Viewer" />

                                <div className="absolute bottom-4 right-4 flex gap-4">
                                    {user?.permissions?.includes(`Check_${selectTable}_${selectDep}`) && (tab === "Check_TAB") && (
                                        <button
                                            className="px-5 py-2 bg-blue-600 text-white rounded-lg"
                                            onClick={() => setShowSupervisorPopup(true)}
                                        >
                                            สำหรับหัวหน้างาน
                                        </button>
                                    )}
                                    {/* permission ต้อง = (`Approve_${selectTable}_${selectDep}`) เช่น Approve_FM_IT_03_IT*/}
                                    {user?.permissions?.includes(`Approve_${selectTable}_${selectDep}`) && (tab === "Approve_TAB") && (
                                        <button
                                            className="px-5 py-2 bg-green-600 text-white rounded-lg"
                                            onClick={() => setShowManagerPopup(true)}
                                        >
                                            สำหรับผู้จัดการ
                                        </button>
                                    )}
                                </div>

                                {showSupervisorPopup && (
                                    <SupervisorPopup
                                        onClose={() => {
                                            setShowSupervisorPopup(false);
                                            setSelectID('');
                                            setSelectTable('');
                                            setselectDep('');
                                        }}
                                        onApprove={() => handleApproval(selectID, selectTable, "check", "Supervisor")}
                                        onReject={() => handleApproval(selectID, selectTable, "reject", "Supervisor")}
                                    />
                                )}

                                {showManagerPopup && (
                                    <Manager
                                        onClose={() => {
                                            setShowManagerPopup(false);
                                            setSelectID('');
                                            setSelectTable('');
                                            setselectDep('');
                                        }}
                                        onApprove={() => handleApproval(selectID, selectTable, "approve", "Manager")}
                                        onReject={() => handleApproval(selectID, selectTable, "reject", "Manager")}
                                    />
                                )}
                            </div>
                        </div>
                    )
                }
            </div>

        </div >
    );
}
