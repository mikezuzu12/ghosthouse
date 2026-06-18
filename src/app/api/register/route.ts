import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    console.log("REGISTER REQUEST:", body);

    const {
      full_name,
      email,
      phone,
      password,
      role,
      address,
      license_number,
      vehicle_type,
      vehicle_registration,
    } = body;

    // ✅ Validation
    if (!full_name || !email || !password || !role) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // ✅ Check if user exists using Drizzle
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existingUser.length > 0) {
      return NextResponse.json(
        { error: "User already exists" },
        { status: 409 }
      );
    }

    // ✅ Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // ✅ Insert user with Drizzle
    const newUser = await db
      .insert(users)
      .values({
        fullName: full_name,
        email,
        phone,
        passwordHash: hashedPassword,
        role,
        address: role === "Customer" ? address : null,
        licenseNumber: role === "Driver" ? license_number : null,
        vehicleType: role === "Driver" ? vehicle_type : null,
        vehicleRegistration: role === "Driver" ? vehicle_registration : null,
      })
      .returning();

    console.log("USER INSERTED:", newUser[0]);

    return NextResponse.json(
      {
        message: "User registered successfully",
        user: newUser[0],
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("SERVER ERROR:", error);

    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}