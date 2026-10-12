import { NextResponse, type NextRequest } from "next/server";
import { headers } from "next/headers";
import { getAuth } from "@/lib/auth";

export async function POST(request: NextRequest) {
  await getAuth().api.signOut({ headers: await headers() });
  return NextResponse.redirect(new URL("/", request.url), { status: 303 });
}
