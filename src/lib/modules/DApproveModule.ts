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
  totals: Record<string, number>; // เพิ่มตรงนี้
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
  // console.log("startDate", startDate, endDate);
  console.log("api in", offset, limit, search, statusType, formaccess, FormDep);
  // ดึง mapping ของ table
  const tablesResult = await pool.request().query(`
    SELECT table_name, db_table_name
    FROM D_Approve
    WHERE table_name IN (${formaccess.map(t => `'${t}'`).join(",") || "''"})
  `);

  const tableMap: Record<string, string> = {};
  tablesResult.recordset.forEach(row => (tableMap[row.table_name] = row.db_table_name));

  // console.log("Table Map:", tableMap); // ✅ log table mapping

  const validTabs = ["Check_TAB", "Approve_TAB", "All_TAB"];
  if (!validTabs.includes(statusType)) {
    console.log("Invalid statusType:", statusType); // ✅ log statusType ไม่ถูกต้อง
    return { totalAll: 0, totals: {}, data: [], offset, limit };
  }
  // console.log(statusType)
console.log('form',formaccess)

  const queries = formaccess
    .filter(t => tableMap[t])
    .map(t => {
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


      // DateRequest filter
      if (startDate && endDate && statusType === "Check_TAB") {
        whereClause += ` AND DateRequest BETWEEN @startDate AND @endDate`;
      } else if (startDate && statusType === "Check_TAB") {
        whereClause += ` AND DateRequest >= @startDate`;
      } else if (endDate && statusType === "Check_TAB") {
        whereClause += ` AND DateRequest <= @endDate`;
      }

      // DateCheck filter
      if (startDate && endDate && statusType === "Approve_TAB") {
        whereClause += ` AND DateCheck BETWEEN @startDate AND @endDate`;
      } else if (startDate && statusType === "Approve_TAB") {
        whereClause += ` AND DateCheck >= @startDate`;
      } else if (endDate && statusType === "Approve_TAB") {
        whereClause += ` AND DateCheck <= @endDate`;
      }

      // DateApprove filter
      if (startDate && endDate && statusType === "All_TAB") {
        whereClause += ` AND DateApprove BETWEEN @startDate AND @endDate`;
      } else if (startDate && statusType === "All_TAB") {
        whereClause += ` AND DateApprove >= @startDate`;
      } else if (endDate && statusType === "All_TAB") {
        whereClause += ` AND DateApprove <= @endDate`;
      }

      return `
      SELECT id, FormID, FormThai, Dep, [Date] AS date,
             NameRequest,
             DateRequest, StatusCheck, StatusApprove,
             DateApprove, DateCheck, '${t}' AS source
      FROM ${tableMap[t]}
      WHERE Dep IN (${depList}) AND ${whereClause}
    `;
    });
  // log("Generated Queries:", queries); // ✅ log generated queries

  let Orderby = "date DESC"; // ค่าเริ่มต้น
  if (statusType === "Check_TAB") Orderby = "DateRequest DESC, date DESC";
  else if (statusType === "Approve_TAB") Orderby = "DateCheck DESC, date DESC";
  else if (statusType === "All_TAB") Orderby = "DateApprove DESC, date DESC";

  const finalQuery = `
                    SELECT *, COUNT(*) OVER() AS totalCount
                    FROM (
                      ${queries.join(" UNION ALL ")}
                    ) AS unioned
                    ORDER BY ${Orderby}
                    OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY
                  `;
  // console.log("Final Query:", finalQuery); // ✅ log final query

  const request = pool
    .request()
    .input("search", sql.NVarChar, `%${search}%`)
    .input("offset", sql.Int, offset)
    .input("limit", sql.Int, limit);

  if (startDate) request.input("startDate", sql.Date, startDate);
  if (endDate) request.input("endDate", sql.Date, endDate);

  const dataResult = await request.query(finalQuery);


  // console.log("Data Result:", dataResult.recordset); // ✅ log raw data result

  const data = dataResult.recordset;

  const totalAll = data.length > 0 ? Number(data[0].totalCount) : 0;

  const totals: Record<string, number> = {};
  data.forEach(d => {
    totals[d.source] = (totals[d.source] || 0) + 1;
  });

  data.forEach(d => delete d.totalCount);

  // console.log("Totals per table:", totals); // ✅ log totals per table
  // console.log("Total All:", totalAll); // ✅ log totalAll

  return { totalAll, totals, data, offset, limit };
}
