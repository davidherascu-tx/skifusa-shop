import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { account, getDb, profiles, session, user, verification } from "@/lib/db";
import { emailConfigured, sendEmail } from "@/lib/email";
import { resetPasswordEmail, verifyEmail } from "@/lib/email-templates";

function create() {
  const db = getDb();
  return betterAuth({
    baseURL: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
    secret: process.env.BETTER_AUTH_SECRET,
    database: drizzleAdapter(db, { provider: "pg", schema: { user, session, account, verification } }),
    emailAndPassword: {
      enabled: true,
      minPasswordLength: 8,
      // Like before: customers must confirm their email, but only once email sending (Resend) is set up.
      requireEmailVerification: emailConfigured(),
      resetPasswordTokenExpiresIn: 60 * 60, // 1 hour
      revokeSessionsOnPasswordReset: true, // signs out every device after a reset
      sendResetPassword: async ({ user: u, url }) => {
        await sendEmail({ to: u.email, ...resetPasswordEmail(url) });
      },
    },
    emailVerification: {
      sendOnSignUp: emailConfigured(),
      autoSignInAfterVerification: true,
      sendVerificationEmail: async ({ user: u, url }) => {
        await sendEmail({ to: u.email, ...verifyEmail(url) });
      },
    },
    databaseHooks: {
      user: {
        create: {
          // Every account gets a shop profile (member / admin flags, saved address).
          after: async (u) => {
            await db.insert(profiles).values({ id: u.id, full_name: u.name }).onConflictDoNothing();
          },
        },
      },
    },
    plugins: [nextCookies()], // keep this last: lets server actions set the session cookie
  });
}

let instance: ReturnType<typeof create> | undefined;
/** Lazy, so importing this file never needs DATABASE_URL (e.g. while `next build` collects pages). */
export const getAuth = () => (instance ??= create());
