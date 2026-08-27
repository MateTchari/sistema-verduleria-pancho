"use client";

import { useEffect, useState } from "react";
import { loadLocalCashSessionHistory } from "@/lib/cash-session";
import { formatArgentinaDateTime } from "@/lib/sale-sync";
import type { CashSession } from "@/lib/types";

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
}).format(value);

export function CashHistory() {
  const [history, setHistory] = useState<CashSession[]>([]);

  useEffect(() => {
    setHistory(loadLocalCashSessionHistory());
  }, []);

  if (history.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-sm text-slate-500">Historial de cajas</p>
        <p className="mt-3 text-sm text-slate-600">No hay aperturas o cierres de caja registradas aún.</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 bg-slate-50 px-4 py-4">
        <p className="text-sm text-slate-500">Historial de cajas</p>
      </div>
      <table className="min-w-full text-sm text-left">
        <thead className="bg-slate-50 text-slate-600">
          <tr>
            <th className="px-4 py-3">ID</th>
            <th className="px-4 py-3">Estado</th>
            <th className="px-4 py-3">Apertura</th>
            <th className="px-4 py-3">Cierre</th>
            <th className="px-4 py-3">Apertura</th>
            <th className="px-4 py-3">Esperado</th>
          </tr>
        </thead>
        <tbody>
          {history.map((session) => (
            <tr key={session.id} className="border-t border-slate-100">
              <td className="px-4 py-3 break-words max-w-[12rem]">{session.id}</td>
              <td className="px-4 py-3 text-slate-700">{session.status === "abierta" ? "Abierta" : "Cerrada"}</td>
              <td className="px-4 py-3 text-slate-600">{formatArgentinaDateTime(session.openedAt)}</td>
              <td className="px-4 py-3 text-slate-600">{session.closedAt ? new Date(session.closedAt).toLocaleString() : "—"}</td>
              <td className="px-4 py-3 text-slate-700">{formatCurrency(session.openingAmount)}</td>
              <td className="px-4 py-3 text-slate-700">{formatCurrency(session.expectedAmount)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
