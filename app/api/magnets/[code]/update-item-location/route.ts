import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{
    code: string;
  }>;
};

export async function POST(request: NextRequest, context: RouteContext) {
  const { code } = await context.params;

  try {
    const formData = await request.formData();
    const itemIdRaw = String(formData.get("itemId") || "").trim();
    const lang = String(formData.get("lang") || "tr").trim();
    const locationName = String(formData.get("locationName") || "").trim();
    const latitudeRaw = String(formData.get("latitude") || "").trim();
    const longitudeRaw = String(formData.get("longitude") || "").trim();

    if (!itemIdRaw) {
      return NextResponse.redirect(
        new URL(`/m/${code}/edit?error=location-failed&lang=${lang}`, request.url),
        303
      );
    }

    const latitude = latitudeRaw ? Number(latitudeRaw) : null;
    const longitude = longitudeRaw ? Number(longitudeRaw) : null;
    const hasValidLocation =
      latitude !== null &&
      longitude !== null &&
      Number.isFinite(latitude) &&
      Number.isFinite(longitude);

    const magnet = await prisma.magnets.findUnique({
      where: { magnet_code: code },
      include: { memory: true },
    });

    if (!magnet?.memory) {
      return NextResponse.redirect(
        new URL(`/m/${code}/edit?error=no-memory&lang=${lang}`, request.url),
        303
      );
    }

    await prisma.memory_items.updateMany({
      where: {
        id: BigInt(itemIdRaw),
        memory_id: magnet.memory.id,
        item_type: "image",
      },
      data: {
        location_name: locationName || null,
        latitude: hasValidLocation ? latitude : null,
        longitude: hasValidLocation ? longitude : null,
      },
    });

    return NextResponse.redirect(
      new URL(`/m/${code}/edit?updated=location&lang=${lang}`, request.url),
      303
    );
  } catch (error) {
    console.error("Update item location error:", error);

    return NextResponse.redirect(
      new URL(`/m/${code}/edit?error=location-failed`, request.url),
      303
    );
  }
}
