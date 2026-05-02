import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function createOrderCode() {
  return `MEM-${Date.now()}`;
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    const variantText = String(formData.get("variantText") || "").trim();
    const customText = String(formData.get("customText") || "").trim();

    const customerName = String(formData.get("customerName") || "").trim();
    const phoneNumber = String(formData.get("phoneNumber") || "").trim();
    const email = String(formData.get("email") || "").trim();

    const address = String(formData.get("address") || "").trim();
    const city = String(formData.get("city") || "").trim();
    const district = String(formData.get("district") || "").trim();
    const postalCode = String(formData.get("postalCode") || "").trim();

    const identityNumber = String(formData.get("identityNumber") || "").trim();
    const taxNumber = String(formData.get("taxNumber") || "").trim();

    if (!variantText || !customerName || !phoneNumber || !address || !city) {
      return NextResponse.redirect(
        new URL("/shop?error=missing-fields", request.url),
        303
      );
    }

    const order = await prisma.orders.create({
      data: {
        order_code: createOrderCode(),
        status: "pending",
        product_name: "5x8 cm NFC Taş Magnet",
        variant_text: variantText,
        custom_text: customText || null,
        customer_name: customerName,
        phone_number: phoneNumber,
        email: email || null,
        identity_number: identityNumber || null,
        tax_number: taxNumber || null,
        address,
        city,
        district: district || null,
        postal_code: postalCode || null,
        price: "399.00",
        currency: "TRY",
      },
    });

    return NextResponse.redirect(
      new URL(`/checkout/${order.order_code}`, request.url),
      303
    );
  } catch (error) {
    console.error("Create order error:", error);

    return NextResponse.redirect(
      new URL("/shop?error=order-create-failed", request.url),
      303
    );
  }
}