"use client";

import React from "react";

interface SupervisorPopupProps {
  onClose: () => void;
  onApprove: () => void;
  onReject: () => void;

}

export default function SupervisorPopup({ onClose, onApprove, onReject }: SupervisorPopupProps) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-lg w-80 max-w-[90%] p-6 text-center">
        <h2 className="text-xl font-semibold mb-2">ยืนยันการดำเนินการ</h2>
        <p className="mb-4">คุณต้องการอนุมัติหรือไม่?</p>

        <div className="flex justify-center gap-4 mb-4">
          <button
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition"
            onClick={onApprove}
          >
            ✅ อนุมัติ
          </button>
          <button
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition"
            onClick={onReject}
          >
            ❌ ไม่อนุมัติ
          </button>
        </div>

        <button
          className="px-3 py-1 bg-gray-400 text-white rounded-md hover:bg-gray-500 transition"
          onClick={onClose}
        >
          ปิด
        </button>
      </div>
    </div>
  );
}
