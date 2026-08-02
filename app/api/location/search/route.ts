import { NextRequest, NextResponse } from "next/server";
import { searchLocations } from "@/lib/nominatim";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q")?.trim() || "";

  if (query.length < 3 || query.length > 120) {
    return NextResponse.json(
      { error: "Arama metni 3-120 karakter aras\u0131nda olmal\u0131d\u0131r." },
      { status: 400 }
    );
  }

  try {
    const results = await searchLocations(query);
    return NextResponse.json(results, {
      headers: {
        "Cache-Control": "public, max-age=300, stale-while-revalidate=86400",
      },
    });
  } catch (error) {
    console.error("Location search error:", error);
    return NextResponse.json(
      { error: "Konum aramas\u0131 \u015fu anda kullan\u0131lam\u0131yor." },
      { status: 503 }
    );
  }
}
