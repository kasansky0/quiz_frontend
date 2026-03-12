import NextAuth, { NextAuthOptions, Session } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { JWT } from "next-auth/jwt";

// 1️⃣ Extend JWT type
declare module "next-auth/jwt" {
    interface JWT {
        accessToken?: string;
        idToken?: string;
    }
}

// 2️⃣ Extend Session type
declare module "next-auth" {
    interface Session {
        accessToken?: string;
        idToken?: string;
        user: {
            id: string;
            name?: string | null;
            email?: string | null;
            image?: string | null;
        };
    }
}

export const authOptions: NextAuthOptions = {
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        }),
    ],
    secret: process.env.NEXTAUTH_SECRET,
    cookies: {
        sessionToken: {
            name: "__Secure-next-auth.session-token", // recommended for prod
            options: {
                httpOnly: true,
                sameSite: "none",  // allows cross-subdomain
                secure: true,      // HTTPS required
                path: "/",
                domain: ".netaprep.com", // optional; NextAuth uses the current domain by default
            },
        },
    },
    session: {
        strategy: "jwt",
        maxAge: 30 * 24 * 60 * 60, // 30 days
    },
    callbacks: {
        async jwt({ token, account }) {
            // Only run on first sign in
            if (account) {
                token.accessToken = account.access_token; // ← add this line
                token.idToken = account.id_token;         // ← keep this
            }
            return token;
        }
        ,
        async session({ session, token }) {
            if (session.user) {
                session.user.id = token.sub as string;
                session.accessToken = token.accessToken; // now TS knows about it
            }
            session.idToken = token.idToken;
            return session;
        },
    },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
