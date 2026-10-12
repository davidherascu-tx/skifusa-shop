// Creates (or upgrades) an admin account WITHOUT any email confirmation.
// Usage:  npm run create-admin -- you@example.com "YourPassword" "Your Name"
// Needs DATABASE_URL_DIRECT (or DATABASE_URL) in .env.local (run by `npm run create-admin`).
import { randomUUID } from "node:crypto";
import { Pool, neonConfig } from "@neondatabase/serverless";
import { hashPassword } from "better-auth/crypto";
import ws from "ws";

neonConfig.webSocketConstructor = ws;

const [rawEmail, password, fullName = "Admin"] = process.argv.slice(2);

if (!rawEmail || !password) {
  console.error('Usage: npm run create-admin -- you@example.com "YourPassword" "Your Name"');
  process.exit(1);
}
if (password.length < 8) {
  console.error("Password must be at least 8 characters.");
  process.exit(1);
}
const url = process.env.DATABASE_URL_DIRECT || process.env.DATABASE_URL;
if (!url) {
  console.error("Missing DATABASE_URL_DIRECT / DATABASE_URL in .env.local");
  process.exit(1);
}

const email = rawEmail.trim().toLowerCase();
const pool = new Pool({ connectionString: url });

try {
  const passwordHash = await hashPassword(password);
  const existing = await pool.query('select id from "user" where email = $1', [email]);
  let userId;

  if (existing.rows.length) {
    // Already registered: confirm it and set the new password.
    userId = existing.rows[0].id;
    await pool.query('update "user" set email_verified = true, updated_at = now() where id = $1', [userId]);
    const updated = await pool.query("update account set password = $1, updated_at = now() where user_id = $2 and provider_id = 'credential'", [passwordHash, userId]);
    if (!updated.rowCount) {
      await pool.query(
        "insert into account (id, account_id, provider_id, user_id, password) values ($1, $2, 'credential', $2, $3)",
        [randomUUID(), userId, passwordHash],
      );
    }
    console.log("Account already existed: password reset and email confirmed.");
  } else {
    userId = randomUUID();
    await pool.query('insert into "user" (id, name, email, email_verified) values ($1, $2, $3, true)', [userId, fullName, email]);
    await pool.query(
      "insert into account (id, account_id, provider_id, user_id, password) values ($1, $2, 'credential', $2, $3)",
      [randomUUID(), userId, passwordHash],
    );
  }

  await pool.query(
    `insert into profiles (id, full_name, is_admin, is_member) values ($1, $2, true, true)
     on conflict (id) do update set is_admin = true, is_member = true`,
    [userId, fullName],
  );

  console.log(`Done. ${email} is now an admin. Log in at /login, then open /admin.`);
} catch (e) {
  console.error("Could not create the admin:", e instanceof Error ? e.message : e);
  process.exitCode = 1;
} finally {
  await pool.end();
}
