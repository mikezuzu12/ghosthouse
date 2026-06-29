import CredentialsProvider from "next-auth/providers/credentials";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import bcrypt from "bcryptjs";

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        console.log("🔐 Authorize called with:", credentials?.email);

        if (!credentials?.email || !credentials?.password) {
          console.log("❌ Missing credentials");
          return null;
        }

        const { data: user, error } = await supabaseAdmin
          .from("users")
          .select("*")
          .eq("email", credentials.email)
          .maybeSingle();

        if (error) {
          console.error("❌ Supabase error:", error);
          return null;
        }

        if (!user) {
          console.log("❌ User not found for email:", credentials.email);
          return null;
        }

        console.log("✅ User found:", user.email);
        console.log("📋 User role:", user.role);
        console.log("📋 User ID:", user.id);
        console.log("📋 User columns:", Object.keys(user));

        if (user.is_blocked) {
          console.log("🚫 Blocked user attempted login:", user.email);
          throw new Error("Your account has been blocked. Please contact support.");
        }

        const passwordHash = user.password_hash || user.passwordHash || user.password;

        if (!passwordHash) {
          console.error("❌ No password field found in user");
          return null;
        }

        const passwordMatch = await bcrypt.compare(credentials.password, passwordHash);

        if (!passwordMatch) {
          console.log("❌ Password mismatch");
          return null;
        }

        console.log("✅ Password matched! Returning user");

        return {
          id: String(user.id),
          name: user.full_name || user.name || user.fullName,
          email: user.email,
          role: user.role || "customer",
        };
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }: any) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }: any) {
      if (token) {
        session.user.id = token.id;
        session.user.role = token.role;
      }
      return session;
    },
  },

  pages: { signIn: "/login" },
  session: { strategy: "jwt" as const },
  secret: process.env.NEXTAUTH_SECRET,
  debug: true,
};