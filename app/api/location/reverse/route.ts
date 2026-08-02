import { NextRequest, NextResponse } from "next/server";
import { reverseLocation } from "@/lib/nominatim";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const latitude = Number(request.nextUrl.searchParams.get("lat"));
  const longitude = Number(request.nextUrl.searchParams.get("lon"));

  if (
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude) ||
    latitude < -90 ||
    latitude > 90 ||
    longitude < -180 ||
    longitude > 180
  ) {
    return NextResponse.json(
      { error: "Ge\u00e7erli bir enlem ve boylam g\u00f6nderilmelidir." },
      { status: 400 }
    );
  }

  try {
    const result = await reverseLocation(latitude, longitude);
    if (!result) {
      return NextResponse.json(
        { error: "Bu nokta i\u00e7in konum ad\u0131 bulunamad\u0131." },
        { status: 404 }
      );
    }
    return NextResponse.json(result, {
      headers: {
        "Cache-Control": "public, max-age=300, stale-while-revalidate=86400",
      },
    });
  } catch (error) {
    console.error("Reverse location error:", error);
    return NextResponse.json(
      { error: "Konum bilgisi \u015fu anda al\u0131nam\u0131yor." },
      { status: 503 }
    );
  }
}
