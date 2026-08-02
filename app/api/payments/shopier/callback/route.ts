import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get("content-type") || "";

    let data: Record<string, unknown> = {};

    if (contentType.includes("application/json")) {
      data = (await req.json()) as Record<string, unknown>;
    } else {
      const formData = await req.formData();
      formData.forEach((value, key) => {
        data[key] = value.toString();
      });
    }

    const shopierOrderId = data.orderid || data.order_id || data.id;
    const status =
      data.status || data.payment_status || data.order_status;

    if (!shopierOrderId) {
      return new NextResponse("missing shopier order id", { status: 400 });
    }

    /*
      Şimdilik webhook verisini yakalıyoruz.
      Bir sonraki adımda Shopier'in gönderdiği gerçek payload'a göre
      bizim MEM siparişiyle eşleştirme yapacağız.
    */

    return NextResponse.json({
      ok: true,
      received: true,
      shopierOrderId,
      status,
    });
  } catch (error) {
    console.error("Shopier webhook error:", error);
    return new NextResponse("webhook error", { status: 500 });
  }
}