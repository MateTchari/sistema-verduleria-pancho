import Link from "next/link";

const menuOptions = [
  { href: "/products", icon: "▣", title: "Productos", description: "Cargá y administrá el catálogo." },
  { href: "/pos", icon: "◫", title: "Venta", description: "Registrá una nueva venta." },
  { href: "/reports", icon: "◉", title: "Reportes", description: "Consultá el historial de ventas." },
];

export default function HomePage() {
  return (
    <section className="mx-auto max-w-5xl p-6 text-white sm:p-10">
      <div className="mb-8">
        <p className="text-sm font-medium uppercase tracking-[0.22em] text-emerald-300">Administrador</p>
        <h3 className="mt-2 text-3xl font-semibold sm:text-4xl">Menú principal</h3>
        <p className="mt-2 text-slate-300">Elegí la sección a la que querés ingresar.</p>
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        {menuOptions.map((option) => (
          <Link key={option.href} href={option.href} className="group min-h-52 rounded-3xl border border-sky-300/30 bg-blue-800 p-7 shadow-lg transition hover:-translate-y-1 hover:scale-[1.02] hover:bg-blue-700 hover:shadow-2xl">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20 text-3xl text-white ring-1 ring-white/30">{option.icon}</span>
            <h4 className="mt-6 text-2xl font-semibold">{option.title}</h4>
            <p className="mt-2 text-sm text-white/80">{option.description}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}
