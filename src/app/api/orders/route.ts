import { NextRequest, NextResponse } from "next/server";

type OrderItem = {
  id: number;
  name: string;
  quantity: number;
  price: number;
};

type Order = {
  id: number;
  name: string;
  email: string;
  phone: string;
  address: string;
  items: OrderItem[];
  total: number;
  status: string;
  created_at: string;
};

const orders: Order[] = [];
let nextId = 1;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, phone, address, items, total } = body;

    if (!name || !email || !address || !items || !total) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const newOrder: Order = {
      id: nextId++,
      name,
      email,
      phone,
      address,
      items,
      total,
      status: "pending",
      created_at: new Date().toISOString(),
    };

    orders.push(newOrder);

    return NextResponse.json(
      { success: true, order: newOrder },
      { status: 201 }
    );
  } catch (error) {
    console.error("Order error:", error);
    return NextResponse.json(
      { error: "Failed to save order" },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ orders });
}