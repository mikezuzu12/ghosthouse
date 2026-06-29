import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";

const supabase = supabaseAdmin;

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "Admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("users")
    .select("id, full_name, email, phone, created_at, is_blocked")
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

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "Admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id, action } = await req.json();

  if (action === "block" || action === "unblock") {
    const { error } = await supabase
      .from("users")
      .update({ is_blocked: action === "block" })
      .eq("id", id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}