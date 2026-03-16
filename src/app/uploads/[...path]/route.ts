import { NextResponse } from "next/server";
import { getContentType, readUploadFile } from "@/lib/storage";

type Context = {
  params: Promise<{
    path: string[];
  }>;
};

export async function GET(_: Request, context: Context) {
  const { path } = await context.params;

  if (!path.length) {
    return new NextResponse("Not found", { status: 404 });
  }

  try {
    const file = await readUploadFile(path);
    const fileName = path[path.length - 1];

    return new NextResponse(new Uint8Array(file), {
      headers: {
        "Content-Type": getContentType(fileName),
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error) {
    const nodeError = error as NodeJS.ErrnoException;

    if (nodeError.code === "ENOENT") {
      return new NextResponse("Not found", { status: 404 });
    }

    console.error("Failed to serve uploaded file:", error);
    return new NextResponse("Internal server error", { status: 500 });
  }
}
