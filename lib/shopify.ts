import { createHmac, timingSafeEqual } from "node:crypto";

type ShopifyProperty = {
  name?: string | null;
  value?: string | null;
};

type ShopifyLineItem = {
  name?: string | null;
  price?: string | null;
  properties?: ShopifyProperty[] | null;
  title?: string | null;
  variant_title?: string | null;
};

type ShopifyAddress = {
  address1?: string | null;
  address2?: string | null;
  city?: string | null;
  country_code?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  phone?: string | null;
  province?: string | null;
  zip?: string | null;
};

export type ShopifyOrderWebhook = {
  billing_address?: ShopifyAddress | null;
  contact_email?: string | null;
  currency?: string | null;
  current_total_price?: string | null;
  customer?: {
    email?: string | null;
    first_name?: string | null;
    last_name?: string | null;
    phone?: string | null;
  } | null;
  email?: string | null;
  financial_status?: string | null;
  id?: number | string | null;
  line_items?: ShopifyLineItem[] | null;
  name?: string | null;
  phone?: string | null;
  shipping_address?: ShopifyAddress | null;
  total_price?: string | null;
};

function safeText(value: unknown, maxLength: number) {
  return String(value ?? "").trim().slice(0, maxLength);
}

function addressText(address?: ShopifyAddress | null) {
  return [address?.address1, address?.address2]
    .map((part) => safeText(part, 1000))
    .filter(Boolean)
    .join(", ")
    .slice(0, 2000);
}

function customerName(order: ShopifyOrderWebhook, address?: ShopifyAddress | null) {
  const fromAddress = [address?.first_name, address?.last_name]
    .map((part) => safeText(part, 120))
    .filter(Boolean)
    .join(" ");
  const fromCustomer = [order.customer?.first_name, order.customer?.last_name]
    .map((part) => safeText(part, 120))
    .filter(Boolean)
    .join(" ");

  return safeText(fromAddress || fromCustomer || "Shopify müşterisi", 255);
}

function propertyValue(item: ShopifyLineItem | undefined, propertyName: string) {
  const property = item?.properties?.find(
    (candidate) => safeText(candidate.name, 100).toLocaleLowerCase("tr-TR") === propertyName
  );
  return safeText(property?.value, 100);
}

export function verifyShopifyWebhook(rawBody: string, receivedHmac: string, secret: string) {
  if (!receivedHmac || !secret) return false;

  const expected = createHmac("sha256", secret).update(rawBody, "utf8").digest();
  let received: Buffer;

  try {
    received = Buffer.from(receivedHmac, "base64");
  } catch {
    return false;
  }

  return received.length === expected.length && timingSafeEqual(received, expected);
}

export function shopifyOrderData(order: ShopifyOrderWebhook) {
  const shopifyId = safeText(order.id, 40);
  if (!shopifyId) throw new Error("Shopify order id is missing");

  const lineItem =
    order.line_items?.find((item) =>
      safeText(item.title || item.name, 255).toLocaleLowerCase("tr-TR").includes("memoried")
    ) || order.line_items?.[0];
  const variantTitle = safeText(lineItem?.variant_title, 100);
  const packageType = variantTitle.toLocaleLowerCase("tr-TR").includes("premium")
    ? "premium"
    : "starter";
  const shippingAddress = order.shipping_address || order.billing_address;
  const financialStatus = safeText(order.financial_status, 40).toLowerCase();
  const isPaid = ["paid", "partially_paid", "partially_refunded"].includes(financialStatus);
  const engraving = propertyValue(lineItem, "magnet üzerindeki yazı");
  const giftPackage = propertyValue(lineItem, "hediye paketi").toLowerCase() === "evet";

  return {
    order_code: `SHP-${shopifyId}`,
    status: isPaid ? "paid" : "pending",
    package_type: packageType,
    gift_package: giftPackage ? "yes" : "no",
    product_name: safeText(
      lineItem?.name || lineItem?.title || `Memoried Stone - ${variantTitle || packageType}`,
      255
    ),
    variant_text: engraving || null,
    custom_text: engraving || null,
    customer_name: customerName(order, shippingAddress),
    phone_number: safeText(
      shippingAddress?.phone ||
        order.billing_address?.phone ||
        order.phone ||
        order.customer?.phone,
      30
    ),
    email:
      safeText(order.contact_email || order.email || order.customer?.email, 255) || null,
    address: addressText(shippingAddress) || "Shopify sipariş adresi",
    district: safeText(shippingAddress?.province, 100) || null,
    city: safeText(shippingAddress?.city, 100) || "-",
    postal_code: safeText(shippingAddress?.zip, 20) || null,
    price: safeText(order.current_total_price || order.total_price || lineItem?.price, 30) || "0.00",
    currency: safeText(order.currency, 10) || "TRY",
  };
}
