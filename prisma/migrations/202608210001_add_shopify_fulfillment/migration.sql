ALTER TABLE "orders"
ADD COLUMN "magnet_id" BIGINT,
ADD COLUMN "fulfillment_status" VARCHAR(30) NOT NULL DEFAULT 'waiting_payment',
ADD COLUMN "ready_at" TIMESTAMPTZ(6);

UPDATE "orders"
SET "fulfillment_status" = CASE
  WHEN "status" = 'paid' THEN 'awaiting_magnet'
  ELSE 'waiting_payment'
END;

CREATE UNIQUE INDEX "orders_magnet_id_key" ON "orders"("magnet_id");
CREATE INDEX "orders_fulfillment_status_idx" ON "orders"("fulfillment_status");

ALTER TABLE "orders"
ADD CONSTRAINT "orders_magnet_id_fkey"
FOREIGN KEY ("magnet_id") REFERENCES "magnets"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
