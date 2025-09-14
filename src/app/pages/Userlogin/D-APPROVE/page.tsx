import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import DApproveTable from "./components/D_approvetable";
import type { UserPayload } from "@/app/types/types";
import { getDApproveData } from "@/lib/modules/DApproveModule";
import { GetupdateStatus } from "@/lib/modules/GetupdateStatus";

const JWT_SECRET = process.env.JWT_SECRET!; // ต้องมีค่า

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

interface AmountData {
  ApproveNull: number;
  CheckNull: number;
  somethingNull: number;
}

export default async function UserLoginPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;

  let user: UserPayload | null = null;
  if (token) {
    try {
      const payload = jwt.verify(token, JWT_SECRET) as any;

      user = {
        userId: payload.userId,
        fullName: payload.fullName,
        roles: Array.isArray(payload.roles)
          ? payload.roles
          : typeof payload.roles === "string"
            ? payload.roles.split(",")
            : [],
        permissions: Array.isArray(payload.permissions)
          ? payload.permissions
          : typeof payload.permissions === "string"
            ? payload.permissions.split(",")
            : [],
        formaccess: Array.isArray(payload.formaccess)
          ? payload.formaccess
          : typeof payload.formaccess === "string"
            ? payload.formaccess.split(",")
            : [],
        Dep: Array.isArray(payload.Dep)
          ? payload.Dep
          : typeof payload.Dep === "string"
            ? payload.Dep.split(",")
            : [],
      };

    } catch (err) {
      console.error("JWT verification failed:", err);
      return <div>Access Denied</div>;
    }
  }


  if (!user || !user.permissions?.includes("D_Approve")) {
    return <div>Access Denied</div>;
  }

  const availableTabs = (["Check_TAB", "Approve_TAB", "All_TAB"] as Tab[]).filter(
    (t) => user!.permissions?.includes(t)
  );

  const formOption: Option = { check: {}, approve: {}, all: {} };

  // build formOption
  if (user.permissions) {
    if (user.permissions.includes("Check_TAB")) {
      user.permissions
        .filter((p) => p.startsWith("Check_F"))
        .forEach((p) => {
          const parts = p.split("_");
          const form = parts.slice(1, -1).join("_");
          const dep = parts[parts.length - 1];
          if (!formOption.check[form]) formOption.check[form] = [];
          formOption.check[form].push(dep);
        });
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
    }
  }

  const tabKeyMap: Record<Tab, keyof Option> = {
    Check_TAB: "check",
    Approve_TAB: "approve",
    All_TAB: "all",
  };

  const key = tabKeyMap[availableTabs[0]];

  const forms = key === "all"
    ? user.formaccess ?? []
    : formOption?.[key]
      ? Object.keys(formOption[key])
      : [];

  // console.log('form', forms)

  const initialData = await getDApproveData({
    offset: 0,
    limit: 13,
    search: "",
    statusType: availableTabs[0],
    formaccess: forms || [],
    FormDep: formOption[key] || {},
  });

  const tabFormMap = {
    check: formOption.check,
    approve: formOption.approve,
    all: formOption.all,
  };

  console.log(tabFormMap)

  // เรียกใช้งาน GetupdateStatus แล้วรวมผลเป็น object เดียว
  const statusData = await GetupdateStatus(tabFormMap);
  console.log('sta', statusData)
  const AmountData: AmountData = {
    CheckNull: statusData.check?.CheckNull || 0,
    ApproveNull: statusData.approve?.ApproveNull || 0,
    somethingNull: statusData.all?.somethingNull || 0,
  };

  return (
    <DApproveTable
      initialData={initialData}
      user={user}
      AmountData={AmountData} // ส่ง object เดียว
      formOption={formOption}
      formkey={key}
      formaccess={Object.keys(formOption[key])}
      tabFormMap={tabFormMap}
    />
  );
}
