import { PDFPage, PDFFont, rgb } from "pdf-lib";
import { PDFData } from "@/app/api/generate-filled-pdf/route";

// type สำหรับ field เดี่ยว
type FieldMapping = {
    x: number;
    y: number;
    size?: number;
    font: string;
    format?: string;
    source?: string;
};

// type สำหรับ table mapping (สามารถเก็บ field เดี่ยวหรือ array ของ field)
type TableFieldMap = Record<string, Record<string, FieldMapping | FieldMapping[]>>;


// ตัวอย่าง mapping ของแต่ละ table
const tableFieldMap: TableFieldMap = {
    FM_IT_03: {
        id: { x: 500, y: 682, size: 14, font: "thai" },
        // FormID: { x: 500, y: 750, size: 14, font: "thai" },
        Date: { x: 435, y: 665, size: 12, format: "date", font: "thai" },
        NameThi: { x: 220, y: 656, size: 10, font: "thai" },
        NameEn: { x: 220, y: 646, size: 10, font: "thai" },
        Dep: { x: 180, y: 635, size: 11, font: "thai" },
        DepM: { x: 350, y: 635, size: 11, font: "thai" },
        Email: { x: 95, y: 607, size: 14, font: "check" },
        Repair: { x: 163, y: 607, size: 14, font: "check" },
        AddEqui: { x: 207, y: 607, size: 14, font: "check" },
        AddProg: { x: 270, y: 607, size: 14, font: "check" },
        OtherIT: { x: 338, y: 607, size: 14, font: "check" },
        Other_Detail: { x: 400, y: 610, size: 14, font: "thai" },
        DetailName: { x: 105, y: 575, size: 12, font: "thai" },
        NameRequest: { x: 105, y: 430, size: 11, font: "thai" },
        // DateUser: { x: 150, y: 570, size: 14, format: "date", font: "thai" },
        // StatusCheck: { x: 150, y: 570, size: 14, font: "check" },
        NameCheck: { x: 265, y: 430, size: 11, font: "thai" },
        // DateCheck: { x: 150, y: 570, size: 14, format: "date", font: "thai" },
        // StatusApprove: { x: 150, y: 570, size: 14, font: "check" },
        NameApprove: { x: 420, y: 430, size: 11, font: "thai" },
        // DateAppove: { x: 150, y: 570, size: 14, font: "date", font: "thai" },

    },
    FM_GA_04: {
        id: { x: 653, y: 503, size: 15, font: "thai" },
        Date: { x: 570, y: 440, size: 15, format: "date", font: "thai" },
        TitleName: { x: 262, y: 420, size: 15, font: "thai" },
        TitleName1: { x: 282, y: 420, size: 15, font: "check" },
        TitleName2: { x: 302, y: 420, size: 15, font: "check" },
        Name: { x: 400, y: 412, size: 15, font: "thai" },
        Iduser: { x: 300, y: 390, size: 15, font: "thai" },
        Dep: { x: 500, y: 390, size: 11, font: "thai" },
        Date1: { x: 450, y: 370, size: 15, format: "date", font: "thai" },
        Starttime: { x: 220, y: 350, size: 15, format: "time", font: "thai" },
        EndTime: { x: 460, y: 350, size: 15, format: "time", font: "thai" },
        Back: { x: 233, y: 325, size: 15, font: "check" },
        NoBack: { x: 475, y: 325, size: 15, font: "check" },
        Detail: { x: 265, y: 298, size: 15, font: "thai" },
        NameRequest: { x: 350, y: 237, size: 15, font: "thai" },
        NameCheck: { x: 160, y: 190, size: 15, font: "thai" },
        DateCheck: { x: 190, y: 150, size: 15, format: "date", font: "thai" },

        NameApprove: { x: 350, y: 190, size: 15, font: "thai" },
        DateApprove: { x: 380, y: 150, size: 15, format: "date", font: "thai" },
        Date2: { x: 190, y: 150, size: 15, format: "date", font: "thai" },
        Date3: { x: 380, y: 150, size: 15, format: "date", font: "thai" },
    },
    FM_GA_03: {
        id: { x: 705, y: 523, size: 15, font: "thai" },
        Date: { x: 590, y: 460, size: 15, format: "date", font: "thai" },

        // Trital Name
        TitleName1: { x: 202, y: 446, size: 15, font: "check" },
        TitleName2: { x: 222, y: 446, size: 15, font: "check" },
        TitleName3: { x: 242, y: 446, size: 15, font: "check" },

        TitleName: { x: 320, y: 438, size: 15, font: "thai" },
        Iduser: { x: 220, y: 415, size: 15, font: "thai" },
        DepT: { x: 410, y: 415, size: 11, font: "thai" },
        Dep: { x: 620, y: 415, size: 11, font: "thai" },

        // Title Company
        TitleCompany1: { x: 205, y: 403, size: 15, font: "check" },
        TitleCompany2: { x: 236, y: 403, size: 15, font: "check" },
        TitleCompany3: { x: 258, y: 403, size: 15, font: "check" },
        NameCompany: { x: 300, y: 392, size: 15, font: "thai" },

        // Dates
        Date1: { x: 450, y: 372, size: 15, format: "date", font: "thai" },

        // Checkboxes
        Repair: { x: 212, y: 345, size: 20, font: "check" },
        Change: { x: 310, y: 345, size: 20, font: "check" },
        Returndata: { x: 408, y: 345, size: 20, font: "check" },
        Other: { x: 507, y: 345, size: 20, font: "check" },

        OthrDetail: { x: 565, y: 344, size: 15, font: "thai" },

        // Detail & Qty
        Detail1: { x: 180, y: 295, size: 15, font: "thai" },
        Qty1: { x: 603, y: 295, size: 15, font: "thai" },
        Detail2: { x: 180, y: 273, size: 15, font: "thai" },
        Qty2: { x: 603, y: 273, size: 15, font: "thai" },
        Detail3: { x: 180, y: 251, size: 15, font: "thai" },
        Qty3: { x: 603, y: 251, size: 15, font: "thai" },
        Detail4: { x: 180, y: 230, size: 15, font: "thai" },
        Qty4: { x: 603, y: 230, size: 15, font: "thai" },

        // Names & Approve
        NameRequest: { x: 340, y: 187, size: 15, font: "thai" },
        NameCheck: { x: 140, y: 152, size: 15, font: "thai" },
        NameApprove: { x: 360, y: 152, size: 15, font: "thai" },

        // More Dates
        Date2: { x: 130, y: 130, size: 15, format: "date", font: "thai" },
        Date3: { x: 370, y: 130, size: 15, format: "date", font: "thai" },
    },
    FM_HR_07: {
        // Personal Info
        NameThi: { x: 150, y: 395, size: 15, font: "thai" },
        Dep: { x: 470, y: 395, size: 15, font: "thai" },
        EmployeeID: { x: 640, y: 395, size: 15, font: "thai" },

        NameEng: { x: 150, y: 375, size: 15, font: "thai" },
        Dep_Eng: { x: 470, y: 375, size: 15, font: "thai" },
        EmployeeID_Eng: { x: 640, y: 375, size: 15, font: "thai" },

        // OT Table 1
        No1: { x: 93, y: 310, size: 15, font: "thai" },
        Date: { x: 127, y: 310, size: 15, font: "thai", format: "date" },
        TimeIN1: { x: 225, y: 310, size: 15, font: "thai", format: "time" },
        TimeOut1: { x: 300, y: 310, size: 15, font: "thai", format: "time" },
        OT150_1: { x: 370, y: 310, size: 15, font: "thai" },
        OT200_1: { x: 420, y: 310, size: 15, font: "thai" },
        OT300_1: { x: 470, y: 310, size: 15, font: "thai" },
        AA1: { x: 512, y: 307, size: 15, font: "check" },
        BB1: { x: 563, y: 307, size: 15, font: "check" },
        CC1: { x: 615, y: 307, size: 15, font: "check" },
        Day1: { x: 665, y: 307, size: 15, font: "check" },

        // OT Table 2
        No2: { x: 93, y: 287, size: 15, font: "thai" },
        Date2: { x: 127, y: 287, size: 15, font: "thai", format: "date" },
        TimeIN2: { x: 225, y: 287, size: 15, font: "thai", format: "time" },
        TimeOut2: { x: 300, y: 287, size: 15, font: "thai", format: "time" },
        OT150_2: { x: 370, y: 287, size: 15, font: "thai" },
        OT200_2: { x: 420, y: 287, size: 15, font: "thai" },
        OT300_2: { x: 470, y: 287, size: 15, font: "thai" },
        AA2: { x: 512, y: 287, size: 15, font: "check" },
        BB2: { x: 563, y: 287, size: 15, font: "check" },
        CC2: { x: 615, y: 287, size: 15, font: "check" },
        Day2: { x: 665, y: 287, size: 15, font: "check" },

        // Checkboxes
        Forget: { x: 152, y: 249, size: 15, font: "check" },
        Record: { x: 282, y: 249, size: 15, font: "check" },
        Offsite: { x: 409, y: 249, size: 15, font: "check" },
        Other: { x: 535, y: 249, size: 15, font: "check" },
        Other_Detail: { x: 580, y: 249, size: 15, font: "thai" },

        // Request & Approve
        NameRequest: { x: 180, y: 205, size: 15, font: "thai" },
        DateRequest: { x: 360, y: 205, size: 15, font: "thai", format: "date" },
        SupRequest: { x: 560, y: 205, size: 15, font: "thai" },

        NameRequest2: { x: 180, y: 178, size: 15, font: "thai" },
        DateRequest2: { x: 360, y: 178, size: 15, font: "thai", format: "date" },
        SupRequest2: { x: 560, y: 178, size: 15, font: "thai" },


        NameCheck: [
            { x: 180, y: 150, size: 15, font: "thai" },
            { x: 180, y: 122, size: 15, font: "thai" },
        ],
        DateCheck: [
            { x: 360, y: 150, size: 15, font: "thai", format: "date" },
            { x: 360, y: 122, size: 15, font: "thai", format: "date" },
        ],
        NameApprove: [
            { x: 560, y: 150, size: 15, font: "thai" },
            { x: 560, y: 122, size: 15, font: "thai" },
        ],
    },
    // เพิ่ม table ใหม่ ๆ ที่นี่ได้เลย
};


