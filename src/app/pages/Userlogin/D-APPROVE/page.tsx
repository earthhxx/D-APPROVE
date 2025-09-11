// src/app/pages/Userlogin/D-APPROVE/page.tsx
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import DApproveTable from "./components/D_approvetable";
import type { UserPayload } from "@/app/types/types";
import { getDApproveData } from "@/lib/modules/DApproveModule";
import { GetupdateStatus } from "@/lib/modules/GetupdateStatus";

type Tab = "Check_TAB" | "Approve_TAB" | "All_TAB";

// map form → dep
interface FormDepMap {
  [form: string]: string[];
}

interface Option {
  check: FormDepMap;
  approve: FormDepMap;
  all: FormDepMap;
}

export default async function UserLoginPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;

  let user: UserPayload | null = null;
  if (token) {
    try {
      const decoded = jwt.decode(token);
      if (typeof decoded === "object" && decoded !== null) {
        user = decoded as UserPayload;
      }
    } catch { }
  }

  if (!user || !user.permissions?.includes("D_Approve")) {
    return <div>Access Denied</div>;
  }

  const availableTabs = (["Check_TAB", "Approve_TAB", "All_TAB"] as Tab[]).filter(
    (t) => user!.permissions?.includes(t)
  );

  // 🆕 เก็บ mapping form → department
  const formOption: Option = { check: {}, approve: {}, all: {} };

  if (user.permissions) {
    if (user.permissions.includes("Check_TAB")) {
      user.permissions
        .filter((p) => p.startsWith("Check_F"))
        .forEach((p) => {
          const parts = p.split("_");
          const form = parts.slice(1, -1).join("_"); // FM_IT_03
          const dep = parts[parts.length - 1]; // IT, QA

          if (!formOption.check[form]) formOption.check[form] = [];
          formOption.check[form].push(dep);
        });
      // unique dep
      for (const f in formOption.check) {
        formOption.check[f] = Array.from(new Set(formOption.check[f]));
      }
    }

    if (user.permissions.includes("Approve_TAB")) {
      user.permissions
        .filter((p) => p.startsWith("Approve_F"))
        .forEach((p) => {
          const parts = p.split("_");
          const form = parts.slice(1, -1).join("_");
          const dep = parts[parts.length - 1];

          if (!formOption.approve[form]) formOption.approve[form] = [];
          formOption.approve[form].push(dep);
        });
      for (const f in formOption.approve) {
        formOption.approve[f] = Array.from(new Set(formOption.approve[f]));
      }
    }

    if (user.permissions.includes("All_TAB")) {
      user.formaccess?.forEach((f) => {
        user.Dep?.forEach((d) => {
          if (!formOption.all[f]) formOption.all[f] = [];
          formOption.all[f].push(d);
        });
      });
      for (const f in formOption.all) {
        formOption.all[f] = Array.from(new Set(formOption.all[f]));
      }

      // user.permissions
      //   .filter((p) => p.startsWith("Check_F") || p.startsWith("Approve_F"))
      //   .forEach((p) => {
      //     const parts = p.split("_");
      //     const form = parts.slice(1, -1).join("_");
      //     const dep = parts[parts.length - 1];

      //     if (!formOption.all[form]) formOption.all[form] = [];
      //     formOption.all[form].push(dep);
      //   });
      // for (const f in formOption.all) {
      //   formOption.all[f] = Array.from(new Set(formOption.all[f]));
      // }
    }
  }

  // console.log("Form Options:", formOption);

  // console.log("Form Options:", formOption);
  // Mapping tab → key ของ formOption/DepOption
  const tabKeyMap: Record<Tab, keyof Option> = {
    Check_TAB: "check",
    Approve_TAB: "approve",
    All_TAB: "all",
  };

  // ได้ key แบบ dynamic
  const key = tabKeyMap[availableTabs[0]];

  // initial data
  const initialData = await getDApproveData({
    offset: 0,
    limit: 13,
    search: "",
    statusType: availableTabs[0],
    formaccess: user.formaccess || [],
    FormDep: formOption[key] || {},
  });



  const formaccess = Object.keys(formOption[key]); // ทั้งหมด
  const FormDep: Record<string, string[]> = {};//create empty object
  //loop push dep to FormDep
  availableTabs.forEach(tab => {
    //key ของ formOption
    const key = tabKeyMap[tab];
    //loop formOption[key] เพื่อเอา dep ไปใส่ใน FormDep, key = available tab จะได้ 
    Object.keys(formOption[key]).forEach(f => {
      //check ถ้าไม่มี key นี้ใน FormDep ให้สร้าง array เปล่า
      if (!FormDep[f]) FormDep[f] = [];
      FormDep[f] = Array.from(new Set([...FormDep[f], ...formOption[key][f]]));
    });
  });
  // console.log("FormDep", FormDep);
  const data = await GetupdateStatus(formaccess, FormDep);

  return (
    <DApproveTable
      initialData={initialData}
      user={user}
      AmountData={data}
      formOption={formOption}
      formkey={key}
      formaccess={formaccess}
      FormDep={FormDep}
    />
  );
}
