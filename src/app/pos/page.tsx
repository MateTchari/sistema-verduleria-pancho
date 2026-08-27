import { PosClient } from "@/components/pos-client";
import { supabase } from "@/lib/supabase";

export default async function PosPage() {
  const { data: products } = await supabase.from("products").select("*").order("name");

  return <PosClient initialProducts={(products ?? []).map((product: any) => ({
    id: product.id,
    organizationId: product.organization_id ?? "demo",
    branchId: product.branch_id ?? "demo",
    name: product.name,
    sku: product.sku ?? "",
    barcode: product.barcode ?? "",
    category: product.category ?? "Sin categoría",
    price: Number(product.price ?? 0),
    cost: Number(product.cost ?? 0),
    stock: Number(product.stock ?? 0),
    minStock: Number(product.min_stock ?? 0),
    unitType: (product.unit_type as "unidad" | "peso") ?? "peso",
    active: Boolean(product.active),
    createdAt: product.created_at ?? new Date().toISOString(),
  }))} />;
}
