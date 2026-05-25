import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ code: string }>;
};

function toOptionalNumber(value: FormDataEntryValue | null) {
  const raw = String(value || "").trim().replace(",", ".");
  if (!raw) return null;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : null;
}

export async function POST(request: NextRequest, context: RouteContext) {
  const { code } = await context.params;

  try {
    const formData = await request.formData();
    const itemId = BigInt(String(formData.get("itemId") || "0"));
    const lang = String(formData.get("lang") || "tr") === "en" ? "en" : "tr";
    const locationName = String(formData.get("locationName") || "").trim();
    const latitude = toOptionalNumber(formData.get("latitude"));
    const longitude = toOptionalNumber(formData.get("longitude"));
    const note = String(formData.get("note") || "").trim();

    const magnet = await prisma.magnets.findUnique({
      where: { magnet_code: code },
      include: { memory: true },
    });

    if (!magnet?.memory) {
      return NextResponse.redirect(new URL(`/m/${code}/edit?error=no-memory&lang=${lang}`, request.url), 303);
    }

    const item = await prisma.memory_items.findFirst({
      where: { id: itemId, memory_id: magnet.memory.id },
    });

    if (!item) {
      return NextResponse.redirect(new URL(`/m/${code}/edit?error=item-not-found&lang=${lang}`, request.url), 303);
    }

    await prisma.memory_items.update({
      where: { id: itemId },
      data: {
        location_name: locationName || null,
        latitude,
        longitude,
        content_text: note || item.content_text,
        content_text_tr: lang === "tr" ? note || item.content_text_tr : item.content_text_tr,
        content_text_en: lang === "en" ? note || item.content_text_en : item.content_text_en,
        updated_at: new Date(),
      },
    });

    return NextResponse.redirect(new URL(`/m/${code}/edit?updated=location&lang=${lang}`, request.url), 303);
  } catch (error) {
    console.error("Update item location error:", error);
    return NextResponse.redirect(new URL(`/m/${code}/edit?error=location-update-failed`, request.url), 303);
  }
}
