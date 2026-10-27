import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    GitHub({
      clientId: process.env.AUTH_GITHUB_ID || process.env.GITHUB_ID,
      clientSecret: process.env.AUTH_GITHUB_SECRET || process.env.GITHUB_SECRET,
    }),
    Google({
      clientId: process.env.AUTH_GOOGLE_ID || process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET || process.env.GOOGLE_CLIENT_SECRET,
    }),
    Credentials({
      id: "social-demo",
      name: "Social Demo Login",
      credentials: {
        name: { label: "Tên hiển thị", type: "text" },
        email: { label: "Email", type: "email" },
        provider: { label: "Nhà cung cấp", type: "text" },
        image: { label: "Avatar", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.name) return null;
        const name = String(credentials.name);
        const provider = String(credentials.provider || "google");
        const email = String(credentials.email || `${name.toLowerCase().replace(/\s+/g, ".")}@gmail.com`);
        const image = String(
          credentials.image ||
          `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`
        );

        return {
          id: `demo-${Date.now()}`,
          name,
          email,
          image,
        };
      },
    }),
  ],
  trustHost: true,
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.name = user.name;
        token.email = user.email;
        token.picture = user.image;
      }
      return token;
    },
    session({ session, token }) {
      if (token && session.user) {
        session.user.name = token.name as string;
        session.user.email = token.email as string;
        session.user.image = token.picture as string;
      }
      return session;
    },
  },
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || "nhom5_super_secret_jwt_key_xdpm_2026_vercel",
});
