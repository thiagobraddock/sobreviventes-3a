import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import sharp from "sharp";
import { getMeetingById, updateMeetingPhotoUrl } from "@/lib/queries";
import {
  deleteUploadByPublicPath,
  writeUploadFile,
} from "@/lib/storage";

const MAX_WIDTH = 1920;
const MAX_HEIGHT = 1080;
const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(request: NextRequest) {
  // Check authentication
  const cookieStore = await cookies();
  const session = cookieStore.get("admin_session");

  // Valida token de sessão (64 chars hex = sha256)
  if (!session?.value || session.value.length !== 64 || !/^[a-f0-9]+$/.test(session.value)) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const meetingId = formData.get("meetingId") as string | null;

    if (!file || !meetingId) {
      return NextResponse.json(
        { error: "Arquivo e meetingId são obrigatórios" },
        { status: 400 }
      );
    }

    // Valida formato UUID do meetingId
    if (!UUID_REGEX.test(meetingId)) {
      return NextResponse.json(
        { error: "meetingId inválido" },
        { status: 400 }
      );
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "Apenas imagens são permitidas" },
        { status: 400 }
      );
    }

    const meeting = await getMeetingById(meetingId);

    if (!meeting) {
      return NextResponse.json(
        { error: "Encontro não encontrado" },
        { status: 404 }
      );
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Process image with sharp: resize and convert to WebP
    const processedImage = await sharp(buffer)
      .rotate() // Auto-rotate based on EXIF
      .resize(MAX_WIDTH, MAX_HEIGHT, {
        fit: "inside",
        withoutEnlargement: true,
      })
      .webp({ quality: 85 })
      .toBuffer();

    // Generate unique filename
    const fileName = `${meetingId}-${Date.now()}.webp`;
    const upload = await writeUploadFile(["meetings", fileName], processedImage);

    try {
      await updateMeetingPhotoUrl(meetingId, upload.publicPath);
    } catch (error) {
      await deleteUploadByPublicPath(upload.publicPath);
      console.error("Update error:", error);
      return NextResponse.json(
        { error: "Erro ao atualizar o encontro" },
        { status: 500 }
      );
    }

    if (meeting.photo_url && meeting.photo_url !== upload.publicPath) {
      try {
        await deleteUploadByPublicPath(meeting.photo_url);
      } catch (error) {
        console.warn("Failed to delete previous local photo:", error);
      }
    }

    return NextResponse.json({ success: true, photoUrl: upload.publicPath });
  } catch (error) {
    console.error("Error processing upload:", error);
    return NextResponse.json(
      { error: "Erro ao processar upload" },
      { status: 500 }
    );
  }
}
