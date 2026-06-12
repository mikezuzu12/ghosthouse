import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
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

    // ✅ SAFE user check (fixes silent Supabase errors)
    const { data: existingUser, error: checkError } = await supabase
      .from("users")
      .select("id")
      .eq("email", email)
      .maybeSingle();

    if (checkError) {
      console.error("CHECK ERROR:", checkError);
    }

    if (existingUser) {
      return NextResponse.json(
        { error: "User already exists" },
        { status: 409 }
      );
    }

    // ✅ Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // ✅ Insert user
    const { data, error } = await supabase
      .from("users")
      .insert([
        {
          full_name,
          email,
          phone,
          password_hash: hashedPassword,
          role,
          address,
          license_number,
          vehicle_type,
          vehicle_registration,
        },
      ])
      .select()
      .maybeSingle();

    if (error) {
      console.error("INSERT ERROR:", error);

      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    console.log("USER INSERTED:", data);

    return NextResponse.json(
      {
        message: "User registered successfully",
        user: data,
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