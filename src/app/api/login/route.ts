import { NextRequest, NextResponse } from "next/server";

const USERS = [
  { id: 1, name: "Admin", email: "admin@aquapure.com", password: "admin123", role: "admin" },
  { id: 2, name: "Mike", email: "michaelzuzu12@gmail.com", password: "12345", role: "user" },
];

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    const user = USERS.find(
      (u) => u.email === email && u.password === password
    );

    if (!user) {
      return NextResponse.json(
        { error: "Invalid email or password." },
        { status: 401 }
      );
    }

    const { password: _, ...safeUser } = user;

    return NextResponse.json({ success: true, user: safeUser });
  } catch {
    return NextResponse.json(
      { error: "Something went wrong." },
      { status: 500 }
    );
  }
}