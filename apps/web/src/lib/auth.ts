import { type NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

const NEXT_PUBLIC_API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1";
const API_URL = process.env.API_URL ?? NEXT_PUBLIC_API_URL;

/**
 * NextAuth.js configuration for FinSight.
 *
 * Uses a CredentialsProvider that authenticates against the Express backend.
 * The JWT callback stores the access/refresh tokens and user info.
 * The session callback exposes the access token and user data to the client.
 */
export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      id: "credentials",
      name: "Email & Password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          const response = await fetch(`${API_URL}/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: credentials.email,
              password: credentials.password,
            }),
          });

          if (!response.ok) {
            const error = await response.json().catch(() => null);
            throw new Error(error?.error?.message ?? "Invalid email or password");
          }

          const data = await response.json();

          // Expected response: { success, data: { user, accessToken, refreshToken } }
          if (data?.success && data?.data) {
            const { user, accessToken, refreshToken } = data.data;
            return {
              id: user.id,
              email: user.email,
              name: user.name,
              image: user.avatarUrl ?? null,
              accessToken,
              refreshToken,
              currency: user.currency,
            };
          }

          return null;
        } catch (error) {
          if (error instanceof Error) {
            throw error;
          }
          throw new Error("Authentication failed");
        }
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user, trigger, session }) {
      // Initial sign-in: persist tokens and user info on the JWT
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.picture = user.image;
        token.accessToken = (user as unknown as Record<string, unknown>).accessToken as string;
        token.refreshToken = (user as unknown as Record<string, unknown>).refreshToken as string;
        token.currency = (user as unknown as Record<string, unknown>).currency as string;
      }

      // Client-side session update (e.g. after profile edit)
      if (trigger === "update" && session) {
        if (session.name) token.name = session.name;
        if (session.currency) token.currency = session.currency;
      }

      return token;
    },

    async session({ session, token }) {
      // Expose token data on the session object for client-side use
      if (token) {
        session.user = {
          ...session.user,
          id: token.id as string,
          email: token.email as string,
          name: token.name as string,
          image: token.picture as string | null,
          currency: token.currency as string,
        };
        session.accessToken = token.accessToken as string;
      }

      return session;
    },
  },

  pages: {
    signIn: "/login",
    error: "/login",
  },

  session: {
    strategy: "jwt",
    maxAge: 7 * 24 * 60 * 60, // 7 days
  },

  secret: process.env.NEXTAUTH_SECRET,
};

// ---------------------------------------------------------------------------
// Type augmentations for NextAuth
// ---------------------------------------------------------------------------

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      image: string | null;
      currency: string;
    };
    accessToken: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    accessToken: string;
    refreshToken: string;
    currency: string;
  }
}
