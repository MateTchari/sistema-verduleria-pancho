export default function SettingsPage() {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm text-slate-500">Configuración</p>
      <h3 className="text-2xl font-semibold">Multiempresa, permisos y módulos</h3>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 p-4">
          <h4 className="font-semibold">Empresa</h4>
          <p className="mt-2 text-sm text-slate-500">Nombre, dirección, moneda y sucursales.</p>
        </div>
        <div className="rounded-2xl border border-slate-200 p-4">
          <h4 className="font-semibold">Roles y permisos</h4>
          <p className="mt-2 text-sm text-slate-500">Propietario, administrador, cajero, mozo, cocina y lectura.</p>
        </div>
        <div className="rounded-2xl border border-slate-200 p-4">
          <h4 className="font-semibold">Integraciones</h4>
          <p className="mt-2 text-sm text-slate-500">Mercado Pago y ARCA preparados con modo simulado.</p>
        </div>
        <div className="rounded-2xl border border-slate-200 p-4">
          <h4 className="font-semibold">Auditoría</h4>
          <p className="mt-2 text-sm text-slate-500">Historial de cambios y movimientos auditable.</p>
        </div>
      </div>
    </div>
  );
}
