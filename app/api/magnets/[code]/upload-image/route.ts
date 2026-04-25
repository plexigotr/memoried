import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { bucket } from "@/lib/storage";
import sharp from "sharp";

type RouteContext = {
  params: Promise<{
    code: string;
  }>;
};

export async function POST(request: NextRequest, context: RouteContext) {
  const { code } = await context.params;

  try {
    const formData = await request.formData();

    const title = String(formData.get("imageTitle") || "").trim();
    const file = formData.get("imageFile") as File | null;

    if (!file || file.size === 0) {
      return NextResponse.redirect(
        new URL(`/m/${code}/edit?error=no-file`, request.url),
        303
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
      return NextResponse.redirect(
        new URL(`/m/${code}/edit?error=no-memory`, request.url),
        303
      );
    }

    const imageCount = magnet.memory.memory_items.filter(
      (item) => item.item_type === "image"
    ).length;

    const isPremium =
      magnet.user?.plan_type === "premium" &&
      magnet.user?.premium_until &&
      magnet.user.premium_until > new Date();

    const maxPhotos = isPremium ? 30 : 10;

    if (imageCount >= maxPhotos) {
      return NextResponse.redirect(
        new URL(`/m/${code}/edit?error=image-limit`, request.url),
        303
      );
    }

  const bytes = await file.arrayBuffer();
  const originalBuffer = Buffer.from(bytes);
  
  let processedBuffer: Buffer = originalBuffer;
  let contentType = file.type || "application/octet-stream";
  let extension = "bin";

    try {
      const image = sharp(originalBuffer);
      const metadata = await image.metadata();

      const maxWidth = 1600;

      let resized = image;

      if (metadata.width && metadata.width > maxWidth) {
        resized = image.resize({
          width: maxWidth,
          withoutEnlargement: true,
        });
      }

      processedBuffer = await resized
        .webp({
          quality: 80,
        })
        .toBuffer();

      contentType = "image/webp";
      extension = "webp";
    } catch (err) {
      console.error("Image optimization error:", err);

      processedBuffer = originalBuffer;
      contentType = file.type || "application/octet-stream";

      const originalExtension = file.name.split(".").pop();
      extension = originalExtension || "bin";
    }

    const originalName = file.name
      .replace(/\.[^/.]+$/, "")
      .replace(/\s+/g, "-")
      .replace(/[^\w.-]/g, "");

    const safeFileName = `${Date.now()}-${originalName}.${extension}`;
    const filePath = `memories/${magnet.memory.id}/${safeFileName}`;

    const bucketFile = bucket.file(filePath);
    
    await bucketFile.save(processedBuffer, {
      resumable: false,
      metadata: {
        contentType,
      },
    });

    const lastSortOrder =
      magnet.memory.memory_items.sort((a, b) => b.sort_order - a.sort_order)[0]
        ?.sort_order ?? 0;

    await prisma.memory_items.create({
      data: {
        memory_id: magnet.memory.id,
        item_type: "image",
        title: title || null,
        file_path: filePath,
        sort_order: lastSortOrder + 1,
        is_visible: true,
      },
    });

    return NextResponse.redirect(new URL(`/m/${code}/edit`, request.url), 303);
  } catch (error) {
    console.error("Image upload error:", error);

    return NextResponse.redirect(
      new URL(`/m/${code}/edit?error=upload-failed`, request.url),
      303
    );
  }
}
