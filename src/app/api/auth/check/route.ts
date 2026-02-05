import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET() {
  const cookieStore = await cookies();
  const session = cookieStore.get("admin_session");

  // Verifica se existe um token de sessão válido (64 chars hex = sha256)
  if (session?.value && session.value.length === 64 && /^[a-f0-9]+$/.test(session.value)) {
    return NextResponse.json({ authenticated: true });
  }

  return NextResponse.json({ authenticated: false }, { status: 401 });
}
