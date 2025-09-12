import { NextRequest, NextResponse } from "next/server";
import { GetupdateStatus, TabFormDep } from "@/lib/modules/GetupdateStatus";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const formaccess: string[] = body.formaccess || [];

    // สร้าง object ป้องกัน undefined ทุก tab
    const tabFormMap: TabFormDep = {
      check: {},
      approve: {},
      all: {},
    };

    // body.FormDep ต้องส่งเป็น object { check: {form: deps}, approve: {}, all: {} }
    if (body.FormDep) {
      tabFormMap.check = body.FormDep.check || {};
      tabFormMap.approve = body.FormDep.approve || {};
      tabFormMap.all = body.FormDep.all || {};
    }

    // ใส่ formaccess ถ้าไม่มี dep ให้ว่าง
    for (const tab of ["check", "approve", "all"] as const) {
      const forms = tabFormMap[tab];
      formaccess.forEach(f => {
        if (!forms[f]) forms[f] = [];
      });
    }

    const data = await GetupdateStatus(tabFormMap);

    return NextResponse.json(data);
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: err.message || "Something went wrong" }, { status: 500 });
  }
}
