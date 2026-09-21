"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

interface ProductRow {
  id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  minStock: number;
  unitType: "unidad" | "peso";
  active: boolean;
}

interface ProductsManagerProps {
  initialProducts: ProductRow[];
}

const emptyForm = {
  name: "",
  category: "Frutas",
  price: "1200",
  stock: "10",
  minStock: "3",
  unitType: "peso" as "unidad" | "peso",
  active: true,
};

export function ProductsManager({ initialProducts }: ProductsManagerProps) {
  const [products, setProducts] = useState(initialProducts);
  const [isOpen, setIsOpen] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...emptyForm, active: true });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const loadProducts = async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .order("name");

      if (error) {
        console.error("Error sincronizando productos con Supabase:", error);
        return;
      }

      if (!data || !active) return;

      setProducts(
        data.map((product: any) => ({
          id: product.id,
          name: product.name,
          category: product.category,
          price: Number(product.price ?? 0),
          stock: Number(product.stock ?? 0),
          minStock: Number(product.min_stock ?? 0),
          unitType: (product.unit_type as "unidad" | "peso") ?? "peso",
          active: Boolean(product.active),
        }))
      );
    };

    void loadProducts();

    const channel = supabase
      .channel("products-manager-realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "products",
        },
        () => {
          void loadProducts();
        }
      )
      .subscribe();

    const fallbackRefresh = window.setInterval(() => {
      void loadProducts();
    }, 5000);

    return () => {
      active = false;
      window.clearInterval(fallbackRefresh);
      void supabase.removeChannel(channel);
    };
  }, []);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setMessage(null);

    const payload = {
      organization_id: "demo",
      branch_id: "main",
      name: form.name,
      category: form.category,
      price: Number(form.price),
      cost: Number(form.price) * 0.6,
      stock: Number(form.stock),
      min_stock: Number(form.minStock),
      unit_type: form.unitType,
      active: form.active,
    };

    if (editingProductId) {
      const { data, error } = await supabase
        .from("products")
        .update(payload)
        .eq("id", editingProductId)
        .select()
        .single();

      if (error || !data) {
        setMessage("No se pudo actualizar el producto.");
        setSaving(false);
        return;
      }

      setProducts((current) =>
        current.map((item) =>
          item.id === editingProductId
            ? {
                id: data.id,
                name: data.name,
                category: data.category,
                price: Number(data.price ?? 0),
                stock: Number(data.stock ?? 0),
                minStock: Number(data.min_stock ?? 0),
                unitType: (data.unit_type as "unidad" | "peso") ?? "peso",
                active: Boolean(data.active),
              }
            : item
        )
      );
      setMessage("Producto actualizado correctamente.");
    } else {
      const { data, error } = await supabase.from("products").insert(payload).select().single();

      if (error || !data) {
        setMessage("No se pudo guardar el producto.");
        setSaving(false);
        return;
      }

      setProducts((current) => [
        ...current,
        {
          id: data.id,
          name: data.name,
          category: data.category,
          price: Number(data.price ?? 0),
          stock: Number(data.stock ?? 0),
          minStock: Number(data.min_stock ?? 0),
          unitType: (data.unit_type as "unidad" | "peso") ?? "peso",
          active: Boolean(data.active),
        },
      ]);
      setMessage("Producto creado correctamente.");
    }

    setForm({ ...emptyForm, active: true });
    setEditingProductId(null);
    setIsOpen(false);
    setSaving(false);
  };

  const deleteProduct = async (product: ProductRow) => {
    const confirmed = window.confirm(`¿Eliminar "${product.name}"? Esta acción no se puede deshacer.`);
    if (!confirmed) return;

    setSaving(true);
    setMessage(null);

    const { data, error } = await supabase
      .from("products")
      .delete()
      .eq("id", product.id)
      .select("id");

    if (error) {
      console.error(error);
      setMessage("No se pudo eliminar el producto.");
      setSaving(false);
      return;
    }

    if (!data || data.length === 0) {
      setMessage("Supabase no permitió eliminar el producto. Falta permiso DELETE en la tabla products.");
      setSaving(false);
      return;
    }

    setProducts((current) => current.filter((item) => item.id !== product.id));
    setMessage("Producto eliminado correctamente.");
    setSaving(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div>
          <p className="text-sm text-slate-500">Catálogo</p>
          <h3 className="text-2xl font-semibold">Productos</h3>
        </div>
        <button
          onClick={() => setIsOpen(true)}
          className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white"
        >
          Nuevo producto
        </button>
      </div>

      {message ? <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">{message}</div> : null}

      {isOpen ? (
        <form onSubmit={handleSubmit} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium">Nombre</label>
              <input
                required
                value={form.name}
                onChange={(event) => setForm({ ...form, name: event.target.value })}
                className="w-full rounded-xl border border-slate-300 px-3 py-2"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium">Categoría</label>
              <input
                value={form.category}
                onChange={(event) => setForm({ ...form, category: event.target.value })}
                className="w-full rounded-xl border border-slate-300 px-3 py-2"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium">Precio</label>
              <input
                type="number"
                value={form.price}
                onChange={(event) => setForm({ ...form, price: event.target.value })}
                className="w-full rounded-xl border border-slate-300 px-3 py-2"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium">Se vende por</label>
              <select
                value={form.unitType}
                onChange={(event) => setForm({ ...form, unitType: event.target.value as "unidad" | "peso" })}
                className="w-full rounded-xl border border-slate-300 px-3 py-2"
              >
                <option value="peso">Peso (precio por kg)</option>
                <option value="unidad">Unidad (precio por unidad)</option>
              </select>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium">Stock inicial</label>
              <input
                type="number"
                step="0.5"
                value={form.stock}
                onChange={(event) => setForm({ ...form, stock: event.target.value })}
                className="w-full rounded-xl border border-slate-300 px-3 py-2"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium">Stock mínimo</label>
              <input
                type="number"
                step="0.5"
                value={form.minStock}
                onChange={(event) => setForm({ ...form, minStock: event.target.value })}
                className="w-full rounded-xl border border-slate-300 px-3 py-2"
              />
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-3 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={form.active}
                  onChange={(event) => setForm({ ...form, active: event.target.checked })}
                  className="h-4 w-4 rounded border-slate-300"
                />
                Activo
              </label>
            </div>
          </div>
          <div className="mt-4 flex gap-3">
            <button type="submit" disabled={saving} className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white">
              {saving ? "Guardando..." : editingProductId ? "Actualizar producto" : "Guardar producto"}
            </button>
            <button type="button" onClick={() => setIsOpen(false)} className="rounded-xl border border-slate-300 px-4 py-2 text-sm">
              Cancelar
            </button>
          </div>
        </form>
      ) : null}

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-left text-slate-600">
            <tr>
              <th className="px-4 py-3">Producto</th>
              <th className="px-4 py-3">Categoría</th>
              <th className="px-4 py-3">Precio</th>
              <th className="px-4 py-3">Stock</th>
              <th className="px-4 py-3">Venta</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr key={product.id} className="border-t border-slate-100">
                <td className="px-4 py-3 font-medium">{product.name}</td>
                <td className="px-4 py-3">{product.category}</td>
                <td className="px-4 py-3">${Number(product.price ?? 0).toFixed(2)}</td>
                <td className="px-4 py-3">{product.stock}</td>
                <td className="px-4 py-3">Por {product.unitType === "peso" ? "peso" : "unidad"}</td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2 py-1 text-xs ${product.active ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-700"}`}>
                    {product.active ? "Activo" : "Inactivo"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingProductId(product.id);
                        setForm({
                          name: product.name,
                          category: product.category,
                          price: String(product.price),
                          stock: String(product.stock),
                          minStock: String(product.minStock),
                          unitType: product.unitType,
                          active: product.active,
                        });
                        setIsOpen(true);
                      }}
                      className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700"
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      disabled={saving}
                      onClick={() => deleteProduct(product)}
                      className="rounded-xl border border-rose-200 px-3 py-2 text-sm text-rose-700 disabled:opacity-50"
                    >
                      Eliminar
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
