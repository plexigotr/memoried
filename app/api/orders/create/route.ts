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

    const packageType = String(formData.get("packageType") || "starter").trim();

    const selectedPackage =
      packageType === "premium"
        ? {
            name: "Premium Paket",
            price: "1249.90",
          }
        : {
            name: "Başlangıç Paketi",
            price: "749.90",
          };

    const customerName = String(formData.get("customerName") || "").trim();
    const phoneNumber = String(formData.get("phoneNumber") || "").trim();
    const email = String(formData.get("email") || "").trim();

    const address = String(formData.get("address") || "").trim();
    const city = String(formData.get("city") || "").trim();

    const district = String(
      formData.get("district") || formData.get("ilce") || ""
    ).trim();

    const postalCode = String(formData.get("postalCode") || "").trim();
    const identityNumber = String(formData.get("identityNumber") || "").trim();
    const taxNumber = String(formData.get("taxNumber") || "").trim();

    if (!variantText || !customerName || !phoneNumber || !address || !city) {
      return NextResponse.json(
        {
          error: "missing-fields",
          message: "Lütfen zorunlu alanları doldur.",
        },
        { status: 400 }
      );
    }

    const order = await prisma.orders.create({
      data: {
        order_code: createOrderCode(),
        status: "pending",

        product_name: `Memoried Stone - ${selectedPackage.name}`,
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

        price: selectedPackage.price,
        currency: "TRY",
      },
    });

    return NextResponse.json({
      orderCode: order.order_code,
      checkoutUrl: `/checkout/${order.order_code}`,
    });
  } catch (error) {
    console.error("Create order error:", error);

    return NextResponse.json(
      {
        error: "order-create-failed",
        message: "Sipariş oluşturulamadı.",
      },
      { status: 500 }
    );
  }
}