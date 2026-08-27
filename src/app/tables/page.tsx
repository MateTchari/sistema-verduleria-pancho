import { readStore } from "@/lib/store";

export default async function TablesPage() {
  const store = await readStore();

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-sm text-slate-500">Gastronomía</p>
        <h3 className="text-2xl font-semibold">Mesas</h3>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {store.tables.map((table) => (
          <div key={table.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <h4 className="text-lg font-semibold">Mesa {table.tableNumber}</h4>
              <span className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-700">{table.status}</span>
            </div>
            <p className="mt-2 text-sm text-slate-500">Mozo: {table.waiter || "Sin asignar"}</p>
            <p className="mt-2 text-sm text-slate-500">Comensales: {table.guests}</p>
            <p className="mt-4 text-lg font-semibold">Total ${table.total / 100}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
