import { getDashboardConnection } from "@/lib/db";

export interface AmountData {
  ApproveNull?: number;
  CheckNull?: number;
  somethingNull?: number;
}

// mapping tab -> form -> dep[]
export interface TabFormDep {
  check: Record<string, string[]>;
  approve: Record<string, string[]>;
  all: Record<string, string[]>;
}

// คืนค่าแบบรวมยอดตามที่คุณต้องการ
export async function GetupdateStatus(tabFormMap: TabFormDep): Promise<{
  check: AmountData;
  approve: AmountData;
  all: AmountData;
}> {
  const pool = await getDashboardConnection();

  const tableResult = await pool.request().query(`
    SELECT table_name, db_table_name
    FROM D_Approve
  `);

  const tableMap: Record<string, string> = {};
  tableResult.recordset.forEach(row => {
    tableMap[row.table_name] = row.db_table_name;
  });

  const result: {
    check: AmountData;
    approve: AmountData;
    all: AmountData;
  } = {
    check: { CheckNull: 0 },
    approve: { ApproveNull: 0 },
    all: { somethingNull: 0 },
  };

  for (const tab of ["check", "approve", "all"] as const) {
    const forms = tabFormMap[tab] || {};
    let temp: AmountData = {};

    for (const form of Object.keys(forms)) {
      const tableName = tableMap[form];
      if (!tableName) continue;

      const deps = forms[form];
      const depList = deps.length ? deps.map(d => `'${d}'`).join(",") : "''";

      const query = `
        SELECT
          COUNT(CASE WHEN StatusCheck IS NOT NULL AND StatusCheck != N'ไม่อนุมัติ' AND StatusApprove IS NULL THEN 1 END) AS ApproveNull,
          COUNT(CASE WHEN StatusCheck IS NULL THEN 1 END) AS CheckNull,
          COUNT(CASE WHEN StatusCheck IS NOT NULL AND StatusCheck != N'ไม่อนุมัติ' AND StatusApprove IS NULL THEN 1 END)
          + COUNT(CASE WHEN StatusCheck IS NULL THEN 1 END) AS somethingNull
        FROM ${tableName}
        WHERE Dep IN (${depList})
      `;

      const data = await pool.request().query(query);
      const row = data.recordset[0];

      // รวมตาม tab ที่ต้องการ
      if (tab === "check") temp.CheckNull = (temp.CheckNull || 0) + Number(row.CheckNull || 0);
      if (tab === "approve") temp.ApproveNull = (temp.ApproveNull || 0) + Number(row.ApproveNull || 0);
      if (tab === "all") temp.somethingNull = (temp.somethingNull || 0) + Number(row.somethingNull || 0);
    }

    // ถ้า temp ไม่มีค่า ให้ตั้งเป็น 0
    if (tab === "check") result.check.CheckNull = temp.CheckNull || 0;
    if (tab === "approve") result.approve.ApproveNull = temp.ApproveNull || 0;
    if (tab === "all") result.all.somethingNull = temp.somethingNull || 0;
  }

  return result;
}
