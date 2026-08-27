"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [user, setUser] = useState("admin");
  const [password, setPassword] = useState("admin");
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const enterSales = () => {
    window.localStorage.setItem("app-session", JSON.stringify({ name: "Vendedor", role: "cajero" }));
    router.replace("/pos");
  };

  const loginAsAdmin = (event: React.FormEvent) => {
    event.preventDefault();
    if (user.trim().toLowerCase() !== "admin" || password !== "admin") {
      setError("Usuario o contraseña de administrador incorrectos.");
      return;
    }
    window.localStorage.setItem("app-session", JSON.stringify({ name: "Administrador", role: "administrador" }));
    router.replace("/");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-950 via-blue-900 to-sky-600 px-4 py-10">
      <div className="w-full max-w-md rounded-3xl border border-white/20 bg-white p-8 shadow-2xl">
        <div className="mb-8">
          <h1 className="text-3xl font-semibold text-slate-900">Verdulería Pancho</h1>
          <p className="mt-2 text-sm text-slate-500">Ingresá directo a Venta o iniciá sesión como administrador.</p>
        </div>

        {!showAdminLogin ? (
          <div className="space-y-3">
            <button onClick={enterSales} className="w-full rounded-xl bg-blue-800 px-4 py-3 font-medium text-white transition hover:bg-blue-700">Entrar a ventas</button>
            <button onClick={() => setShowAdminLogin(true)} className="w-full rounded-xl border border-slate-300 px-4 py-3 font-medium text-slate-700 transition hover:bg-slate-50">Iniciar como administrador</button>
          </div>
        ) : (
          <form onSubmit={loginAsAdmin} className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Usuario</label>
              <input className="w-full rounded-xl border border-slate-300 px-3 py-2 text-slate-900" value={user} onChange={(event) => setUser(event.target.value)} autoComplete="username" />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Contraseña</label>
              <input type="password" className="w-full rounded-xl border border-slate-300 px-3 py-2 text-slate-900" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" />
            </div>
            {error ? <p className="text-sm text-rose-600">{error}</p> : null}
            <button className="w-full rounded-xl bg-blue-800 px-4 py-3 font-medium text-white transition hover:bg-blue-700">Entrar como administrador</button>
            <button type="button" onClick={() => { setShowAdminLogin(false); setError(null); }} className="w-full text-sm text-slate-600 hover:underline">Volver</button>
          </form>
        )}
      </div>
    </div>
  );
}
