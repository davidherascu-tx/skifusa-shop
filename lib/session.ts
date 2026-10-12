import { cache } from "react";
import { headers } from "next/headers";
import { getAuth } from "@/lib/auth";

/** The signed-in user (or null). Cached for the duration of one request. */
export const getUser = cache(async () => {
  // headers() first: it marks the page as per-request, so nothing touches the database while `next build` pre-renders.
  const h = await headers();
  const session = await getAuth().api.getSession({ headers: h });
  return session?.user ?? null;
});
