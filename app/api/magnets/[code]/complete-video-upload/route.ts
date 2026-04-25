import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{
    code: string;
  }>;
};

export async function POST(request: NextRequest, context: RouteContext) {
  const { code } = await context.params;

  try {
    const body = await request.json();

    const title = String(body.title || "").trim();
    const filePath = String(body.filePath || "").trim();

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

    if (!filePath.startsWith(`memories/${magnet.memory.id}/`)) {
      return NextResponse.json({ error: "invalid-file-path" }, { status: 400 });
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

    const lastSortOrder =
      magnet.memory.memory_items.sort((a, b) => b.sort_order - a.sort_order)[0]
        ?.sort_order ?? 0;

    await prisma.memory_items.create({
      data: {
        memory_id: magnet.memory.id,
        item_type: "video",
        title: title || null,
        file_path: filePath,
        sort_order: lastSortOrder + 1,
        is_visible: true,
      },
    });

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error("Complete video upload error:", error);

    return NextResponse.json(
      { error: "complete-video-upload-failed" },
      { status: 500 }
    );
  }
}