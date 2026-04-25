import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { bucket } from "@/lib/storage";

async function deleteMemoryFiles(memoryId: bigint) {
  const prefix = `memories/${memoryId.toString()}/`;

  const [files] = await bucket.getFiles({
    prefix,
  });

  if (files.length === 0) {
    return;
  }

  await Promise.all(files.map((file) => file.delete()));
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const magnetCode = String(formData.get("magnetCode") || "").trim();

    if (!magnetCode) {
      return NextResponse.redirect(
        new URL("/admin?error=no-magnet-code", request.url),
        303
      );
    }

    const magnet = await prisma.magnets.findUnique({
      where: {
        magnet_code: magnetCode,
      },
      include: {
        memory: true,
      },
    });

    if (!magnet) {
      return NextResponse.redirect(
        new URL("/admin?error=magnet-not-found", request.url),
        303
      );
    }

    if (magnet.memory) {
      await deleteMemoryFiles(magnet.memory.id);
    }

    await prisma.$transaction(async (tx) => {
      if (magnet.memory) {
        await tx.memory_items.deleteMany({
          where: {
            memory_id: magnet.memory.id,
          },
        });

        await tx.memories.delete({
          where: {
            id: magnet.memory.id,
          },
        });
      }

      await tx.magnets.update({
        where: {
          id: magnet.id,
        },
        data: {
          user_id: null,
          is_active: false,
          first_activated_at: null,
        },
      });
    });

    return NextResponse.redirect(
      new URL("/admin?success=magnet-reset", request.url),
      303
    );
  } catch (error) {
    console.error("Reset magnet error:", error);

    return NextResponse.redirect(
      new URL("/admin?error=reset-failed", request.url),
      303
    );
  }
}