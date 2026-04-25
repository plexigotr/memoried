import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { bucket } from "@/lib/storage";

type RouteContext = {
  params: Promise<{
    code: string;
  }>;
};

function cleanFileName(fileName: string) {
  return fileName.replace(/\s+/g, "-").replace(/[^\w.-]/g, "");
}

export async function POST(request: NextRequest, context: RouteContext) {
  const { code } = await context.params;

  try {
    const body = await request.json();

    const fileName = String(body.fileName || "video.mp4");
    const contentType = String(body.contentType || "video/mp4");

    if (!contentType.startsWith("video/")) {
      return NextResponse.json(
        { error: "invalid-file-type" },
        { status: 400 }
      );
    }

    const magnet = await prisma.magnets.findUnique({
      where: {
        magnet_code: code,
      },
      include: {
        user: true,
        memory: {
          include: {
            memory_items: true,
          },
        },
      },
    });

    if (!magnet || !magnet.memory) {
      return NextResponse.json({ error: "memory-not-found" }, { status: 404 });
    }

    const videoCount = magnet.memory.memory_items.filter(
      (item) => item.item_type === "video"
    ).length;

    const isPremium =
      magnet.user?.plan_type === "premium" &&
      magnet.user?.premium_until &&
      magnet.user.premium_until > new Date();

    const maxVideos = isPremium ? 10 : 1;

    if (videoCount >= maxVideos) {
      return NextResponse.json({ error: "video-limit" }, { status: 403 });
    }

    const safeFileName = cleanFileName(fileName);
    const filePath = `memories/${magnet.memory.id}/${Date.now()}-${safeFileName}`;

    const [uploadUrl] = await bucket.file(filePath).getSignedUrl({
      version: "v4",
      action: "write",
      expires: Date.now() + 1000 * 60 * 15,
      contentType,
    });

    return NextResponse.json({
      uploadUrl,
      filePath,
      contentType,
    });
  } catch (error) {
    console.error("Create video upload URL error:", error);

    return NextResponse.json(
      { error: "create-upload-url-failed" },
      { status: 500 }
    );
  }
}