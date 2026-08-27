import { ProductsManager } from "@/components/products-manager";
import { supabase } from "@/lib/supabase";

export default async function ProductsPage() {
  const { data: products, error } = await supabase.from("products").select("*").order("name");

  return (
    <div className="space-y-6">
      <ProductsManager
        initialProducts={(products ?? []).map((product: any) => ({
          id: product.id,
          name: product.name,
          category: product.category,
          price: Number(product.price ?? 0),
          stock: Number(product.stock ?? 0),
          minStock: Number(product.min_stock ?? 0),
          unitType: (product.unit_type as "unidad" | "peso") ?? "peso",
          active: Boolean(product.active),
        }))}
      />
      {error ? <div className="rounded-2xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700">No se pudieron cargar los productos desde Supabase.</div> : null}
    </div>
  );
}
