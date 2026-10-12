import { cache } from "react";
import { headers } from "next/headers";
import { getAuth } from "@/lib/auth";

/** The signed-in user (or null). Cached for the duration of one request. */
export const getUser = cache(async () => {
  const session = await getAuth().api.getSession({ headers: await headers() });
  return session?.user ?? null;
});
