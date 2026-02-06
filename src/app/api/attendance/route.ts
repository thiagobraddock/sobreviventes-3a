import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getAttendanceForMeeting } from "@/lib/queries";
import { getSupabaseAdmin } from "@/lib/supabase-server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const meetingId = searchParams.get("meetingId");

  if (!meetingId) {
    return NextResponse.json(
      { error: "Missing meetingId" },
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

    if (!meetingId) {
      return NextResponse.json(
        { error: "Missing meetingId" },
        { status: 400 }
      );
    }

    const ids: string[] = memberIds || [];

    // Delete existing attendance for this meeting
    const { error: deleteError } = await getSupabaseAdmin()
      .from("attendance")
      .delete()
      .eq("meeting_id", meetingId);

    if (deleteError) throw deleteError;

    // Insert new attendance
    if (ids.length > 0) {
      const { error: insertError } = await getSupabaseAdmin()
        .from("attendance")
        .insert(ids.map((member_id: string) => ({ meeting_id: meetingId, member_id })));

      if (insertError) throw insertError;
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to save attendance:", error);
    return NextResponse.json(
      { error: "Failed to save attendance" },
      { status: 500 }
    );
  }
}
