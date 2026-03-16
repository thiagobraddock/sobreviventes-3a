import { NextResponse } from "next/server";
import { getRanking } from "@/lib/queries";

export async function GET() {
  try {
    const ranking = await getRanking();
    return NextResponse.json(ranking);
  } catch (error) {
    console.error("Failed to fetch ranking:", error);
    return NextResponse.json(
      { error: "Failed to fetch ranking" },
      { status: 500 }
    );
  }
}
