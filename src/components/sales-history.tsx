"use client";

import { useEffect, useMemo, useState } from "react";
import { formatArgentinaDateTime, formatCurrency, printSaleDocument, readCachedDocuments, readCachedSales, subscribeToStoreUpdates } from "@/lib/sale-sync";
import type { SaleDocument, SaleRecord } from "@/lib/sale-sync";

export function SalesHistory() {
  const [sales, setSales] = useState<SaleRecord[]>([]);
  const [documents, setDocuments] = useState<SaleDocument[]>([]);
  const [selectedSaleId, setSelectedSaleId] = useState<string | null>(null);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  useEffect(() => {
    const sync = () => {
      setSales(readCachedSales());
      setDocuments(readCachedDocuments());
    };
    sync();
    return subscribeToStoreUpdates(sync);
  }, []);

  const selectedSale = useMemo(
    () => sales.find((sale) => sale.id === selectedSaleId) ?? null,
    [sales, selectedSaleId]
  );
  const saleDocuments = useMemo(
    () => documents.filter((document) => document.saleId === selectedSaleId),
    [documents, selectedSaleId]
  );
  const filteredSales = useMemo(() => {
    const start = startDate ? new Date(`${startDate}T00:00:00-03:00`).getTime() : Number.NEGATIVE_INFINITY;
    const end = endDate ? new Date(`${endDate}T23:59:59.999-03:00`).getTime() : Number.POSITIVE_INFINITY;
    return sales.filter((sale) => {
      const saleDate = new Date(sale.createdAt).getTime();
      return saleDate >= start && saleDate <= end;
    });
  }, [sales, startDate, endDate]);
  const periodTotal = useMemo(() => filteredSales.reduce((sum, sale) => sum + sale.total, 0), [filteredSales]);

  if (selectedSale) {
    return (
      <div className="space-y-6">
        <button type="button" onClick={() => setSelectedSaleId(null)} className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium">
          Volver al historial
        </button>
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Detalle de venta</p>
          <div className="mt-2 flex flex-wrap items-start justify-between gap-4">
            <div>
              <h3 className="text-2xl font-semibold">{formatArgentinaDateTime(selectedSale.createdAt)}</h3>
              <p className="mt-1 text-sm text-slate-500">{selectedSale.customerName} · {selectedSale.paymentMethod}</p>
            </div>
            <p className="text-2xl font-semibold">{formatCurrency(selectedSale.total)}</p>
          </div>
          <div className="mt-6 overflow-hidden rounded-xl border border-slate-200">
            {selectedSale.items.map((item) => (
              <div key={item.productId} className="flex items-center justify-between border-b border-slate-100 px-4 py-3 last:border-b-0">
                <div>
                  <p className="font-medium">{item.name}</p>
                  <p className="text-sm text-slate-500">{item.unitType === "peso" ? `${item.quantity.toFixed(3)} kg` : `${item.quantity} u`} × {formatCurrency(item.price)}</p>
                </div>
                <span className="font-medium">{formatCurrency(item.total)}</span>
              </div>
            ))}
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            {saleDocuments.length === 0 ? <p className="text-sm text-slate-500">No hay comprobantes guardados para esta venta.</p> : null}
            {saleDocuments.map((document) => (
              <button key={document.id} type="button" onClick={() => printSaleDocument(document)} className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white">
                Ver {document.type === "factura" ? "factura" : "ticket"}
              </button>
            ))}
          </div>
        </section>
      </div>
    );
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 bg-slate-50 px-5 py-4">
        <p className="text-sm text-slate-500">Reportes</p>
        <h3 className="text-xl font-semibold">Historial de ventas</h3>
      </div>
      <div className="grid gap-4 border-b border-slate-200 p-5 md:grid-cols-[1fr_1fr_auto] md:items-end">
        <label className="text-sm font-medium text-slate-700">
          Desde
          <input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2 text-slate-900" />
        </label>
        <label className="text-sm font-medium text-slate-700">
          Hasta
          <input type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2 text-slate-900" />
        </label>
        <div className="rounded-2xl bg-blue-900 px-5 py-3 text-white">
          <p className="text-xs text-blue-200">Total vendido</p>
          <p className="mt-1 text-2xl font-semibold">{formatCurrency(periodTotal)}</p>
          <p className="text-xs text-blue-200">{filteredSales.length} venta{filteredSales.length === 1 ? "" : "s"}</p>
        </div>
      </div>
      {filteredSales.length === 0 ? (
        <p className="p-5 text-sm text-slate-500">No hay ventas en el período seleccionado.</p>
      ) : (
        <div className="divide-y divide-slate-100">
          {filteredSales.map((sale) => (
            <button key={sale.id} type="button" onClick={() => setSelectedSaleId(sale.id)} className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition hover:bg-slate-50">
              <div>
                <p className="font-medium">{formatArgentinaDateTime(sale.createdAt)}</p>
                <p className="mt-1 text-sm text-slate-500">{sale.paymentMethod} · {sale.items.length} producto{sale.items.length === 1 ? "" : "s"}</p>
              </div>
              <div className="flex items-center gap-4">
                <span className="font-semibold">{formatCurrency(sale.total)}</span>
                <span className="text-sm text-slate-500">Ver ›</span>
              </div>
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
