import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{ code: string }>;
};

export async function POST(request: NextRequest, context: RouteContext) {
  const { code } = await context.params;

  try {
    const body = await request.json();
    const order: string[] = Array.isArray(body?.order) ? body.order : [];

    if (order.length === 0) {
      return NextResponse.json({ error: "empty-order" }, { status: 400 });
    }

    const magnet = await prisma.magnets.findUnique({
      where: { magnet_code: code },
      include: { memory: true },
    });

    if (!magnet?.memory) {
      return NextResponse.json({ error: "no-memory" }, { status: 404 });
    }

    await prisma.$transaction(
      order.map((id, index) =>
        prisma.memory_items.updateMany({
          where: {
            id: BigInt(id),
            memory_id: magnet.memory!.id,
          },
          data: { sort_order: index + 1 },
        })
      )
    );

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Reorder items error:", error);
    return NextResponse.json({ error: "reorder-failed" }, { status: 500 });
  }
}
