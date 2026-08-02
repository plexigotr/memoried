import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSignedUploadUrl } from "@/lib/storage";

type RouteContext = {
  params: Promise<{ code: string }>;
};

function cleanFileName(name: string) {
  return name.replace(/\s+/g, "-").replace(/[^\w.-]/g, "");
}

export async function POST(request: NextRequest, context: RouteContext) {
  const { code } = await context.params;

  try {
    const body = await request.json();
    const fileName = String(body.fileName || "recording.webm");
    const contentType = String(body.contentType || "audio/webm");

    if (!contentType.startsWith("audio/")) {
      return NextResponse.json({ error: "invalid-file-type" }, { status: 400 });
    }

    const magnet = await prisma.magnets.findUnique({
      where: { magnet_code: code },
      include: { memory: true },
    });

    if (!magnet || !magnet.memory) {
      return NextResponse.json({ error: "memory-not-found" }, { status: 404 });
    }

    const safeFileName = cleanFileName(fileName);
    const filePath = `memories/${magnet.memory.id}/audios/${Date.now()}-${safeFileName}`;

    const uploadUrl = await getSignedUploadUrl(filePath, contentType);

    return NextResponse.json({ uploadUrl, filePath, contentType });
  } catch (error) {
    console.error("Create audio upload URL error:", error);
    return NextResponse.json({ error: "create-upload-url-failed" }, { status: 500 });
  }
}
