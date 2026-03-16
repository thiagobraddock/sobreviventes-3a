import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  getAttendanceForMeeting,
  replaceAttendanceForMeeting,
} from "@/lib/queries";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const meetingId = searchParams.get("meetingId");

  if (!meetingId || !UUID_REGEX.test(meetingId)) {
    return NextResponse.json(
      { error: "meetingId invalido" },
      { status: 400 }
    );
  }

  try {
    const memberIds = await getAttendanceForMeeting(meetingId);
    return NextResponse.json({ memberIds });
  } catch (error) {
    console.error("Failed to fetch attendance:", error);
    return NextResponse.json(
      { error: "Failed to fetch attendance" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  // Check authentication
  const cookieStore = await cookies();
  const session = cookieStore.get("admin_session");

  // Valida token de sessão (64 chars hex = sha256)
  if (!session?.value || session.value.length !== 64 || !/^[a-f0-9]+$/.test(session.value)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { meetingId, memberIds } = await request.json();

    if (!meetingId || !UUID_REGEX.test(meetingId)) {
      return NextResponse.json(
        { error: "meetingId invalido" },
        { status: 400 }
      );
    }

    const ids = Array.isArray(memberIds) ? memberIds : [];

    if (!ids.every((memberId) => typeof memberId === "string" && UUID_REGEX.test(memberId))) {
      return NextResponse.json(
        { error: "Lista de membros invalida" },
        { status: 400 }
      );
    }

    await replaceAttendanceForMeeting(meetingId, ids);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to save attendance:", error);
    return NextResponse.json(
      { error: "Failed to save attendance" },
      { status: 500 }
    );
  }
}
