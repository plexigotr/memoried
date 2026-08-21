import { Prisma } from "@prisma/client";

const activePreparationStatuses = new Set(["preparing", "ready_to_ship", "shipped"]);

export async function assignAvailableMagnet(
  tx: Prisma.TransactionClient,
  orderId: bigint,
) {
  const order = await tx.orders.findUnique({
    where: { id: orderId },
    select: { fulfillment_status: true, magnet_id: true },
  });

  if (!order) throw new Error("Order not found while assigning a magnet");

  if (order.magnet_id) {
    if (!activePreparationStatuses.has(order.fulfillment_status)) {
      return tx.orders.update({
        where: { id: orderId },
        data: { fulfillment_status: "preparing" },
      });
    }

    return order;
  }

  const availableMagnets = await tx.$queryRaw<Array<{ id: bigint }>>(Prisma.sql`
    SELECT m."id"
    FROM "magnets" m
    LEFT JOIN "orders" o ON o."magnet_id" = m."id"
    WHERE m."is_active" = false
      AND m."user_id" IS NULL
      AND o."id" IS NULL
    ORDER BY m."created_at" ASC, m."id" ASC
    FOR UPDATE OF m SKIP LOCKED
    LIMIT 1
  `);

  const availableMagnet = availableMagnets[0];

  if (!availableMagnet) {
    return tx.orders.update({
      where: { id: orderId },
      data: { fulfillment_status: "awaiting_magnet" },
    });
  }

  return tx.orders.update({
    where: { id: orderId },
    data: {
      fulfillment_status: "preparing",
      magnet_id: availableMagnet.id,
    },
  });
}
