import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { supabase } from "@/lib/supabase";
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

        console.log("🔍 Looking for user in Supabase...");

        const { data: user, error } = await supabase
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

        // Try different possible password field names
        const passwordHash = user.password_hash || user.passwordHash || user.password;
        
        if (!passwordHash) {
          console.error("❌ No password field found in user");
          console.log("Available fields:", Object.keys(user));
          return null;
        }

        console.log("🔑 Password hash field found: Yes");

        const passwordMatch = await bcrypt.compare(
          credentials.password,
          passwordHash
        );

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
      console.log("🔑 JWT callback - user:", user?.email);
      if (user) {
        token.id = user.id;
        token.role = user.role;
        console.log("🔑 JWT set with role:", user.role);
      }
      return token;
    },
    async session({ session, token }: any) {
      console.log("📋 Session callback - token role:", token?.role);
      if (token) {
        session.user.id = token.id;
        session.user.role = token.role;
        console.log("📋 Session set with role:", token.role);
      }
      return session;
    },
  },

  pages: {
    signIn: "/login",
  },

  session: {
    strategy: "jwt" as const,
  },

  secret: process.env.NEXTAUTH_SECRET,
  debug: true, // Enable debug mode for logging
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };