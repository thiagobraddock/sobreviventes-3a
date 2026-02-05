import { NextResponse } from "next/server";
import { getAllMembers } from "@/lib/queries";

export async function GET() {
  try {
    const members = await getAllMembers();
    return NextResponse.json(members);
  } catch (error) {
    console.error("Failed to fetch members:", error);
    return NextResponse.json(
      { error: "Failed to fetch members" },
      { status: 500 }
    );
  }
}
