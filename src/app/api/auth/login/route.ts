import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { randomBytes, createHash } from "crypto";

// Gera um token de sessão único baseado na senha + timestamp
function generateSessionToken(): string {
  const secret = process.env.ADMIN_PASSWORD || "";
  const timestamp = Date.now().toString();
  const random = randomBytes(16).toString("hex");
  return createHash("sha256").update(secret + timestamp + random).digest("hex");
}

export async function POST(request: Request) {
  const { password } = await request.json();

  if (password !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: "Invalid password" }, { status: 401 });
  }

  // Gera token único para esta sessão
  const sessionToken = generateSessionToken();

  // Set session cookie
  const cookieStore = await cookies();
  cookieStore.set("admin_session", sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: "/",
  });

  return NextResponse.json({ success: true });
}
