import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ code: string }>;
};

export async function POST(request: NextRequest, context: RouteContext) {
  const { code } = await context.params;

  try {
    const formData = await request.formData();
    const itemIdRaw = String(formData.get("itemId") || "").trim();
    const locationName = String(formData.get("location_name") || "").trim();
    const latitudeRaw = String(formData.get("latitude") || "").trim();
    const longitudeRaw = String(formData.get("longitude") || "").trim();

    if (!itemIdRaw) {
      return NextResponse.json({ ok: false, error: "missing-item" }, { status: 400 });
    }

    const itemId = BigInt(itemIdRaw);
    const latitude = latitudeRaw ? Number(latitudeRaw) : null;
    const longitude = longitudeRaw ? Number(longitudeRaw) : null;
    const hasLocation =
      locationName &&
      latitude !== null &&
      longitude !== null &&
      Number.isFinite(latitude) &&
      Number.isFinite(longitude);

    const magnet = await prisma.magnets.findUnique({
      where: { magnet_code: code },
      include: { memory: true },
    });

    if (!magnet?.memory) {
      return NextResponse.json({ ok: false, error: "memory-not-found" }, { status: 404 });
    }

    await prisma.memory_items.updateMany({
      where: {
        id: itemId,
        memory_id: magnet.memory.id,
        item_type: "image",
      },
      data: {
        location_name: hasLocation ? locationName : null,
        latitude: hasLocation ? latitude : null,
        longitude: hasLocation ? longitude : null,
        updated_at: new Date(),
      },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Update item location error:", error);
    return NextResponse.json({ ok: false, error: "location-update-failed" }, { status: 500 });
  }
}
