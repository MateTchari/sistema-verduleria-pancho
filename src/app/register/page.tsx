"use client";

import Link from "next/link";

export default function RegisterPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-10">
      <div className="w-full max-w-lg rounded-3xl border border-slate-800 bg-white p-8 shadow-2xl">
        <h1 className="text-3xl font-semibold text-slate-900">Registrar empresa</h1>
        <p className="mt-2 text-sm text-slate-500">Prepará la empresa, sucursales y primeros usuarios para operar el sistema.</p>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 p-4">
            <label className="mb-2 block text-sm font-medium">Nombre de la empresa</label>
            <input className="w-full rounded-xl border border-slate-300 px-3 py-2" />
          </div>
          <div className="rounded-2xl border border-slate-200 p-4">
            <label className="mb-2 block text-sm font-medium">Correo del propietario</label>
            <input className="w-full rounded-xl border border-slate-300 px-3 py-2" />
          </div>
        </div>
        <div className="mt-4 flex justify-between">
          <Link href="/login" className="text-sm text-slate-600">Volver al login</Link>
          <button className="rounded-xl bg-slate-900 px-4 py-2 text-white">Crear empresa</button>
        </div>
      </div>
    </div>
  );
}
