"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

export function AppShell({ children }: { children: React.ReactNode }) {
  const [userName, setUserName] = useState("Demo");
  const [isAdmin, setIsAdmin] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (pathname === "/login" || pathname === "/register") return;

    const stored = window.localStorage.getItem("app-session");
    if (!stored) {
      router.replace("/login");
      return;
    }

    const parsed = JSON.parse(stored);
    const admin = parsed.role === "administrador";
    setUserName(parsed.name ?? "Demo");
    setIsAdmin(admin);

    if (!admin && pathname !== "/pos") {
      router.replace("/pos");
      return;
    }
    setSessionReady(true);
  }, [pathname, router]);

  const handleLogout = () => {
    window.localStorage.removeItem("app-session");
    router.replace("/login");
  };

  if (pathname === "/login" || pathname === "/register") return <>{children}</>;
  if (!sessionReady || (!isAdmin && pathname !== "/pos")) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-900 to-sky-600 text-slate-800">
      <main className="min-h-screen p-4 sm:p-6 lg:p-8">
        <header className="mb-6 flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm">
          <div>
            <p className="text-sm text-slate-500">Sistema comercial</p>
            <h1 className="text-xl font-semibold">Verdulería Pancho</h1>
          </div>
          <div className="flex items-center gap-3">
            {isAdmin && pathname !== "/" ? (
              <Link
                href="/"
                aria-label="Volver al menú principal"
                title="Menú principal"
                className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-900 text-3xl text-white shadow-md transition hover:scale-105 hover:bg-slate-700"
              >
                ⌂
              </Link>
            ) : null}
            <div className="rounded-full bg-amber-100 px-3 py-2 text-sm font-medium text-amber-700">{userName}</div>
            <button onClick={handleLogout} className="rounded-full border border-slate-200 px-3 py-2 text-sm text-slate-600">
              Cerrar sesión
            </button>
          </div>
        </header>
        {children}
      </main>
    </div>
  );
}
