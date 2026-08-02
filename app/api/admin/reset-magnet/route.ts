import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { deleteMediaPrefix } from "@/lib/storage";
import { hasAdminSession } from "@/lib/auth";

async function deleteMemoryFiles(memoryId: bigint) {
  const prefix = `memories/${memoryId.toString()}/`;

  await deleteMediaPrefix(prefix);
}

export async function POST(request: NextRequest) {
  try {
    if (!(await hasAdminSession())) {
      return NextResponse.redirect(
        new URL("/admin/login", request.url),
        303
      );
    }

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
    if (magnet.memory) {
      try {
        await deleteMemoryFiles(magnet.memory.id);
      } catch (storageError) {
        console.error("Reset magnet storage cleanup error:", storageError);
      }
    }


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