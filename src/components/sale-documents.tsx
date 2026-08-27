"use client";

import { useEffect, useState } from "react";
import { printSaleDocument, readCachedDocuments, subscribeToStoreUpdates } from "@/lib/sale-sync";
import type { SaleDocument } from "@/lib/sale-sync";

export function SaleDocuments() {
  const [documents, setDocuments] = useState<SaleDocument[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setDocuments(readCachedDocuments());

    const sync = () => setDocuments(readCachedDocuments());
    const unsubscribe = subscribeToStoreUpdates(() => sync());
    return unsubscribe;
  }, []);

  if (!mounted) return null;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-500">Documentos</p>
          <h3 className="text-xl font-semibold">Tickets y facturas</h3>
        </div>
      </div>
      <div className="space-y-3">
        {documents.length === 0 ? (
          <p className="text-sm text-slate-500">Todavía no hay documentos guardados.</p>
        ) : (
          documents.map((document) => (
            <div key={document.id} className="rounded-2xl border border-slate-200 p-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-medium">{document.type === "factura" ? "Factura" : "Ticket"}</p>
                  <p className="text-sm text-slate-500">{document.customerName}</p>
                </div>
                <button
                  type="button"
                  onClick={() => printSaleDocument(document)}
                  className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
                >
                  Imprimir
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
