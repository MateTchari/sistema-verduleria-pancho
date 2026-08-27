"use client";

import { useEffect, useState } from "react";
import { readCachedProducts, readCachedSales, subscribeToStoreUpdates, type SaleRecord } from "@/lib/sale-sync";
import type { Product } from "@/lib/types";

export function LiveSalesSummary() {
  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<SaleRecord[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setProducts(readCachedProducts());
    setSales(readCachedSales());

    const unsubscribe = subscribeToStoreUpdates(() => {
      setProducts(readCachedProducts());
      setSales(readCachedSales());
    });

    return unsubscribe;
  }, []);

  if (!mounted) {
    return (
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Ventas del día</p>
          <p className="mt-3 text-3xl font-semibold">—</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Productos activos</p>
          <p className="mt-3 text-3xl font-semibold">—</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Estado de caja</p>
          <p className="mt-3 text-3xl font-semibold text-emerald-700">—</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Alertas stock</p>
          <p className="mt-3 text-3xl font-semibold text-amber-600">—</p>
        </div>
      </div>
    );
  }

  const totalSales = sales.reduce((sum, sale) => sum + sale.total, 0);
  const lowStock = products.filter((product) => product.stock <= product.minStock).length;

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-sm text-slate-500">Ventas del día</p>
        <p className="mt-3 text-3xl font-semibold">{totalSales.toLocaleString("es-AR", { style: "currency", currency: "ARS" })}</p>
      </div>
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-sm text-slate-500">Productos activos</p>
        <p className="mt-3 text-3xl font-semibold">{products.filter((p) => p.active).length}</p>
      </div>
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-sm text-slate-500">Estado de caja</p>
        <p className="mt-3 text-3xl font-semibold text-emerald-700">Abierta</p>
      </div>
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-sm text-slate-500">Alertas stock</p>
        <p className="mt-3 text-3xl font-semibold text-amber-600">{lowStock}</p>
      </div>
    </div>
  );
}
