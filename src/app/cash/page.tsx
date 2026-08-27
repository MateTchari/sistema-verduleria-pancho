import { CashSessionManager } from "@/components/cash-session-manager";
import { supabase } from "@/lib/supabase";

export default async function CashPage() {
  const { data: sales } = await supabase.from("sales").select("total");

  const salesTotal = (sales ?? []).reduce<number>((sum, sale: any) => sum + Number(sale.total ?? 0), 0);

  return (
    <div className="space-y-6">
      <CashSessionManager salesTotal={salesTotal} />
    </div>
  );
}
