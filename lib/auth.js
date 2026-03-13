import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";

export const authOptions = {
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            async profile(profile) {
                try {
                    await connectDB();
                    // Check if user exists, if not create as client
                    let user = await User.findOne({ email: profile.email });
                    if (!user) {
                        user = await User.create({
                            name: profile.name,
                            email: profile.email,
                            role: "client",
                            status: "active",
                        });
                    }
                    return {
                        id: user._id.toString(),
                        name: user.name,
                        email: user.email,
                        role: user.role,
                        permissions: user.permissions || [],
                        supportType: user.supportType,
                        company: user.company,
                        plan: user.plan,
                    };
                } catch (error) {
                    console.error("NextAuth profile callback error:", error);
                    return null;
                }
            },
        }),
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" }
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) {
                    throw new Error("Invalid credentials");
                }

                try {
                    await connectDB();
                    const user = await User.findOne({ email: credentials.email });

                    if (!user || !user.password) {
                        throw new Error("User not found or password not set");
                    }

                    const isPasswordValid = await bcrypt.compare(credentials.password, user.password);

                    if (!isPasswordValid) {
                        throw new Error("Invalid email or password");
                    }

                    return {
                        id: user._id.toString(),
                        name: user.name,
                        email: user.email,
                        role: user.role,
                        permissions: user.permissions || [],
                        supportType: user.supportType,
                        company: user.company,
                        plan: user.plan,
                    };
                } catch (error) {
                    console.error("NextAuth authorize error:", error);
                    throw error;
                }
            }
        })
    ],
    callbacks: {
        async jwt({ token, user, trigger, session }) {
            if (user) {
                token.id = user.id;
                token.role = user.role;
                token.permissions = user.permissions || [];
                token.supportType = user.supportType;
                token.company = user.company;
                token.plan = user.plan;
            }
            if (trigger === "update" && session) {
                return { ...token, ...session };
            }
            return token;
        },
        async session({ session, token }) {
            if (token) {
                session.user.id = token.id;
                session.user.role = token.role;
                session.user.permissions = token.permissions || [];
                session.user.supportType = token.supportType;
                session.user.company = token.company;
                session.user.plan = token.plan;
            }
            return session;
        },
        async signIn({ user, account, profile }) {
            if (account.provider === "google") {
                if (user.role && user.role !== "client") {
                    return false;
                }
            }
            return true;
        }
    },
    pages: {
        signIn: "/login",
        error: "/auth/error",
    },
    session: {
        strategy: "jwt",
        maxAge: 30 * 24 * 60 * 60,
    },
    secret: process.env.NEXTAUTH_SECRET,
    debug: process.env.NODE_ENV === "development",
};
