"use client";

import { useEffect, useMemo, useState } from "react";
import type { CashSession } from "@/lib/types";
import { loadLocalCashSession, loadLocalCashSessionHistory, saveLocalCashSession } from "@/lib/cash-session";

interface CashSessionManagerProps {
  salesTotal: number;
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
  }).format(value / 100);

export function CashSessionManager({ salesTotal }: CashSessionManagerProps) {
  const [session, setSession] = useState<CashSession | null>(null);
  const [history, setHistory] = useState<CashSession[]>([]);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const stored = loadLocalCashSession();
    setSession(stored ?? null);
    setHistory(loadLocalCashSessionHistory());
  }, []);

  useEffect(() => {
    if (!session) return;
    saveLocalCashSession(session);
  }, [session]);

  const expectedAmount = useMemo(() => {
    if (!session) return 0;
    if (session.status === "abierta") {
      return session.openingAmount + salesTotal;
    }
    return session.expectedAmount;
  }, [session, salesTotal]);

  const openSession = () => {
    if (!session) {
      setMessage("No hay sesión disponible para abrir.");
      return;
    }

    setSession({
      ...session,
      status: "abierta",
      openedAt: new Date().toISOString(),
      closedAt: undefined,
      expectedAmount: session.openingAmount + salesTotal,
    });
    setMessage("Caja abierta correctamente.");
  };

  const closeSession = () => {
    if (!session) return;
    const closedSession: CashSession = {
      ...session,
      status: "cerrada",
      closedAt: new Date().toISOString(),
      expectedAmount,
    };
    setSession(closedSession);
    setHistory((current) => [...current.filter((item) => item.id !== closedSession.id), closedSession]);
    setMessage("Caja cerrada correctamente.");
  };

  if (!session) {
    return <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">Cargando estado de caja...</div>;
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-500">Caja</p>
          <h3 className="text-2xl font-semibold">Control de caja</h3>
        </div>
        <span
          className={`rounded-full px-3 py-2 text-sm font-medium ${
            session.status === "abierta" ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-700"
          }`}
        >
          {session.status === "abierta" ? "Abierta" : "Cerrada"}
        </span>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl bg-slate-50 p-4">
          <p className="text-sm text-slate-500">Apertura</p>
          <p className="mt-2 text-xl font-semibold">{formatCurrency(session.openingAmount)}</p>
        </div>
        <div className="rounded-2xl bg-slate-50 p-4">
          <p className="text-sm text-slate-500">Ventas</p>
          <p className="mt-2 text-xl font-semibold">{formatCurrency(salesTotal)}</p>
        </div>
        <div className="rounded-2xl bg-slate-50 p-4">
          <p className="text-sm text-slate-500">Esperado</p>
          <p className="mt-2 text-xl font-semibold">{formatCurrency(expectedAmount)}</p>
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          onClick={session.status === "abierta" ? closeSession : openSession}
          className="rounded-xl bg-slate-900 px-4 py-3 text-sm font-medium text-white"
        >
          {session.status === "abierta" ? "Cerrar caja" : "Abrir caja"}
        </button>
        {session.status === "cerrada" ? (
          <button
            type="button"
            onClick={openSession}
            className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700"
          >
            Reabrir caja
          </button>
        ) : null}
      </div>

      {message ? <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">{message}</div> : null}
    </div>
  );
}
