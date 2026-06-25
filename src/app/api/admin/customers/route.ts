import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "Admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("users")
    .select("id, full_name, email, phone, created_at")
    .eq("role", "Customer")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const customersWithStats = await Promise.all(
    (data || []).map(async (customer) => {
      const { count: totalOrders } = await supabase
        .from("orders")
        .select("*", { count: "exact", head: true })
        .eq("customer_email", customer.email);

      const { data: spendData } = await supabase
        .from("orders")
        .select("total")
        .eq("customer_email", customer.email);

      const totalSpent = spendData?.reduce((sum, o) => sum + Number(o.total), 0) ?? 0;

      return {
        ...customer,
        totalOrders: totalOrders ?? 0,
        totalSpent: totalSpent.toFixed(2),
      };
    })
  );

  return NextResponse.json({ customers: customersWithStats });
}