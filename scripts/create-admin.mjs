// Creates (or upgrades) an admin account WITHOUT any email confirmation.
// Usage:  npm run create-admin -- you@example.com "YourPassword" "Your Name"
// Needs NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local (run by `npm run create-admin`).
import { createClient } from "@supabase/supabase-js";

const [email, password, fullName = "Admin"] = process.argv.slice(2);

if (!email || !password) {
  console.error('Usage: npm run create-admin -- you@example.com "YourPassword" "Your Name"');
  process.exit(1);
}
if (password.length < 8) {
  console.error("Password must be at least 8 characters.");
  process.exit(1);
}
if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

let userId;
const created = await db.auth.admin.createUser({
  email,
  password,
  email_confirm: true, // no confirmation email needed
  user_metadata: { full_name: fullName },
});

if (created.error) {
  // Already registered: confirm it, set the new password, then promote it.
  const { data } = await db.auth.admin.listUsers({ perPage: 1000 });
  const existing = data?.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
  if (!existing) {
    console.error("Could not create the user:", created.error.message);
    process.exit(1);
  }
  const updated = await db.auth.admin.updateUserById(existing.id, { password, email_confirm: true });
  if (updated.error) {
    console.error("Could not update the existing user:", updated.error.message);
    process.exit(1);
  }
  userId = existing.id;
  console.log("Account already existed: password reset and email confirmed.");
} else {
  userId = created.data.user.id;
}

const { data: profile, error } = await db
  .from("profiles")
  .update({ is_admin: true, is_member: true })
  .eq("id", userId)
  .select("id");

if (error || !profile?.length) {
  console.error("The account exists, but could not be marked as admin:", error?.message ?? "profile row not found");
  process.exit(1);
}

console.log(`Done. ${email} is now an admin. Log in at /login, then open /admin.`);