export async function mapFieldsToPDF(
    page: PDFPage,
    fontthai: PDFFont,
    fontcheck: PDFFont,
    data: PDFData,
    table: string
) {
    const fieldMap = tableFieldMap[table];
    if (!fieldMap) return;

    const markFields: Record<string, string> = {
        Email: "✓",
        Repair: "✓",
        AddEqui: "✓",
        AddProg: "✓",
        OtherIT: "✓",
        Change: "✓",
        Returndata: "✓",
        Other: "✓",
        TitleName: "__",
        TitleName1: "__",
        TitleName2: "__",
        TitleName3: "______",
        TitleCompany1: "___",
        TitleCompany2: "__",
        TitleCompany3: "__",
        Back: "✓",
        NoBack: "✓",
        AA1: "✓",
        BB1: "✓",
        CC1: "✓",
        AA2: "✓",
        BB2: "✓",
        CC2: "✓",
        Forget: "✓",
        Record: "✓",
        Offsite: "✓",
        Day1: "✓",
        Day2: "✓",
    };

    // loop key ของ fieldMap
    for (const key in fieldMap) {
        const fields = Array.isArray(fieldMap[key]) ? fieldMap[key] : [fieldMap[key]];

        for (const field of fields) {
            const { x, y, size = 12, format, font, source } = field;
            const dataKey = source ?? key;
            let text = data[dataKey] ?? "";

            // date/time format
            if (format === "date" && data[dataKey]) {
                const date = new Date(data[dataKey]);
                text = `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}`;
            }

            if (format === "time" && data[dataKey]) {
                const date = new Date(data[dataKey]);
                const hh = String(date.getHours()).padStart(2, "0");
                const mm = String(date.getMinutes()).padStart(2, "0");
                text = `${hh}:${mm}`;
            }

            // checkbox
            if ((data[dataKey] === 1 || data[dataKey] === "1") && font === "check") {
                text = markFields[key] || "";
            }
            if ((data[dataKey] === 0 || data[dataKey] === "0") && font === "check") {
                text = "";
            }

            page.drawText(text.toString(), {
                x,
                y,
                size,
                font: font === "check" ? fontcheck : fontthai,
                color: rgb(0, 0, 0.7),
            });
        }
    }


}
