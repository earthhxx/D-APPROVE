// src/lib/modules/GetupdateStatus.ts
import { getDashboardConnection } from "@/lib/db";

export async function GetupdateStatus(
    formaccess: string[],
    FormDep: Record<string, string[]>
) {
    if (!formaccess || !FormDep || formaccess.length === 0) {
        throw new Error("missing parameter");
    }

    // console.log("🟢 GetupdateStatus called with:");
    // console.log("formaccess:", formaccess);
    // console.log("FormDep:", FormDep);

    const pool = await getDashboardConnection();

    const tablesResult = await pool.request().query(`
        SELECT table_name, db_table_name
        FROM D_Approve
        WHERE table_name IN (${formaccess.map(t => `'${t}'`).join(",")})
    `);

    const tableMap: Record<string, string> = {};
    tablesResult.recordset.forEach(row => {
        tableMap[row.table_name] = row.db_table_name;
    });

    // console.log("📋 TableMap:", tableMap);

    const queries = formaccess
        .filter(t => tableMap[t])
        .map(t => {
            const deps = FormDep[t]?.length ? FormDep[t] : [];
            const depList = deps.length ? deps.map(d => `'${d}'`).join(",") : "''";

            // console.log(`🔎 Building query for: ${t}`);
            // console.log(`   deps:`, deps);
            // console.log(`   depList:`, depList);

            return `
                SELECT 
                    COUNT(CASE WHEN StatusCheck IS NOT NULL AND StatusCheck != N'ไม่อนุมัติ' AND StatusApprove IS NULL THEN 1 END) AS ApproveNull,
                    COUNT(CASE WHEN StatusCheck IS NULL THEN 1 END) AS CheckNull,
                    COUNT(CASE WHEN StatusCheck IS NOT NULL AND StatusCheck != N'ไม่อนุมัติ' AND StatusApprove IS NULL THEN 1 END)
                    + COUNT(CASE WHEN StatusCheck IS NULL THEN 1 END) AS SomethingNull
                FROM ${tableMap[t]}
                WHERE Dep IN (${depList})
            `;
        });

    if (queries.length === 0) {
        throw new Error("No valid tables found");
    }

    // console.log("📝 Generated Queries:", queries);

    const finalQuery = `
        SELECT 
            SUM(ApproveNull) AS ApproveNull,
            SUM(CheckNull)   AS CheckNull,
            SUM(SomethingNull) AS SomethingNull
        FROM (
            ${queries.join(" UNION ALL ")}
        ) AS AllTables
    `;

    // console.log("🚀 Final Query:", finalQuery);

    const result = await pool.request().query(finalQuery);

    // console.log("✅ Result:", result.recordset[0]);

    return result.recordset[0];
}
