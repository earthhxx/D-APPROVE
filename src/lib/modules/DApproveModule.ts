import sql from "mssql";
import { getDashboardConnection } from "@/lib/db";

export interface ApproveQuery {
  offset?: number;
  limit?: number;
  search?: string;
  statusType?: string;
  formaccess: string[];
  FormDep: Record<string, string[]>; // key = form, value = dep list
  startDate?: string | null;
  endDate?: string | null;
}

export interface ApproveData {
  totalAll: number;
  totals: Record<string, number>;
  data: any[];
  offset: number;
  limit: number;
}

export async function getDApproveData({
  offset = 0,
  limit = 0,
  search = "",
  statusType = "",
  formaccess = [],
  FormDep = { "": [] },
  startDate = null,
  endDate = null,
}: ApproveQuery): Promise<ApproveData> {
  const pool = await getDashboardConnection();

  console.log("api in", offset, limit, search, statusType, formaccess, FormDep);

  const validTabs = ["Check_TAB", "Approve_TAB", "All_TAB"];
  if (!validTabs.includes(statusType)) {
    console.log("Invalid statusType:", statusType);
    return { totalAll: 0, totals: {}, data: [], offset, limit };
  }

  // 1. ดึง mapping table สำหรับ formaccess
  const tablesResult = await pool.request().query(`
    SELECT table_name, db_table_name
    FROM D_Approve
    WHERE table_name IN (${formaccess.map(t => `'${t}'`).join(",") || "''"})
  `);

  const tableMap: Record<string, string> = {};
  tablesResult.recordset.forEach(row => (tableMap[row.table_name] = row.db_table_name));

  // 2. สร้าง queries โดยใช้ทั้ง formaccess + FormDep
  const queries = formaccess
    .filter(t => tableMap[t])
    .map(t => {
      // clean table name ลบ [] ครอบ หรือ escape ให้ SQL Server ถูกต้อง
      const tableName = tableMap[t].replace(/\[|\]/g, "");

      // ถ้ามี FormDep[t] ใช้ depList นั้น
      const depList = FormDep[t]?.length
        ? FormDep[t].map(d => `'${d}'`).join(",")
        : "''";

      let whereClause = `FormThai LIKE @search`;

      // Status filter
      if (statusType === "Check_TAB")
        whereClause += ` AND StatusCheck IS NULL`;
      else if (statusType === "Approve_TAB")
        whereClause += ` AND StatusCheck IS NOT NULL AND StatusCheck != N'ไม่อนุมัติ' AND StatusApprove IS NULL`;
      else if (statusType === "All_TAB")
        whereClause += ` AND StatusApprove IS NOT NULL AND StatusApprove != N'ไม่อนุมัติ'`;

      // Date filters
      if (statusType === "Check_TAB") {
        if (startDate && endDate) whereClause += ` AND DateRequest BETWEEN @startDate AND @endDate`;
        else if (startDate) whereClause += ` AND DateRequest >= @startDate`;
        else if (endDate) whereClause += ` AND DateRequest <= @endDate`;
      } else if (statusType === "Approve_TAB") {
        if (startDate && endDate) whereClause += ` AND DateCheck BETWEEN @startDate AND @endDate`;
        else if (startDate) whereClause += ` AND DateCheck >= @startDate`;
        else if (endDate) whereClause += ` AND DateCheck <= @endDate`;
      } else if (statusType === "All_TAB") {
        if (startDate && endDate) whereClause += ` AND DateApprove BETWEEN @startDate AND @endDate`;
        else if (startDate) whereClause += ` AND DateApprove >= @startDate`;
        else if (endDate) whereClause += ` AND DateApprove <= @endDate`;
      }

      return `
        SELECT id, FormID, FormThai, Dep, [Date] AS date,
               DateRequest, StatusCheck, StatusApprove,
               DateApprove, DateCheck, '${t}' AS source
        FROM ${tableName} 
        WHERE Dep IN (${depList}) AND ${whereClause}
      `;
    });

  if (!queries.length) {
    return { totalAll: 0, totals: {}, data: [], offset, limit };
  }

  // 3. กำหนด Orderby ตาม statusType
  let Orderby = "date DESC";
  if (statusType === "Check_TAB") Orderby = "DateRequest ASC, date DESC";
  else if (statusType === "Approve_TAB") Orderby = "DateCheck DESC, date DESC";
  else if (statusType === "All_TAB") Orderby = "DateApprove ASC, date DESC";

  // 4. สร้าง finalQuery
  let finalQuery = `
    SELECT *, COUNT(*) OVER() AS totalCount
    FROM (
      ${queries.join(" UNION ALL ")}
    ) AS unioned
    ORDER BY ${Orderby}
  `;

  if (limit > 0) {
    finalQuery += ` OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY`;
  }

  const request = pool
    .request()
    .input("search", sql.NVarChar, `%${search}%`)
    .input("offset", sql.Int, offset)
    .input("limit", sql.Int, limit);

  if (startDate) request.input("startDate", sql.Date, startDate);
  if (endDate) request.input("endDate", sql.Date, endDate);

  const dataResult = await request.query(finalQuery);

  const data = dataResult.recordset;
  const totalAll = data.length > 0 ? Number(data[0].totalCount) : 0;

  const totals: Record<string, number> = {};
  data.forEach(d => {
    totals[d.source] = (totals[d.source] || 0) + 1;
  });
  data.forEach(d => delete d.totalCount);

  return { totalAll, totals, data, offset, limit };
}
