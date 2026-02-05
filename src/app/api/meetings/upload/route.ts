import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { supabase } from "@/lib/supabase";
import sharp from "sharp";

const BUCKET_NAME = "photos";
const MAX_WIDTH = 1920;
const MAX_HEIGHT = 1080;

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
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(meetingId)) {
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

    // Get the current meeting to check if there's an existing photo
    const { data: meeting } = await supabase
      .from("meetings")
      .select("photo_url")
      .eq("id", meetingId)
      .single();

    // If there's an existing photo, delete it from storage
    if (meeting?.photo_url) {
      const oldFileName = meeting.photo_url.split("/").pop();
      if (oldFileName) {
        await supabase.storage.from(BUCKET_NAME).remove([oldFileName]);
      }
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

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(fileName, processedImage, {
        contentType: "image/webp",
        upsert: true,
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      
      // Check if bucket doesn't exist
      if (uploadError.message?.includes("Bucket not found")) {
        return NextResponse.json(
          { error: "Bucket de fotos não configurado. Crie o bucket 'meeting-photos' no Supabase." },
          { status: 500 }
        );
      }
      
      return NextResponse.json(
        { error: "Erro ao fazer upload da imagem" },
        { status: 500 }
      );
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(fileName);

    const photoUrl = urlData.publicUrl;

    // Update meeting with photo URL
    const { error: updateError } = await supabase
      .from("meetings")
      .update({ photo_url: photoUrl })
      .eq("id", meetingId);

    if (updateError) {
      console.error("Update error:", updateError);
      return NextResponse.json(
        { error: "Erro ao atualizar o encontro" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, photoUrl });
  } catch (error) {
    console.error("Error processing upload:", error);
    return NextResponse.json(
      { error: "Erro ao processar upload" },
      { status: 500 }
    );
  }
}
