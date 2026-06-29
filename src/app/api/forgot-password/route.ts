import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import nodemailer from "nodemailer";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    console.log("1. Email received:", email);

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const { data: user, error: userError } = await supabaseAdmin
      .from("users")
      .select("id, full_name, email")
      .eq("email", email)
      .maybeSingle();

    console.log("2. User found:", user);
    console.log("2. User error:", userError);

    if (!user) {
      return NextResponse.json({ success: true });
    }

    const token = crypto.randomBytes(32).toString("hex");
    console.log("3. Token generated");

    // ✅ Fix — use Supabase SQL to set expiry to avoid timezone issues
    const { error: tokenError } = await supabaseAdmin.rpc("insert_reset_token", {
      p_user_id: user.id,
      p_token: token,
    });

    console.log("4. Token save error:", tokenError);

    if (tokenError) {
      console.error("Token insert error:", tokenError);
      return NextResponse.json({ error: tokenError.message }, { status: 500 });
    }

    console.log("5. EMAIL_USER exists:", !!process.env.EMAIL_USER);
    console.log("5. EMAIL_PASS exists:", !!process.env.EMAIL_PASS);

    const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false, // uses STARTTLS
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

    await transporter.verify();
    console.log("6. Email transporter verified ✅");

    const resetUrl = `${process.env.NEXTAUTH_URL}/reset-password?token=${token}`;
    console.log("7. Reset URL:", resetUrl);

    await transporter.sendMail({
      from: `"AquaPure" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Reset your AquaPure password",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;">
          <div style="background: #042C53; padding: 24px; border-radius: 12px 12px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px;">💧 AquaPure</h1>
          </div>
          <div style="background: #f8fafc; padding: 32px; border-radius: 0 0 12px 12px; border: 1px solid #e2e8f0;">
            <h2 style="color: #042C53; margin-top: 0;">Reset your password</h2>
            <p style="color: #64748b;">Hi ${user.full_name},</p>
            <p style="color: #64748b;">Click the button below to reset your password.</p>
            <div style="text-align: center; margin: 32px 0;">
              <a href="${resetUrl}"
                style="background: #185FA5; color: white; padding: 14px 32px; border-radius: 999px; text-decoration: none; font-weight: bold; display: inline-block;">
                Reset password
              </a>
            </div>
            <p style="color: #94a3b8; font-size: 13px;">This link expires in 2 hours.</p>
          </div>
        </div>
      `,
    });

    console.log("8. Email sent successfully ✅");
    return NextResponse.json({ success: true });

  } catch (err) {
    console.error("❌ FORGOT PASSWORD ERROR:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Something went wrong" },
      { status: 500 }
    );
  }
}