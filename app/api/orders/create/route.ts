import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { allowRequest, requestIp } from "@/lib/rateLimit";

function createOrderCode() {
  return `MEM-${randomUUID().replace(/-/g, "").slice(0, 12).toUpperCase()}`;
}

function value(formData: FormData, name: string, maxLength: number) {
  return String(formData.get(name) || "").trim().slice(0, maxLength);
}

export async function POST(request: NextRequest) {
  try {
    const ip = requestIp(request.headers);
    if (!allowRequest(`order:create:${ip}`, 10, 15 * 60 * 1000)) {
      return NextResponse.json(
        { error: "rate-limited", message: "L\u00fctfen bir s\u00fcre sonra tekrar deneyin." },
        { status: 429 }
      );
    }

    const formData = await request.formData();
    const variantText = value(formData, "variantText", 100);
    const customText = value(formData, "customText", 100);
    const requestedPackage = value(formData, "packageType", 30);
    const packageType = requestedPackage === "premium" ? "premium" : "starter";
    const customerName = value(formData, "customerName", 255);
    const phoneNumber = value(formData, "phoneNumber", 30);
    const email = value(formData, "email", 255);
    const address = value(formData, "address", 2000);
    const city = value(formData, "city", 100);
    const district = value(formData, "district", 100) || value(formData, "ilce", 100);
    const postalCode = value(formData, "postalCode", 20);
    const identityNumber = value(formData, "identityNumber", 30);
    const taxNumber = value(formData, "taxNumber", 30);

    if (
      !variantText ||
      !customerName ||
      !phoneNumber ||
      !address ||
      !city ||
      !/^[+\d][\d\s()-]{8,24}$/.test(phoneNumber)
    ) {
      return NextResponse.json(
        { error: "invalid-fields", message: "L\u00fctfen zorunlu alanlar\u0131 ge\u00e7erli bi\u00e7imde doldurun." },
        { status: 400 }
      );
    }

    const selectedPackage =
      packageType === "premium"
        ? { name: "Premium Paket", price: "1249.90" }
        : { name: "Ba\u015flang\u0131\u00e7 Paketi", price: "749.90" };

    const order = await prisma.orders.create({
      data: {
        order_code: createOrderCode(),
        status: "pending",
        package_type: packageType,
        gift_package: formData.get("giftPackage")?.toString() === "yes" ? "yes" : "no",
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
      { error: "order-create-failed", message: "Sipari\u015f olu\u015fturulamad\u0131." },
      { status: 500 }
    );
  }
}
