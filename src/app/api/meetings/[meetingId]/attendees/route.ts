import { NextResponse } from "next/server";
import { getMeetingAttendees } from "@/lib/queries";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type Context = {
  params: Promise<{
    meetingId: string;
  }>;
};

export async function GET(_: Request, context: Context) {
  const { meetingId } = await context.params;

  if (!UUID_REGEX.test(meetingId)) {
    return NextResponse.json(
      { error: "meetingId invalido" },
      { status: 400 }
    );
  }

  try {
    const attendees = await getMeetingAttendees(meetingId);
    return NextResponse.json(attendees);
  } catch (error) {
    console.error("Failed to fetch meeting attendees:", error);
    return NextResponse.json(
      { error: "Failed to fetch meeting attendees" },
      { status: 500 }
    );
  }
}
