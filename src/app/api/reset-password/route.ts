import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  try {
    const { token, password } = await req.json();

    if (!token || !password) {
      return NextResponse.json(
        { error: "Token and password are required" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters" },
        { status: 400 }
      );
    }

    // ✅ Let Supabase check expiry server-side to avoid timezone issues
    const { data: resetToken, error: tokenError } = await supabase
      .from("password_reset_tokens")
      .select("*")
      .eq("token", token)
      .eq("used", false)
      .gt("expires_at", new Date().toISOString())
      .maybeSingle();

    console.log("TOKEN FOUND:", resetToken);
    console.log("TOKEN ERROR:", tokenError);

    if (tokenError || !resetToken) {
      return NextResponse.json(
        { error: "Invalid or expired reset link." },
        { status: 400 }
      );
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Update user password
    const { error: updateError } = await supabase
      .from("users")
      .update({ password_hash: hashedPassword })
      .eq("id", resetToken.user_id);

    if (updateError) {
      console.error("Update error:", updateError);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    // Mark token as used
    await supabase
      .from("password_reset_tokens")
      .update({ used: true })
      .eq("id", resetToken.id);

    console.log("✅ Password reset successfully");
    return NextResponse.json({ success: true });

  } catch (err) {
    console.error("Reset password error:", err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}