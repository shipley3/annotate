import { PrismaAdapter } from "@auth/prisma-adapter";
import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { prisma } from "./prisma";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: "jwt",
  },
  callbacks: {
    session: async ({ session, token }) => {
      if (session?.user) {
        session.user.id = token.sub!;
        session.user.role = token.role as "STUDENT" | "TEACHER";
      }
      return session;
    },
    jwt: async ({ token, user }) => {
      if (user) {
        token.role = user.role;
      }
      return token;
    },
    signIn: async ({ user, account }) => {
      // Check if this is a new user
      const existingUser = await prisma.user.findUnique({
        where: { email: user.email! },
      });

      if (!existingUser) {
        // For new users, check if their email is in the allowed teacher list
        const allowedTeacherEmails = process.env.ALLOWED_TEACHER_EMAILS?.split(",") || [];
        const isTeacher = allowedTeacherEmails.includes(user.email!);

        // Create new user with appropriate role
        await prisma.user.create({
          data: {
            email: user.email!,
            name: user.name,
            role: isTeacher ? "TEACHER" : "STUDENT",
          },
        });
      }

      return true;
    },
  },
  pages: {
    signIn: "/auth/signin",
  },
  debug: process.env.NODE_ENV === "development",
  trustHost: true,
}; 